import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import { AdvancedCheckbox } from 'react-native-advanced-checkbox';
import type { WebView as WebViewType } from 'react-native-webview';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/hooks';
import { fetchData } from '../store/slices/dataSlice';
import type { RootState } from '../store/store';
import './main.css';

type SeriesVisibility = {
  open: boolean;
  high: boolean;
  low: boolean;
  close: boolean;
};

interface DataObject {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const formatData = (timestamp: number, price: number) => [timestamp * 1000, price];

const chartHtml = (
  data: DataObject[],
  zoomEnabled: boolean,
  title: string,
  seriesVisibility: SeriesVisibility
) => {
  const seriesData = [
    { name: 'Open', key: 'open', color: '#0a0a7c', visible: seriesVisibility.open },
    { name: 'High', key: 'high', color: '#e8618c', visible: seriesVisibility.high },
    { name: 'Low', key: 'low', color: '#21ccb2', visible: seriesVisibility.low },
    { name: 'Close', key: 'close', color: '#7f55e0', visible: seriesVisibility.close },
  ];

  const seriesJS = seriesData
    .filter(({ visible }) => visible)
    .map(({ name, key, color }) => {
      const dataPoints = JSON.stringify(data.map(d => formatData(Number(d.timestamp), d[key as keyof DataObject] as number)));
      return `{
        name: "${name}",
        data: ${dataPoints},
        color: "${color}",
        marker: { enabled: false, radius: 6, symbol: 'circle' }
      }`;
    })
    .join(',');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        #container { height: 100%; width: 100%; }
      </style>
      <script src="https://code.highcharts.com/stock/highstock.js"></script>
    </head>
    <body>
      <div id="container"></div>
      <script>
        const chart = Highcharts.stockChart('container', {
          chart: {
            backgroundColor: '#dee1e6',
            borderRadius: '15px',
            type: 'spline',
            zooming: { type: 'x' }
          },
          tooltip: { enabled: false },
          title: {
            text: ''
          },
          rangeSelector: { enabled: false },
          navigator: { enabled: false },
          xAxis: {
            crosshair: { width: 5, color: 'grey', dashStyle: 'Solid' },
            type: 'datetime',
            lineWidth: 2,
            dateTimeLabelFormats: { day: '%d/%m/%Y' },
            events: {
              afterSetExtremes: function (e) {
                // When extremes change, check if zoomed or reset
                const isZoomed = e.min !== e.dataMin || e.max !== e.dataMax;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'zoomChange', zoomed: isZoomed }));
              }
            }
          },
          yAxis: {
            gridLineDashStyle: 'Dash',
            gridLineColor: 'darkgrey',
            gridLineWidth: 2,
            title: { text: '' },
            labels: { formatter: function() { return '$' + this.value; } },
            lineColor: 'black',
            lineWidth: 2,
            opposite: false,
          },
          legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'top',
            symbolHeight: 12,
            symbolWidth: 12,
            symbolRadius: 6,
            symbol: 'circle',
            itemStyle: { color: '#333', fontWeight: 'bold' }
          },
          series: [${seriesJS}]
        });

        window.chart = chart;

        function handleMessage(event) {
          const data = event.data;
          if (data === 'resetZoom' && window.chart && window.chart.xAxis[0]) {
            window.chart.xAxis[0].setExtremes(null, null);
          }
        }

        window.addEventListener('message', handleMessage); // Android
        document.addEventListener('message', handleMessage); // iOS
      </script>
    </body>
  </html>`;
};

const Main = () => {
  const dispatch = useAppDispatch();
  const webviewRef = useRef<WebViewType>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const [seriesVisibility, setSeriesVisibility] = useState<SeriesVisibility>({
    open: true,
    high: true,
    low: true,
    close: true,
  });

  const data = useSelector((state: RootState) => state.data.data);
  const title = useSelector((state: RootState) => state.data.title);
  const zoomEnabled = useSelector((state: RootState) => state.data.zoomEnabled);

  const [chartHTML, setChartHTML] = useState('');

  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);

  useEffect(() => {
    if (data.length > 0) {
      setChartHTML(chartHtml(data, zoomEnabled, title, seriesVisibility));
    }
  }, [data, zoomEnabled, title, seriesVisibility]);

  const handleResetZoom = () => {
    webviewRef.current?.postMessage('resetZoom');
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const messageData = JSON.parse(event.nativeEvent.data);
      if (messageData.type === 'zoomChange') {
        setIsZoomed(messageData.zoomed);
      }
    } catch (e) {
      // Ignore invalid messages
    }
  };

  const handleCheckboxChange = (key: keyof SeriesVisibility, value: boolean) => {
    setSeriesVisibility(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={{ height: 450, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Image
          source={{ uri: 'https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8ed3d547-94ff-48e1-9f20-8c14a7030a02_2000x2000.jpeg' }}
          style={{ width: 44, height: 44, marginRight: 8, borderRadius: 4 }}
        />
        <Text style={{ fontSize: 28}}>{title} Market Data</Text>
      </View>
        {chartHTML ? (
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: chartHTML }}
            scalesPageToFit={false}
            style={{ flex: 1 }}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleWebViewMessage} 
            androidLayerType="hardware"
            injectedJavaScript={`
              const meta = document.createElement('meta');
              meta.setAttribute('name', 'viewport');
              meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
              document.getElementsByTagName('head')[0].appendChild(meta);
            `}
          />
        ) : (
          <Text>Loading chart...</Text>
        )}
      </View>

      <Text style={styles.header}>Display</Text>
      <View style={styles.checkboxContainer}>
        {(['open', 'high', 'low', 'close'] as (keyof SeriesVisibility)[]).map(key => (
          <AdvancedCheckbox
            key={key}
            value={seriesVisibility[key]}
            onValueChange={val => typeof val === 'boolean' && handleCheckboxChange(key, val)}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            checkedColor="#0a0a7c"
            uncheckedColor="#0a0a7c"
            size={14}
            style={{ marginBottom: 8 }}
          />
        ))}
<View style={[styles.resetButtonContainer, { backgroundColor: isZoomed ? 'black' : '#9095a1' }]}>
  <Button
    color="white"
    title="Reset Zoom"
    onPress={handleResetZoom}
    disabled={!isZoomed} // optionally disable button when not zoomed
  />
</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 50,
    flex: 1
  },
  header: {
    fontSize: 20,
    paddingVertical: 20,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flex: 1,
    paddingLeft: 0,
    position: 'relative',
  },
  resetButtonContainer: {
    position: 'absolute',
    right: 0,
    top: -30,
    borderRadius: 30,
    padding: 5,
  },
});

export default Main;
