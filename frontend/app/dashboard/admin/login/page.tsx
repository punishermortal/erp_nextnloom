'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { AppDispatch, RootState } from '@/store/store'
import { login } from '@/store/slices/authSlice'
import { getErrorMessage } from '@/lib/errorHandler'

export default function AdminLoginPage() {
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
      await dispatch(login({ ...formData, role: 'admin' })).unwrap()
      toast.success('Welcome back, admin.')
      router.push('/dashboard/admin')
    } catch (error: any) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="max-w-5xl w-full grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-gradient-to-br from-emerald-400/20 to-lime-400/10 border border-white/10 rounded-3xl p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70 mb-3">Admin Command</p>
          <h1 className="text-4xl font-semibold mb-4">Control approvals & commissions</h1>
          <p className="text-white/70 leading-relaxed">
            Monitor vendor submissions, approve listings, and keep an eye on the commission pipeline with real-time stats.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-4 text-sm text-white/80">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase text-white/60">Pending Reviews</p>
              <p className="text-2xl font-bold mt-2">Live</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase text-white/60">Commission Rate</p>
              <p className="text-2xl font-bold mt-2">Configurable</p>
            </div>
          </div>
          <div className="mt-10">
            <p className="text-sm text-white/60">Need an admin profile?</p>
            <Link href="/register?role=admin" className="inline-flex items-center mt-2 text-emerald-200 hover:text-white font-semibold">
              Apply for access →
            </Link>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl p-10 text-gray-900 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Admin Login</h2>
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
                  placeholder="Administrator mobile"
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
                Customer login
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


