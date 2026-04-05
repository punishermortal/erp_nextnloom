'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import api from '@/lib/axios'
import { toast } from 'react-toastify'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  })
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.new_password !== formData.new_password2) {
      toast.error('New passwords do not match')
      return
    }
    
    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password/', formData)
      toast.success('Password changed successfully')
      router.push('/profile')
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.old_password?.[0] || 'Failed to change password')
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
            <h1 className="text-3xl font-bold text-center mb-8">Change Password</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.old_password}
                  onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Enter current password"
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
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

