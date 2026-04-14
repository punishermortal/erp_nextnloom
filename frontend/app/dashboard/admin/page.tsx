'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { FiUsers, FiShoppingBag, FiShield, FiCheckSquare, FiPackage, FiDollarSign } from 'react-icons/fi'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface AdminSummary {
  pending_products: number
  approved_products: number
  rejected_products: number
  total_orders: number
  total_commission_collected: number
  gross_sales: number
}

interface Order {
  id: number
  order_number: string
  user: {
    email: string
    first_name?: string
    last_name?: string
  }
  status: string
  payment_status: string
  payment_method: string
  total: string
  created_at: string
  items: Array<{
    id: number
    product: {
      id: number
      name: string
    }
    quantity: number
    price: string
    total: string
  }>
}

interface ReviewProduct {
  id: number
  name: string
  commission_rate: string
  vendor?: { username?: string; email?: string; vendor_profile?: { business_name?: string } }
  status: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [pending, setPending] = useState<ReviewProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/dashboard/admin/login')
      return
    }
    if (user && user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router, user])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return
    const fetchData = async () => {
      try {
        setLoading(true)
        const [summaryRes, pendingRes] = await Promise.all([
          api.get('/products/admin/review/summary/'),
          api.get('/products/admin/review/?status=pending'),
        ])
        setSummary(summaryRes.data)
        const list = Array.isArray(pendingRes.data) ? pendingRes.data : pendingRes.data.results || []
        setPending(list.slice(0, 5))
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        const response = await api.get('/orders/')
        const ordersList = Array.isArray(response.data) ? response.data : response.data.results || []
        setOrders(ordersList.slice(0, 10)) // Show latest 10 orders
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load orders')
      } finally {
        setOrdersLoading(false)
      }
    }
    fetchOrders()
  }, [isAuthenticated, user])

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-3xl p-8 shadow-lg">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Admin Panel</p>
          <h1 className="text-3xl font-bold text-white">Nex Blooms approvals</h1>
          <p className="text-white/70 mt-1">Oversee vendor submissions and commission performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/admin/products"
            className="px-5 py-3 rounded-full bg-white/20 text-white font-semibold border border-white/40 hover:bg-white/30 transition"
          >
            Manage Products
          </Link>
          <Link
            href="/dashboard/admin/categories"
            className="px-5 py-3 rounded-full bg-white/20 text-white font-semibold border border-white/40 hover:bg-white/30 transition"
          >
            Manage Categories
          </Link>
          <Link
            href="/dashboard/admin/orders"
            className="px-5 py-3 rounded-full bg-white/20 text-white font-semibold border border-white/40 hover:bg-white/30 transition"
          >
            View Orders
          </Link>
          <Link
            href="/dashboard/admin/review"
            className="px-5 py-3 rounded-full bg-white text-emerald-700 font-semibold shadow-lg hover:shadow-xl transition"
          >
            Go to review queue
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminCard icon={<FiUsers />} label="Pending Vendors" value={summary?.pending_products ?? 0} />
        <AdminCard icon={<FiCheckSquare />} label="Approved Products" value={summary?.approved_products ?? 0} />
        <AdminCard icon={<FiPackage />} label="Total Orders" value={orders.length} />
        <AdminCard icon={<FiShoppingBag />} label="Gross Sales" value={`₹${(summary?.gross_sales ?? 0).toFixed(2)}`} />
        <AdminCard
          icon={<FiShield />}
          label="Commission Collected"
          value={`₹${(summary?.total_commission_collected ?? 0).toFixed(2)}`}
        />
      </div>

      {/* Recent Orders Section */}
      <div className="mt-10 bg-white/80 rounded-3xl border border-white/20 shadow-xl backdrop-blur p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Customer Orders</h2>
            <p className="text-sm text-gray-500">Latest orders from customers</p>
          </div>
          <Link href="/dashboard/admin/orders" className="text-sm text-emerald-600 hover:underline">
            View all
          </Link>
        </div>
        {ordersLoading && <p className="text-gray-500 text-sm">Loading orders...</p>}
        {!ordersLoading && orders.length === 0 && (
          <p className="text-gray-500 text-sm">No orders yet. Orders will appear here when customers place them.</p>
        )}
        {!ordersLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">Order #{order.order_number}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        order.payment_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Customer: {order.user.first_name && order.user.last_name 
                        ? `${order.user.first_name} ${order.user.last_name}` 
                        : order.user.email}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <span key={item.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {item.product.name} (x{item.quantity})
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{order.total}</p>
                    <p className="text-xs text-gray-500 capitalize">{order.payment_method}</p>
                    <Link 
                      href={`/dashboard/admin/orders/${order.id}`}
                      className="text-sm text-emerald-600 hover:underline mt-2 inline-block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 bg-white/80 rounded-3xl border border-white/20 shadow-xl backdrop-blur p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pending approvals</h2>
            <p className="text-sm text-gray-500">Quick glance at recent vendor submissions</p>
          </div>
          <Link href="/dashboard/admin/review" className="text-sm text-emerald-600 hover:underline">
            View all
          </Link>
        </div>
        {loading && <p className="text-gray-500 text-sm">Loading queue...</p>}
        {!loading && pending.length === 0 && (
          <p className="text-gray-500 text-sm">No pending approvals. Enjoy a tea break!</p>
        )}
        {!loading &&
          pending.map((product) => (
            <div key={product.id} className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {product.vendor?.vendor_profile?.business_name || product.vendor?.username || 'Vendor'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Commission {product.commission_rate}%</p>
                <Link href="/dashboard/admin/review" className="text-emerald-600 text-sm font-semibold hover:underline">
                  Review
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

function AdminCard({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-3xl bg-white/90 border border-white/40 shadow p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}


