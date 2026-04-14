'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getErrorMessage } from '@/lib/errorHandler'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [formData, setFormData] = useState({
    phone_number: '',
    otp: '',
    new_password: '',
    new_password2: '',
  })
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    setFormData({ ...formData, phone_number: value })
  }

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password/`, {
        phone_number: formData.phone_number,
      })
      toast.success(response.data.message || 'OTP sent to your registered email')
      setOtpSent(true)
      setStep('reset')
      // In development, show OTP in console
      if (response.data.otp) {
        console.log('OTP:', response.data.otp)
        toast.info(`OTP: ${response.data.otp} (Check console for development)`)
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.new_password !== formData.new_password2) {
      toast.error('Passwords do not match')
      return
    }
    
    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/auth/reset-password/`, {
        phone_number: formData.phone_number,
        otp: formData.otp,
        new_password: formData.new_password,
        new_password2: formData.new_password2,
      })
      toast.success('Password reset successfully')
      router.push('/login')
    } catch (error: any) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4">
          <div className="card p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              {step === 'request' ? 'Forgot Password' : 'Reset Password'}
            </h1>
            
            {step === 'request' ? (
              <form onSubmit={handleRequestOTP} className="space-y-6">
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
                  <p className="text-xs text-gray-500 mt-1">Enter your registered phone number</p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {otpSent && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-green-800">
                      OTP has been sent to your registered email. Please check your inbox.
                    </p>
                  </div>
                )}
                
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
                      disabled
                      className="input-field rounded-l-none bg-gray-50"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">OTP</label>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    required
                    className="input-field"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    required
                    className="input-field"
                    placeholder="Enter new password"
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.new_password2}
                    onChange={(e) => setFormData({ ...formData, new_password2: e.target.value })}
                    required
                    className="input-field"
                    placeholder="Confirm new password"
                    minLength={8}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setStep('request')
                    setFormData({ ...formData, otp: '', new_password: '', new_password2: '' })
                    setOtpSent(false)
                  }}
                  className="w-full text-sm text-primary-600 hover:underline"
                >
                  Change Phone Number
                </button>
              </form>
            )}
            
            <p className="mt-6 text-center text-gray-600">
              Remember your password?{' '}
              <Link href="/login" className="text-primary-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

