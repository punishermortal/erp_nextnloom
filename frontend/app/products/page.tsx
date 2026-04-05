'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import axios from 'axios'
import { FiStar, FiFilter } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  discount_price?: string
  final_price: string
  discount_percentage: number
  image?: string
  primary_image?: string
  rating: string
  category: {
    id: number
    name: string
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [selectedCategory, searchQuery, page])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params: any = { page }
      if (selectedCategory) params.category = selectedCategory
      if (searchQuery) params.search = searchQuery
      
      console.log('Fetching products from:', `${API_URL}/products/`, 'with params:', params)
      const response = await axios.get(`${API_URL}/products/`, { params })
      console.log('Products response:', response.data)
      const productsData = response.data.results || response.data || []
      setProducts(Array.isArray(productsData) ? productsData : [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
      console.error('Error details:', error.response?.data || error.message)
      console.error('Error status:', error.response?.status)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from:', `${API_URL}/products/categories/`)
      const response = await axios.get(`${API_URL}/products/categories/`)
      console.log('Categories response:', response.data)
      // Categories are not paginated, so response.data is directly the array
      const categoriesData = response.data.results || response.data || []
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      console.error('Error details:', error.response?.data || error.message)
      console.error('Error status:', error.response?.status)
      setCategories([]) // Set empty array on error
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64">
              <div className="card p-6 sticky top-20">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FiFilter className="mr-2" />
                  Filters
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) && categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-8">All Products</h1>
              
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No products found</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="card p-4 hover:scale-105 transition-transform"
                    >
                      <div className="relative mb-4">
                        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
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
                        {product.discount_percentage > 0 && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                            -{product.discount_percentage}%
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">{product.category.name}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.discount_price ? (
                            <div>
                              <span className="text-primary-600 font-bold text-lg">₹{product.final_price}</span>
                              <span className="text-gray-400 line-through ml-2">₹{product.price}</span>
                            </div>
                          ) : (
                            <span className="text-primary-600 font-bold text-lg">₹{product.price}</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 text-sm">{product.rating}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

