'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { FiPackage, FiCheckCircle, FiClock, FiTrendingUp, FiPlusCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface VendorSummary {
  total_products: number
  pending_products: number
  approved_products: number
  rejected_products: number
  total_orders: number
  total_commission_paid: number
  total_earnings: number
}

interface VendorProduct {
  id: number
  name: string
  status: string
  commission_rate: string
  created_at: string
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [summary, setSummary] = useState<VendorSummary | null>(null)
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

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') return

    const fetchData = async () => {
      try {
        setLoading(true)
        const [summaryRes, productsRes] = await Promise.all([
          api.get('/products/vendor/products/summary/'),
          api.get('/products/vendor/products/'),
        ])
        setSummary(summaryRes.data)
        const list = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results || []
        setProducts(list.slice(0, 5))
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load vendor data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user])

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  const statusColor: Record<string, string> = {
    approved: 'text-emerald-600 bg-emerald-50',
    pending: 'text-amber-600 bg-amber-50',
    rejected: 'text-red-600 bg-red-50',
    draft: 'text-gray-600 bg-gray-100',
  }

  if (!isAuthenticated || user?.role !== 'vendor') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Vendor Control</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Welcome back, {user?.vendor_profile?.business_name || user?.first_name}</h1>
          <p className="text-gray-500 mt-1">Track approvals and earnings across your herbal catalog.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <Link
            href="/dashboard/vendor/products/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-xl transition"
          >
            <FiPlusCircle />
            Add Product
          </Link>
          <Link
            href="/dashboard/vendor/products"
            className="px-5 py-3 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
          >
            Manage Catalog
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FiPackage />}
          label="Total Products"
          value={summary?.total_products ?? 0}
          accent="from-emerald-100 to-white"
        />
        <StatCard
          icon={<FiClock />}
          label="Awaiting Approval"
          value={summary?.pending_products ?? 0}
          accent="from-amber-100 to-white"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Approved Listings"
          value={summary?.approved_products ?? 0}
          accent="from-lime-100 to-white"
        />
        <StatCard
          icon={<FiTrendingUp />}
          label="Total Earnings"
          value={`₹${(summary?.total_earnings ?? 0).toFixed(2)}`}
          accent="from-emerald-200 to-white"
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent submissions</h2>
              <p className="text-sm text-gray-500">Your latest products awaiting movement</p>
            </div>
            <Link href="/dashboard/vendor/products" className="text-sm text-emerald-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading && (
              <div className="p-6 text-gray-500 text-sm">Loading insights...</div>
            )}
            {!loading && products.length === 0 && (
              <div className="p-6 text-gray-500 text-sm">No products yet. Start by adding your first herbal item.</div>
            )}
            {products.map((product) => (
              <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">Commission: {product.commission_rate}%</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColor[product.status] || statusColor.draft
                  }`}
                >
                  {product.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Commission snapshot</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Total orders</span>
              <strong>{summary?.total_orders ?? 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Commission paid</span>
              <strong>₹{(summary?.total_commission_paid ?? 0).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Net earnings</span>
              <strong>₹{(summary?.total_earnings ?? 0).toFixed(2)}</strong>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Earnings refresh when new orders are approved and synced with your payout ledger.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div className={`rounded-3xl border border-white shadow-sm bg-gradient-to-br ${accent} p-6 flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 text-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}


