'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { register } from '@/store/slices/authSlice'
import { toast } from 'react-toastify'
import axios from 'axios'

export default function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole =
  typeof window !== 'undefined'
    ? ((searchParams.get('role') as 'customer' | 'vendor' | 'admin') || 'customer')
    : 'customer'
  const dispatch = useDispatch<AppDispatch>()
  const { loading } = useSelector((state: RootState) => state.auth)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phone_number: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  })
  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor' | 'admin'>(initialRole)
  const [vendorProfile, setVendorProfile] = useState({
    business_name: '',
    default_commission_rate: 10,
    description: '',
  })
  const [adminSecret, setAdminSecret] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState({
    phone: false,
    email: false,
  })
  const [otpSent, setOtpSent] = useState({
    phone: '',
    email: '',
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    setFormData({ ...formData, phone_number: value })
  }

  const handleSendPhoneOtp = async () => {
    if (formData.phone_number.length !== 10) {
      toast.error('Enter a valid 10-digit phone number before requesting OTP')
      return
    }

    try {
      setOtpLoading((prev) => ({ ...prev, phone: true }))
      const { data } = await axios.post(`${API_URL}/auth/send-phone-otp/`, {
        phone_number: formData.phone_number,
      })
      const message = data?.message || 'OTP sent to your phone'
      const devOtp = data?.dev_otp
      const displayMessage = devOtp ? `${message} • OTP: ${devOtp}` : message
      setOtpSent((prev) => ({ ...prev, phone: displayMessage }))
      toast.success(displayMessage)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to send phone OTP')
    } finally {
      setOtpLoading((prev) => ({ ...prev, phone: false }))
    }
  }

  const handleSendEmailOtp = async () => {
    if (!formData.email) {
      toast.error('Enter your email before requesting OTP')
      return
    }

    try {
      setOtpLoading((prev) => ({ ...prev, email: true }))
      const { data } = await axios.post(`${API_URL}/auth/send-email-otp/`, {
        email: formData.email,
      })
      const message = data?.message || 'OTP sent to your email'
      const devOtp = data?.dev_otp
      const displayMessage = devOtp ? `${message} • OTP: ${devOtp}` : message
      setOtpSent((prev) => ({ ...prev, email: displayMessage }))
      toast.success(displayMessage)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to send email OTP')
    } finally {
      setOtpLoading((prev) => ({ ...prev, email: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match')
      return
    }
    
    if (phoneOtp.length !== 6) {
      toast.error('Enter the 6-digit phone OTP')
      return
    }

    if (emailOtp.length !== 6) {
      toast.error('Enter the 6-digit email OTP')
      return
    }
    
    try {
      await dispatch(register({
        ...formData,
        role: selectedRole,
        phone_otp: phoneOtp,
        email_otp: emailOtp,
        vendor_profile: selectedRole === 'vendor' ? {
          business_name: vendorProfile.business_name,
          default_commission_rate: vendorProfile.default_commission_rate,
          description: vendorProfile.description,
        } : undefined,
        admin_secret: selectedRole === 'admin' ? adminSecret : undefined,
      })).unwrap()
      toast.success('Registration successful')
      if (selectedRole === 'vendor') {
        router.push('/dashboard/vendor')
      } else if (selectedRole === 'admin') {
        router.push('/dashboard/admin')
      } else {
      router.push('/')
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Registration failed'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4">
          <div className="card p-8">
            <div className="text-center mb-8 space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Join NextBloom</p>
              <h1 className="text-3xl font-bold">Create your account</h1>
              <div className="flex gap-2 justify-center mt-2">
                {['customer', 'vendor', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role as 'customer' | 'vendor' | 'admin')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                      selectedRole === role
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    {role === 'customer' ? 'Customer' : role === 'vendor' ? 'Vendor' : 'Admin'}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {selectedRole === 'customer' && 'Shop farm-fresh products effortlessly.'}
                {selectedRole === 'vendor' && 'Open a herbal storefront and list products for approval.'}
                {selectedRole === 'admin' && 'Manage vendor approvals and commissions securely.'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex flex-1">
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
                  <button
                    type="button"
                    className="btn-secondary whitespace-nowrap px-4"
                    onClick={handleSendPhoneOtp}
                    disabled={otpLoading.phone}
                  >
                    {otpLoading.phone ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit mobile number and request OTP
                </p>
                {otpSent.phone && (
                  <p className="text-xs text-green-600 mt-1">{otpSent.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone OTP</label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="input-field"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                    required
                />
                  <button
                    type="button"
                    className="btn-secondary whitespace-nowrap px-4"
                    onClick={handleSendEmailOtp}
                    disabled={otpLoading.email}
                  >
                    {otpLoading.email ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">We will verify this email with OTP</p>
                {otpSent.email && (
                  <p className="text-xs text-green-600 mt-1">{otpSent.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email OTP</label>
                <input
                  type="text"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="input-field"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-field"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  required
                  className="input-field"
                  minLength={8}
                />
              </div>
              </div>

              {selectedRole === 'vendor' && (
                <div className="space-y-4 border border-emerald-100 rounded-xl p-4 bg-emerald-50/40">
                  <p className="text-sm font-semibold text-emerald-700 uppercase">Vendor Details</p>
                  <div>
                    <label className="block text-sm font-medium mb-2">Store Name</label>
                    <input
                      type="text"
                      value={vendorProfile.business_name}
                      onChange={(e) => setVendorProfile({ ...vendorProfile, business_name: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Commission to Admin (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={vendorProfile.default_commission_rate}
                      onChange={(e) =>
                        setVendorProfile({ ...vendorProfile, default_commission_rate: Number(e.target.value) })
                      }
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Store Bio (optional)</label>
                    <textarea
                      value={vendorProfile.description}
                      onChange={(e) => setVendorProfile({ ...vendorProfile, description: e.target.value })}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'admin' && (
                <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50">
                  <label className="block text-sm font-medium mb-2">Admin Access Code</label>
                  <input
                    type="text"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Enter secure access code"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : selectedRole === 'vendor' ? 'Create Vendor Account' : 'Sign Up'}
              </button>

              <p className="text-sm text-center text-gray-500">
                Already have an account?{' '}
                <Link href={selectedRole === 'vendor' ? '/dashboard/vendor/login' : selectedRole === 'admin' ? '/dashboard/admin/login' : '/login'} className="text-primary-600 hover:underline">
                  Login here
                </Link>
              </p>
            </form>
            
            <p className="mt-6 text-center text-gray-600">
              Need a partner dashboard?{' '}
              <Link href="/dashboard/vendor" className="text-primary-600 hover:underline font-semibold">
                Explore vendor panel
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

