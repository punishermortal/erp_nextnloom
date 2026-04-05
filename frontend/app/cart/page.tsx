'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { fetchCart, removeFromCart, updateCartItem } from '@/store/slices/cartSlice'
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'
import Link from 'next/link'
import { toast } from 'react-toastify'

export default function CartPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { cart, loading } = useSelector((state: RootState) => state.cart)
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    dispatch(fetchCart() as any)
  }, [isAuthenticated, dispatch, router])

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await dispatch(removeFromCart(itemId) as any)
      toast.success('Item removed from cart')
    } else {
      await dispatch(updateCartItem({ item_id: itemId, quantity: newQuantity }) as any)
      toast.success('Cart updated')
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    await dispatch(removeFromCart(itemId) as any)
    toast.success('Item removed from cart')
  }

  if (!isAuthenticated) {
    return null
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link href="/products" className="btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card p-6">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex items-center border-b pb-4 mb-4 last:border-0 last:mb-0">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
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
                      <p className="text-gray-500 text-sm">{item.product.category.name}</p>
                      <p className="text-primary-600 font-bold mt-2">₹{item.product.final_price}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FiMinus />
                        </button>
                        <span className="px-4">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FiPlus />
                        </button>
                      </div>
                      <p className="font-semibold w-20 text-right">₹{item.total_price}</p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cart.total_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹50.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{(parseFloat(cart.total_price) + 50).toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="w-full btn-primary py-3 text-center block"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/products"
                  className="w-full btn-secondary py-3 text-center block mt-2"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

