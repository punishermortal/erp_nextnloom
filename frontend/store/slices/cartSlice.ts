import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface CartItem {
  id: number
  product: any
  quantity: number
  total_price: string
}

interface Cart {
  id: number
  items: CartItem[]
  total_items: number
  total_price: string
}

interface CartState {
  cart: Cart | null
  loading: boolean
}

const initialState: CartState = {
  cart: null,
  loading: false,
}

const getAuthHeaders = () => {
  const token = Cookies.get('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
  const response = await axios.get(`${API_URL}/cart/`, {
    headers: getAuthHeaders(),
  })
  return response.data
})

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product_id, quantity }: { product_id: number; quantity: number }) => {
    const response = await axios.post(
      `${API_URL}/cart/add_item/`,
      { product_id, quantity },
      { headers: getAuthHeaders() }
    )
    return response.data
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ item_id, quantity }: { item_id: number; quantity: number }) => {
    const response = await axios.put(
      `${API_URL}/cart/update_item/`,
      { item_id, quantity },
      { headers: getAuthHeaders() }
    )
    return response.data
  }
)

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (item_id: number) => {
    const response = await axios.delete(
      `${API_URL}/cart/remove_item/?item_id=${item_id}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.cart = action.payload
      })
      .addCase(fetchCart.rejected, (state) => {
        state.loading = false
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cart = action.payload
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = action.payload
      })
  },
})

export default cartSlice.reducer

