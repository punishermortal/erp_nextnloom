'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface ReviewProduct {
  id: number
  name: string
  description: string
  commission_rate: string
  vendor?: {
    username?: string
    email?: string
    vendor_profile?: { business_name?: string }
  }
}

export default function AdminReviewPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [products, setProducts] = useState<ReviewProduct[]>([])
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/dashboard/admin/login')
      return
    }
    if (user && user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router, user])

  const fetchPending = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return
    try {
      setLoading(true)
      const response = await api.get('/products/admin/review/?status=pending')
      const list = Array.isArray(response.data) ? response.data : response.data.results || []
      setProducts(list)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load pending products')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleDecision = async (productId: number, action: 'approve' | 'reject') => {
    try {
      setSubmittingId(productId)
      await api.post(`/products/admin/review/${productId}/${action}/`, {
        admin_notes: notes[productId] || '',
      })
      toast.success(`Product ${action}d`)
      fetchPending()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${action} product`)
    } finally {
      setSubmittingId(null)
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Review Queue</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Approve vendor submissions</h1>
          <p className="text-gray-500 mt-1">Add contextual notes for vendors when approving or rejecting.</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
        >
          Logout
        </button>
      </div>

      <div className="space-y-6">
        {loading && <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-gray-500">Loading...</div>}
        {!loading && products.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-gray-500">
            Nothing to approve right now. Great job keeping things fresh!
          </div>
        )}

        {!loading &&
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">
                    {product.vendor?.vendor_profile?.business_name || product.vendor?.username || 'Vendor'}
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-900 mt-1">{product.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Commission {product.commission_rate}%</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              <textarea
                placeholder="Leave a note for the vendor (optional)"
                className="input-field"
                rows={3}
                value={notes[product.id] || ''}
                onChange={(e) => setNotes({ ...notes, [product.id]: e.target.value })}
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => handleDecision(product.id, 'reject')}
                  disabled={submittingId === product.id}
                  className="px-5 py-3 rounded-full border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition disabled:opacity-50"
                >
                  {submittingId === product.id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(product.id, 'approve')}
                  disabled={submittingId === product.id}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
                >
                  {submittingId === product.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}


