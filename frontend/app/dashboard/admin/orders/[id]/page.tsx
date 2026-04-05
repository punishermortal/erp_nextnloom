'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface OrderItem {
  id: number
  product: {
    id: number
    name: string
    image?: string
    primary_image?: string
    slug?: string
  }
  quantity: number
  price: string
  total: string
}

interface Order {
  id: number
  order_number: string
  user: {
    id: number
    email: string
    first_name?: string
    last_name?: string
    phone_number?: string
    username?: string
  }
  status: string
  payment_status: string
  payment_method: string
  total: string
  subtotal: string
  shipping_cost: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip_code: string
  shipping_phone: string
  created_at: string
  updated_at: string
  items: OrderItem[]
  delivery_tracking_id?: string
  delivery_status?: string
  delivery_tracking_link?: string
  notes?: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

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
    fetchOrder()
  }, [params.id, isAuthenticated, user])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/orders/${params.id}/`)
      setOrder(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load order')
      router.push('/dashboard/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    try {
      setUpdating(true)
      await api.patch(`/orders/${order.id}/`, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}`)
      fetchOrder()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const updatePaymentStatus = async (newStatus: string) => {
    if (!order) return
    try {
      setUpdating(true)
      await api.patch(`/orders/${order.id}/`, { payment_status: newStatus })
      toast.success(`Payment status updated to ${newStatus}`)
      fetchOrder()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  if (loading) {
    return (
      <div className="py-10 px-4 md:px-8 lg:px-16">
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-10 px-4 md:px-8 lg:px-16">
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <Link href="/dashboard/admin/orders" className="text-emerald-600 hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Order Details</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Order #{order.order_number}</h1>
          <p className="text-gray-500 mt-1">Complete order information and management</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/admin/orders"
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Back to Orders
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Order Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Status Card */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(e.target.value)}
                    disabled={updating}
                    className="ml-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                  <select
                    value={order.payment_status}
                    onChange={(e) => updatePaymentStatus(e.target.value)}
                    disabled={updating}
                    className="ml-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordered Products ({order.items.length})</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  {item.product.image || item.product.primary_image ? (
                    <img
                      src={item.product.image || item.product.primary_image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-400 text-xs">No Image</span></div>'
                        }
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.slug || item.product.id}`}
                      className="font-semibold text-gray-900 hover:text-emerald-600 transition"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-500">Price: ₹{item.price} each</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{item.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Address:</strong> {order.shipping_address}</p>
              <p><strong>City:</strong> {order.shipping_city}</p>
              <p><strong>State:</strong> {order.shipping_state}</p>
              <p><strong>Zip Code:</strong> {order.shipping_zip_code}</p>
              <p><strong>Phone:</strong> {order.shipping_phone}</p>
              {order.delivery_tracking_id && (
                <div className="mt-4 pt-4 border-t">
                  <p><strong>Tracking ID:</strong> {order.delivery_tracking_id}</p>
                  {order.delivery_tracking_link && (
                    <a
                      href={order.delivery_tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      Track on Delhivery →
                    </a>
                  )}
                  {order.delivery_status && (
                    <p className="mt-2"><strong>Delivery Status:</strong> {order.delivery_status}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">₹{order.shipping_cost}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-emerald-600">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {order.user.first_name && order.user.last_name 
                ? `${order.user.first_name} ${order.user.last_name}` 
                : order.user.username || 'N/A'}</p>
              <p><strong>Email:</strong> {order.user.email}</p>
              {order.user.phone_number && (
                <p><strong>Phone:</strong> {order.user.phone_number}</p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Method:</strong> <span className="capitalize">{order.payment_method}</span></p>
              <p><strong>Status:</strong> <span className="capitalize">{order.payment_status}</span></p>
              {order.razorpay_order_id && (
                <p><strong>Razorpay Order ID:</strong> {order.razorpay_order_id}</p>
              )}
              {order.razorpay_payment_id && (
                <p><strong>Razorpay Payment ID:</strong> {order.razorpay_payment_id}</p>
              )}
            </div>
          </div>

          {/* Order Dates */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {new Date(order.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

