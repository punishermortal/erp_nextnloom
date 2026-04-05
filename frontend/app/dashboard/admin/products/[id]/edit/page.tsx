'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface Category {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  slug: string
  description: string
  category: Category
  category_id: number
  price: string
  discount_price?: string
  stock: number
  is_active: boolean
  is_featured: boolean
  image?: string
  primary_image?: string
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const productId = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = !productId || productId === 'new'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    discount_price: '',
    stock: '',
    is_active: true,
    is_featured: false,
  })

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
    if (!isNew) {
      fetchProduct()
    } else {
      setLoading(false)
    }
  }, [params.id, isAuthenticated, user, isNew])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/')
      setCategories(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error: any) {
      toast.error('Failed to load categories')
    }
  }

  const fetchProduct = async () => {
    if (isNew) return
    try {
      setLoading(true)
      const response = await api.get(`/products/admin/products/${productId}/`)
      const productData = response.data
      setProduct(productData)
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        category_id: productData.category_id || productData.category?.id || '',
        price: productData.price || '',
        discount_price: productData.discount_price || '',
        stock: productData.stock || '',
        is_active: productData.is_active ?? true,
        is_featured: productData.is_featured ?? false,
      })
      if (productData.primary_image || productData.image) {
        setImagePreview(productData.primary_image || productData.image)
      }
    } catch (error: any) {
      toast.error('Failed to load product')
      router.push('/dashboard/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category_id', formData.category_id)
      formDataToSend.append('price', formData.price)
      if (formData.discount_price) {
        formDataToSend.append('discount_price', formData.discount_price)
      }
      formDataToSend.append('stock', formData.stock)
      formDataToSend.append('is_active', formData.is_active.toString())
      formDataToSend.append('is_featured', formData.is_featured.toString())
      
      // Add image if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      if (!isNew) {
        await api.patch(`/products/admin/products/${productId}/`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        toast.success('Product updated successfully')
      } else {
        await api.post('/products/admin/products/', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        toast.success('Product created successfully')
      }
      router.push('/dashboard/admin/products')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  if (loading) {
    return (
      <div className="py-10 px-4 md:px-8 lg:px-16">
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Product Management</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/admin/products"
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Back to Products
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.discount_price}
              onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
            <input
              type="number"
              min="0"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            required
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
          {imagePreview && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">Upload a product image (JPG, PNG, etc.)</p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Link
            href="/dashboard/admin/products"
            className="px-6 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

