'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface Category {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  slug: string
  category: Category
  price: string
  discount_price?: string
  final_price: string
  discount_percentage: number
  stock: number
  is_active: boolean
  is_featured: boolean
  rating: string
  primary_image?: string
  image?: string
  vendor?: {
    id: number
    business_name?: string
  }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [filter, setFilter] = useState<{ category?: string; is_active?: string; is_featured?: string; search?: string }>({})

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
    fetchCategories()
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return
    fetchProducts()
  }, [isAuthenticated, user, filter])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/')
      setCategories(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filter.category) params.category = filter.category
      if (filter.is_active !== undefined) params.is_active = filter.is_active
      if (filter.is_featured !== undefined) params.is_featured = filter.is_featured
      if (filter.search) params.search = filter.search

      const response = await api.get('/products/admin/products/', { params })
      const productsList = Array.isArray(response.data) ? response.data : response.data.results || []
      setProducts(productsList)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [filter])

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product')
      return
    }

    try {
      setBulkActionLoading(true)
      const response = await api.post(`/products/admin/products/bulk_${action}/`, {
        product_ids: selectedProducts
      })
      toast.success(response.data.message || `${action} completed`)
      setSelectedProducts([])
      fetchProducts()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${action}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-700 bg-red-100' }
    if (stock < 10) return { text: `Low Stock (${stock})`, color: 'text-orange-700 bg-orange-100' }
    return { text: `In Stock (${stock})`, color: 'text-green-700 bg-green-100' }
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Products Management</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Manage Products</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage all products</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/admin/products/new"
            className="px-5 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Add Product
          </Link>
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

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={filter.search || ''}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <select
            value={filter.category || ''}
            onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filter.is_active || ''}
            onChange={(e) => setFilter({ ...filter, is_active: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filter.is_featured || ''}
            onChange={(e) => setFilter({ ...filter, is_featured: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Products</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-sm font-semibold text-emerald-700">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction('featured')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Mark Featured
              </button>
              <button
                onClick={() => handleBulkAction('unfeatured')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50"
              >
                Unmark Featured
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('restock')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                Restock (+10)
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products List */}
      {loading && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500">No products found.</p>
          <Link href="/dashboard/admin/products/new" className="text-emerald-600 hover:underline mt-2 inline-block">
            Add your first product
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Image</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Featured</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {product.primary_image || product.image ? (
                          <img
                            src={product.primary_image || product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center"><span class="text-gray-400 text-xs">No Image</span></div>'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        {product.vendor && (
                          <div className="text-xs text-gray-500">Vendor: {product.vendor.business_name || 'N/A'}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category.name}</td>
                      <td className="px-4 py-3">
                        {product.discount_price ? (
                          <div>
                            <span className="text-emerald-600 font-bold">₹{product.final_price}</span>
                            <span className="text-gray-400 line-through ml-2 text-sm">₹{product.price}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold">₹{product.price}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.is_featured ? 'Featured' : 'Regular'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/products/${product.id}/edit`}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition inline-block"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

