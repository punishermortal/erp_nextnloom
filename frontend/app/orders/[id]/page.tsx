'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import api from '@/lib/axios'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

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
  status: string
  payment_status: string
  payment_method: string
  subtotal: string
  shipping_cost: string
  total: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip_code: string
  shipping_phone: string
  delivery_tracking_id?: string
  delivery_status?: string
  notes: string
  items: OrderItem[]
  created_at: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      fetchOrder()
    }
  }, [params.id, isAuthenticated, router, isMounted])

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}/`)
      setOrder(response.data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  // Always render consistent structure to prevent hydration errors
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div>Loading...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div>Redirecting to login...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div>Loading...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div>Order not found</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/orders" className="text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Orders
          </Link>
          
          <div className="card p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Order #{order.order_number}</h1>
                <p className="text-gray-500">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="px-4 py-2 rounded-full bg-primary-100 text-primary-800 font-semibold capitalize">
                  {order.status}
                </span>
                <p className="text-2xl font-bold mt-2">₹{order.total}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-gray-600">
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}<br />
                  Phone: {order.shipping_phone}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Payment Status</h3>
                <p className="text-gray-600 capitalize">{order.payment_status}</p>
                <p className="text-sm text-gray-500 mt-1">Method: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</p>
                {order.delivery_tracking_id && (
                  <div className="mt-2">
                    <h3 className="font-semibold mb-2">Tracking ID</h3>
                    <p className="text-gray-600">{order.delivery_tracking_id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center border-b pb-4 last:border-0 last:pb-0">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                    {item.product.primary_image || item.product.image ? (
                      <img
                        src={item.product.primary_image || item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U1ZTdlYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-gray-500 text-sm">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.total}</p>
                    <p className="text-sm text-gray-500">₹{item.price} each</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>₹{order.shipping_cost}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

