'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { login } from '@/store/slices/authSlice'
import { toast } from 'react-toastify'
import { getErrorMessage } from '@/lib/errorHandler'
import { debugError } from '@/lib/debugError'

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { loading } = useSelector((state: RootState) => state.auth)
  const [formData, setFormData] = useState({
    phone_number: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(login({ ...formData, role: 'customer' })).unwrap()
      toast.success('Login successful')
      router.push('/')
    } catch (error: any) {
      const errorMessage = getErrorMessage(error)
      debugError(error)
      console.log('Extracted Error Message:', errorMessage)
      toast.error(errorMessage)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    setFormData({ ...formData, phone_number: value })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4">
          <div className="card p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    required
                    className="input-field rounded-l-none"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter your 10-digit mobile number</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <p className="mt-6 text-center text-gray-600">
              Don&rsquo;t have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
