import { Switch, View, Text, StyleSheet } from 'react-native';

const TogglePill = ({ zoomEnabled, handleZoomToggle }: { zoomEnabled: boolean; handleZoomToggle: () => void }) => (
<View style={styles.switchContainer}>
  <Text style={styles.switchLabel}>Zoom</Text>
  <Switch
    value={zoomEnabled}
    onValueChange={handleZoomToggle}
    trackColor={{ false: '', true: 'green' }}
    thumbColor={'#767577'}
    ios_backgroundColor="#3e3e3e"
  />
</View>
  );

  const styles = StyleSheet.create({
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
      },
      switchLabel: {
        marginRight: 10,
        fontSize: 16,
        fontWeight: '600',
      },
});
    

  export default TogglePill