'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { addToCart, fetchCart } from '@/store/slices/cartSlice'
import { FiStar, FiMinus, FiPlus } from 'react-icons/fi'
import { toast } from 'react-toastify'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function ProductDetailPage() {
  const params = useParams()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
  }, [params.slug])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${params.slug}/`)
      setProduct(response.data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Product not found')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      return
    }

    try {
      await dispatch(addToCart({ product_id: product.id, quantity }) as any)
      await dispatch(fetchCart() as any)
      toast.success('Product added to cart')
    } catch (error) {
      toast.error('Failed to add product to cart')
    }
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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div>Product not found</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div>
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                {product.primary_image || product.image ? (
                  <img
                    src={product.primary_image || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U1ZTdlYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                    }}
                  />
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-4">
                <span className="text-sm text-gray-500">{product.category.name}</span>
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-4">
                  <FiStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="ml-2">{product.rating} ({product.num_reviews} reviews)</span>
                </div>
              </div>

              <div className="mb-6">
                {product.discount_price ? (
                  <div>
                    <span className="text-3xl font-bold text-primary-600">₹{product.final_price}</span>
                    <span className="text-xl text-gray-400 line-through ml-4">₹{product.price}</span>
                    <span className="ml-4 text-red-500 font-semibold">
                      Save {product.discount_percentage}%
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-primary-600">₹{product.price}</span>
                )}
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <FiMinus />
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <FiPlus />
                  </button>
                  <span className="text-gray-500">({product.stock} available)</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full btn-primary py-3 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

