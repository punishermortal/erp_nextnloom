'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import axios from 'axios'
import { FiShoppingBag, FiTruck, FiShield, FiStar } from 'react-icons/fi'

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
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
    fetchCategories()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      console.log('Fetching featured products from:', `${API_URL}/products/featured/`)
      const response = await axios.get(`${API_URL}/products/featured/`)
      console.log('Featured products response:', response.data)
      if (Array.isArray(response.data)) {
        setFeaturedProducts(response.data.slice(0, 8))
      } else {
        console.error('Invalid featured products response:', response.data)
        setFeaturedProducts([])
      }
    } catch (error: any) {
      console.error('Error fetching featured products:', error)
      console.error('Error details:', error.response?.data || error.message)
      setFeaturedProducts([])
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
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []
      setCategories(categoriesArray.slice(0, 6))
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      console.error('Error details:', error.response?.data || error.message)
      setCategories([]) // Set empty array on error
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white">
                <Image
                  src="/logo.png"
                  alt="NextBloom Logo"
                  fill
                  className="object-contain scale-125"
                  priority
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Fresh Groceries, Delivered Fast
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Shop the finest selection of organic/preservative free produce and groceries
            </p>
            <Link href="/products" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-block">
              Shop Now
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTruck className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Free Delivery</h3>
                <p className="text-gray-600">On orders over $50</p>
              </div>
              <div className="text-center">
                <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShield className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
                <p className="text-gray-600">100% secure transactions</p>
              </div>
              <div className="text-center">
                <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiStar className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Quality Products</h3>
                <p className="text-gray-600">Fresh and organic</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShoppingBag className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Returns</h3>
                <p className="text-gray-600">7-day return policy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="card p-6 text-center hover:scale-105 transition-transform"
                  >
                    <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiShoppingBag className="w-10 h-10 text-primary-600" />
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                  </Link>
                ))
              ) : (
                <div className="col-span-6 text-center text-gray-500">No categories available</div>
              )}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="card p-4 hover:scale-105 transition-transform hover:shadow-lg"
                  >
                    <div className="relative mb-4">
                      <div className="w-full h-48 bg-gradient-to-br from-emerald-50 to-lime-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                        {product.primary_image || product.image ? (
                          <img
                            src={product.primary_image || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-gray-400"><svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm">No Image</span></div>'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span className="text-sm">No Image</span>
                          </div>
                        )}
                      </div>
                      {product.discount_percentage > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                          -{product.discount_percentage}%
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2 text-gray-900 hover:text-emerald-600 transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.discount_price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 font-bold text-lg">₹{product.final_price}</span>
                              <span className="text-gray-400 line-through text-sm">₹{product.price}</span>
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-bold text-lg">₹{product.price}</span>
                          )}
                        </div>
                      <div className="flex items-center gap-1">
                        <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-gray-600">{product.rating || '0.0'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="text-center mt-8">
              <Link href="/products" className="btn-primary">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

