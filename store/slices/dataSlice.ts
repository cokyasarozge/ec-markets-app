import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
type Data = [number, number]

export const fetchData = createAsyncThunk("products/fetchProducts", async () => {
    const response = await fetch('https://mock.apidog.com/m1/892843-874692-default/marketdata/history/AAPL')
    const data = await response.json();
    return data; 
})

interface dataObject {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface dataType {
    data: dataObject[] | [];
    isLoading: boolean;
    error: string | null;
    zoomEnabled: boolean;
    title: string;
}


const initialState: dataType = {
  data: [],
  isLoading: false,
  error: '',
  zoomEnabled: true,
  title: ''
};

export const dataSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    toggleZoom: (state) => {
        state.zoomEnabled = !state.zoomEnabled
    }
  },
  extraReducers: (builder) => {
        builder.addCase(fetchData.pending, (state) => {
            state.isLoading = true
        })
        .addCase(fetchData.fulfilled, (state,action) => {
            state.isLoading = false;
            state.data = action.payload.data
            state.title = action.payload.symbol
        })
        .addCase(fetchData.rejected, (state,action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch products'
        })
    }
});

export const { toggleZoom } = dataSlice.actions;
export default dataSlice.reducer;