'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import api from '@/lib/axios'
import { AppDispatch, RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'

interface Category {
  id: number
  name: string
}

export default function NewVendorProductPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [categories, setCategories] = useState<Category[]>([])
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    discount_price: '',
    stock: '',
    commission_rate: 10,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/dashboard/vendor/login')
      return
    }
    if (user && user.role !== 'vendor') {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router, user])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/products/categories/')
        setCategories(response.data)
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to load categories')
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.category_id) {
      toast.error('Select a category')
      return
    }
    try {
      setLoading(true)
      const payload = new FormData()
      payload.append('name', formState.name)
      payload.append('description', formState.description)
      payload.append('category_id', formState.category_id)
      payload.append('price', formState.price)
      if (formState.discount_price) payload.append('discount_price', formState.discount_price)
      payload.append('stock', formState.stock || '0')
      payload.append('commission_rate', String(formState.commission_rate))
      if (imageFile) {
        payload.append('image', imageFile)
      }

      await api.post('/products/vendor/products/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Product submitted for approval!')
      router.push('/dashboard/vendor/products')
    } catch (error: any) {
      const detail = error.response?.data
      if (detail && typeof detail === 'object') {
        const firstError = Object.values(detail)[0]
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        toast.error('Failed to create product')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  if (!isAuthenticated || user?.role !== 'vendor') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">New Listing</p>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Add a herbal product</h1>
          <p className="text-gray-500 mt-1">Submit your product for admin approval. We’ll notify you when it’s live.</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
        >
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product name</label>
            <input
              type="text"
              className="input-field"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="input-field"
              value={formState.category_id}
              onChange={(e) => setFormState({ ...formState, category_id: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="input-field"
            rows={4}
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            required
            placeholder="Highlight the freshness, sourcing and organic benefits..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="input-field"
              value={formState.price}
              onChange={(e) => setFormState({ ...formState, price: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount price (₹)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="input-field"
              value={formState.discount_price}
              onChange={(e) => setFormState({ ...formState, discount_price: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={formState.stock}
              onChange={(e) => setFormState({ ...formState, stock: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commission to admin (%)</label>
            <input
              type="number"
              min={0}
              max={50}
              className="input-field"
              value={formState.commission_rate}
              onChange={(e) => setFormState({ ...formState, commission_rate: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product image</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for approval'}
        </button>
      </form>
    </div>
  )
}


