'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { AppDispatch, RootState } from '@/store/store'
import { login } from '@/store/slices/authSlice'
import { getErrorMessage } from '@/lib/errorHandler'

export default function VendorLoginPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { loading } = useSelector((state: RootState) => state.auth)
  const [formData, setFormData] = useState({
    phone_number: '',
    password: '',
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    setFormData({ ...formData, phone_number: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(login({ ...formData, role: 'vendor' })).unwrap()
      toast.success('Welcome back, vendor!')
      router.push('/dashboard/vendor')
    } catch (error: any) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6 items-stretch">
        <div className="p-8 rounded-3xl bg-white/80 shadow-lg border border-emerald-100 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-500 mb-2">Vendor Portal</p>
          <h1 className="text-3xl font-bold text-emerald-900 mb-4">Manage your herbal storefront</h1>
          <p className="text-gray-600 leading-relaxed">
            Track approval requests, monitor sales, and add new organic products from a single, calming workspace.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-gray-600">
            <li>• Real-time approval status</li>
            <li>• Commission insights and payouts</li>
            <li>• Quick product publishing workflow</li>
          </ul>
          <div className="mt-8">
            <p className="text-sm text-gray-500">New to NextBloom?</p>
            <Link
              href="/register?role=vendor"
              className="inline-flex items-center mt-2 text-emerald-600 font-semibold hover:underline"
            >
              Create a vendor account →
            </Link>
          </div>
        </div>
        <div className="p-8 rounded-3xl bg-white shadow-xl border border-emerald-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={handlePhoneChange}
                  required
                  className="input-field rounded-l-none"
                  placeholder="Vendor mobile"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-emerald-600 hover:underline">
                Forgot password?
              </Link>
              <Link href="/login" className="text-gray-500 hover:text-gray-700">
                Back to customer login
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Login to Vendor Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


