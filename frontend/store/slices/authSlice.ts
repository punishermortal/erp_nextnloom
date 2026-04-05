import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

type UserRole = 'customer' | 'vendor' | 'admin'

interface VendorProfile {
  business_name?: string
  business_email?: string
  business_phone?: string
  default_commission_rate?: number
  description?: string
}

interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: UserRole
  phone_number?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  is_staff?: boolean 
  vendor_profile?: VendorProfile | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get('access_token') || null,
  isAuthenticated: !!Cookies.get('access_token'),
  loading: false,
}

interface LoginPayload {
  phone_number: string
  password: string
  role?: UserRole
}

interface RegisterPayload {
    email?: string
    phone_number: string
    password: string
    password2: string
    username: string
    first_name: string
    last_name: string
  phone_otp: string
  email_otp: string
  role: UserRole
  vendor_profile?: VendorProfile
  admin_secret?: string
}

export const login = createAsyncThunk('auth/login', async (credentials: LoginPayload) => {
  const response = await axios.post(`${API_URL}/auth/login/`, credentials)
  const { access, refresh, user } = response.data
  Cookies.set('access_token', access, { expires: 1 })
  Cookies.set('refresh_token', refresh, { expires: 7 })
  return { user, token: access }
})

export const register = createAsyncThunk('auth/register', async (userData: RegisterPayload) => {
    const response = await axios.post(`${API_URL}/auth/register/`, userData)
    const { access, refresh, user } = response.data
    Cookies.set('access_token', access, { expires: 1 })
    Cookies.set('refresh_token', refresh, { expires: 7 })
    return { user, token: access }
})

export const loadCurrentUser = createAsyncThunk('auth/loadCurrentUser', async () => {
  const token = Cookies.get('access_token')
  if (!token) {
    throw new Error('Not authenticated')
  }
  const response = await axios.get(`${API_URL}/auth/profile/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
})

export const logout = createAsyncThunk('auth/logout', async () => {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state) => {
        state.loading = false
      })
      .addCase(register.pending, (state) => {
        state.loading = true
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(register.rejected, (state) => {
        state.loading = false
      })
      .addCase(loadCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.loading = false
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { setUser, clearAuth } = authSlice.actions
export default authSlice.reducer

