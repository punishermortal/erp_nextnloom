import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://nexblooms.com/api',
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get('access_token')

    if (token) {
      if (config.headers?.set) {
        // Axios v1 native API
        config.headers.set('Authorization', `Bearer ${token}`)
      } else {
        // Fallback for edge cases
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
  }
  return config
})

export default api

