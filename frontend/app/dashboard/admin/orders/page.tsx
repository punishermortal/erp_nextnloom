'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  }
  quantity: number
  price: string
  total: string
}

interface Order {
  id: number
  order_number: string
  user: {
    email: string
    first_name?: string
    last_name?: string
    phone_number?: string
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
  items: OrderItem[]
  delivery_tracking_id?: string
  delivery_status?: string
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/dashboard/admin/login')
      return
    }
    if (user && user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router, user])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders/')
      let ordersList = Array.isArray(response.data) ? response.data : response.data.results || []
      
      // Apply filter
      if (filter !== 'all') {
        ordersList = ordersList.filter((order: Order) => order.status === filter)
      }
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        ordersList = ordersList.filter((order: Order) => 
          order.order_number.toLowerCase().includes(query) ||
          order.user.email.toLowerCase().includes(query) ||
          order.user.first_name?.toLowerCase().includes(query) ||
          order.user.last_name?.toLowerCase().includes(query) ||
          order.shipping_phone?.includes(query) ||
          order.shipping_city?.toLowerCase().includes(query) ||
          order.delivery_tracking_id?.toLowerCase().includes(query)
        )
      }
      
      // Sort by newest first
      ordersList.sort((a: Order, b: Order) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      setOrders(ordersList)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return
    fetchOrders()
  }, [isAuthenticated, user, fetchOrders])

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order')
      return
    }

    try {
      setBulkActionLoading(true)
      const updates = selectedOrders.map(orderId => 
        api.patch(`/orders/${orderId}/`, { status: action })
      )
      await Promise.all(updates)
      toast.success(`${selectedOrders.length} order(s) updated to ${action}`)
      setSelectedOrders([])
      fetchOrders()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update orders')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const refreshDeliveryStatus = async (orderId: number, trackingId: string) => {
    try {
      // This would call a backend endpoint to refresh from Delhivery
      toast.info('Refreshing delivery status...')
      // For now, just refetch the order
      const response = await api.get(`/orders/${orderId}/`)
      setOrders(orders.map(o => o.id === orderId ? response.data : o))
      toast.success('Delivery status refreshed')
    } catch (error: any) {
      toast.error('Failed to refresh delivery status')
    }
  }

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o.id))
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'shipped':
        return 'bg-blue-100 text-blue-700'
      case 'processing':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-orange-100 text-orange-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Orders Management</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Customer Orders</h1>
          <p className="text-gray-500 mt-1">View and manage all customer orders</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/admin"
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by order number, customer email, phone, city, tracking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            onClick={fetchOrders}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Search
          </button>
        </div>

        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-sm font-semibold text-emerald-700">
              {selectedOrders.length} order(s) selected
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction('processing')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition disabled:opacity-50"
              >
                Mark Processing
              </button>
              <button
                onClick={() => handleBulkAction('shipped')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                Mark Shipped
              </button>
              <button
                onClick={() => handleBulkAction('delivered')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Mark Delivered
              </button>
              <button
                onClick={() => handleBulkAction('cancelled')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Mark Cancelled
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            filter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            filter === 'pending'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('processing')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            filter === 'processing'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Processing
        </button>
        <button
          onClick={() => setFilter('shipped')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            filter === 'shipped'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Shipped
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            filter === 'delivered'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Delivered
        </button>
      </div>

      {/* Orders List */}
      {loading && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-gray-500 text-center">
          Loading orders...
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-gray-500 text-center">
          No orders found{filter !== 'all' ? ` with status "${filter}"` : ''}.
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedOrders.length === orders.length && orders.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Select All ({orders.length} orders)
            </span>
          </div>

          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
              <div className="flex items-start gap-4 mb-4">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => toggleOrderSelection(order.id)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 mt-1"
                />
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 className="text-xl font-semibold text-gray-900">Order #{order.order_number}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                          {order.payment_method}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Customer:</strong>{' '}
                        {order.user.first_name && order.user.last_name
                          ? `${order.user.first_name} ${order.user.last_name}`
                          : order.user.email}
                        {order.user.phone_number && ` (${order.user.phone_number})`}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Shipping:</strong> {order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_zip_code}
                      </p>
                      {order.delivery_tracking_id && (
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-sm text-emerald-600">
                            <strong>Tracking ID:</strong> {order.delivery_tracking_id}
                          </p>
                          <a
                            href={`https://www.delhivery.com/track/package/${order.delivery_tracking_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Track on Delhivery →
                          </a>
                          <button
                            onClick={() => refreshDeliveryStatus(order.id, order.delivery_tracking_id!)}
                            className="text-xs text-emerald-600 hover:underline"
                          >
                            Refresh Status
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">₹{order.total}</p>
                      <p className="text-sm text-gray-500">Subtotal: ₹{order.subtotal}</p>
                      {parseFloat(order.shipping_cost) > 0 && (
                        <p className="text-sm text-gray-500">Shipping: ₹{order.shipping_cost}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Ordered Products ({order.items.length}):</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        {item.product.image || item.product.primary_image ? (
                          <img
                            src={item.product.image || item.product.primary_image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-400 text-xs">No Image</span></div>'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-500">Price: ₹{item.price} each</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

