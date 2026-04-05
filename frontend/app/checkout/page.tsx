'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { fetchCart } from '@/store/slices/cartSlice'
import api from '@/lib/axios'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { FiCreditCard, FiDollarSign } from 'react-icons/fi'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { cart } = useSelector((state: RootState) => state.cart)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('cod')
  const [razorpayKey, setRazorpayKey] = useState<string>('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [razorpayKeyLoading, setRazorpayKeyLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    dispatch(fetchCart() as any)
    fetchRazorpayKey()
  }, [isAuthenticated, dispatch, router])

  const fetchRazorpayKey = async () => {
    try {
      setRazorpayKeyLoading(true)
      const response = await api.get('/orders/payment/razorpay-key/')
      if (response.data.key) {
        setRazorpayKey(response.data.key)
      }
    } catch (error) {
      console.error('Error fetching Razorpay key:', error)
      // Don't show error to user yet, will handle in payment flow
    } finally {
      setRazorpayKeyLoading(false)
    }
  }

  const handleRazorpayPayment = (orderData: any) => {
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error('Razorpay is not loaded. Please refresh the page and try again.')
      return
    }

    if (!razorpayKey) {
      toast.error('Razorpay key is not available. Please contact support.')
      return
    }

    const options = {
      key: razorpayKey,
      amount: Math.round(orderData.amount * 100), // Convert to paise
      currency: 'INR',
      name: 'NextBloom',
      description: `Order ${orderData.order_number}`,
      order_id: orderData.razorpay_order_id,
      handler: async function (response: any) {
        // Verify payment on backend
        try {
          const verifyResponse = await api.post('/orders/payment/verify/', {
            order_id: orderData.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })

          if (verifyResponse.data.success) {
            toast.success('Payment successful! Order placed.')
            // Clear cart after successful payment
            dispatch(fetchCart() as any)
            router.push(`/orders/${orderData.id}`)
          } else {
            toast.error('Payment verification failed')
          }
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Payment verification failed')
        }
      },
      prefill: {
        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Customer',
        email: user?.email || '',
        contact: orderData.shipping_phone || user?.phone_number || '',
      },
      notes: {
        order_id: orderData.order_number,
      },
      theme: {
        color: '#22c55e',
      },
      modal: {
        ondismiss: function () {
          toast.info('Payment cancelled. You can retry the payment from your orders.')
        },
      },
    }

    try {
      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response: any) {
        toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'))
      })
      razorpay.open()
    } catch (error: any) {
      toast.error('Failed to initialize payment: ' + (error.message || 'Unknown error'))
    }
  }

  const onSubmit = async (data: any) => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/orders/', {
        shipping_address: data.address,
        shipping_city: data.city,
        shipping_state: data.state,
        shipping_zip_code: data.zip_code,
        shipping_phone: data.phone,
        payment_method: paymentMethod,
        notes: data.notes || '',
      })

      const orderData = response.data

      if (paymentMethod === 'razorpay') {
        // Handle Razorpay payment - don't await, let modal handle it
        if (!orderData.razorpay_order_id) {
          toast.error('Failed to create payment order. Please try again or use COD.')
          setLoading(false)
          return
        }
        if (!razorpayKey) {
          toast.error('Razorpay is not configured. Please use COD or contact support.')
          setLoading(false)
          return
        }
        if (!razorpayLoaded || !window.Razorpay) {
          toast.error('Razorpay is still loading. Please wait a moment and try again.')
          setLoading(false)
          return
        }
        handleRazorpayPayment({
          ...orderData,
          amount: parseFloat(orderData.total),
          shipping_phone: data.phone,
        })
        setLoading(false) // Reset loading since payment modal handles the flow
      } else {
        // COD - order placed directly
        toast.success('Order placed successfully!')
        router.push(`/orders/${orderData.id}`)
        setLoading(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order')
      setLoading(false)
    }
  }

  if (!isAuthenticated || !cart) {
    return null
  }

  const total = parseFloat(cart.total_price) + 50

  return (
    <div className="min-h-screen flex flex-col">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => toast.error('Failed to load Razorpay')}
      />
      
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className="input-field"
                      rows={3}
                      defaultValue={user?.address || ''}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message as string}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        {...register('city', { required: 'City is required' })}
                        type="text"
                        className="input-field"
                        defaultValue={user?.city || ''}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city.message as string}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <input
                        {...register('state', { required: 'State is required' })}
                        type="text"
                        className="input-field"
                        defaultValue={user?.state || ''}
                      />
                      {errors.state && (
                        <p className="text-red-500 text-sm mt-1">{errors.state.message as string}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Zip Code</label>
                      <input
                        {...register('zip_code', { required: 'Zip code is required' })}
                        type="text"
                        className="input-field"
                        defaultValue={user?.zip_code || ''}
                      />
                      {errors.zip_code && (
                        <p className="text-red-500 text-sm mt-1">{errors.zip_code.message as string}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        {...register('phone', { required: 'Phone is required' })}
                        type="tel"
                        className="input-field"
                        defaultValue={user?.phone_number || ''}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                    <textarea
                      {...register('notes')}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                      className="mr-4 w-5 h-5 text-primary-600"
                    />
                    <div className="flex items-center flex-1">
                      <FiDollarSign className="w-6 h-6 text-gray-600 mr-3" />
                      <div>
                        <div className="font-semibold">Cash on Delivery (COD)</div>
                        <div className="text-sm text-gray-500">Pay when you receive your order</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                      className="mr-4 w-5 h-5 text-primary-600"
                    />
                    <div className="flex items-center flex-1">
                      <FiCreditCard className="w-6 h-6 text-gray-600 mr-3" />
                      <div>
                        <div className="font-semibold">Razorpay</div>
                        <div className="text-sm text-gray-500">Pay securely with cards, UPI, netbanking</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {cart.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>₹{item.total_price}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cart.total_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹50.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || razorpayKeyLoading}
                  className="w-full btn-primary py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : razorpayKeyLoading && paymentMethod === 'razorpay' ? 'Loading...' : paymentMethod === 'razorpay' ? 'Pay Now' : 'Place Order'}
                </button>
                {paymentMethod === 'cod' && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    You will pay ₹{total.toFixed(2)} when the order is delivered
                  </p>
                )}
                {paymentMethod === 'razorpay' && !razorpayKeyLoading && !razorpayKey && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">
                    ⚠️ Razorpay is not configured. Please contact support or use COD.
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
