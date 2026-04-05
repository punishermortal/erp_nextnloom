'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiRefreshCw } from 'react-icons/fi'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface VendorProduct {
  id: number
  name: string
  status: string
  commission_rate: string
  is_active: boolean
  created_at: string
  admin_notes?: string
}

export default function VendorProductsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/dashboard/vendor/login')
      return
    }
    if (user && user.role !== 'vendor') {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router, user])

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'vendor') return
    try {
      setLoading(true)
      const response = await api.get('/products/vendor/products/')
      const list = Array.isArray(response.data) ? response.data : response.data.results || []
      setProducts(list)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  if (!isAuthenticated || user?.role !== 'vendor') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Catalog</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Your products</h1>
          <p className="text-gray-500 mt-1">Monitor approval status and commissions for each listing.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/dashboard/vendor/products/new"
            className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-xl transition"
          >
            Add Product
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-semibold text-gray-500 border-b border-emerald-50">
          <span className="col-span-4">Product</span>
          <span className="col-span-2">Commission</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-4 text-right">Notes</span>
        </div>
        {loading && <div className="p-6 text-gray-500 text-sm">Fetching your catalog...</div>}
        {!loading && products.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">No products added yet. Start by creating a listing.</div>
        )}
        {!loading &&
          products.map((product) => (
            <div key={product.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-emerald-50 text-sm items-center">
              <div className="col-span-4">
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">Created {new Date(product.created_at).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2 text-gray-700">{product.commission_rate}%</div>
              <div className="col-span-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-600'
                      : product.status === 'pending'
                      ? 'bg-amber-50 text-amber-600'
                      : product.status === 'rejected'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <div className="col-span-4 text-right text-gray-500 text-xs">
                {product.admin_notes || (product.status === 'pending' ? 'Awaiting admin review' : '—')}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}


