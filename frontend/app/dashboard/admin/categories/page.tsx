'use client'

import { useEffect, useState } from 'react'
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
  description?: string
  image?: string
  is_active: boolean
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true })
  const [showAddForm, setShowAddForm] = useState(false)

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

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products/categories/')
      const categoriesList = Array.isArray(response.data) ? response.data : response.data.results || []
      setCategories(categoriesList)
    } catch (error: any) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/products/categories/${editingId}/`, formData)
        toast.success('Category updated successfully')
      } else {
        await api.post('/products/categories/', formData)
        toast.success('Category created successfully')
      }
      setEditingId(null)
      setShowAddForm(false)
      setFormData({ name: '', description: '', is_active: true })
      fetchCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await api.delete(`/products/categories/${id}/`)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete category')
    }
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/login')
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="py-10 px-4 md:px-8 lg:px-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Categories Management</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Manage Categories</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage product categories</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingId(null)
              setFormData({ name: '', description: '', is_active: true })
            }}
            className="px-5 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Add Category
          </button>
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

      {showAddForm && (
        <div className="mb-6 bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingId(null)
                  setFormData({ name: '', description: '', is_active: true })
                }}
                className="px-6 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500">Loading categories...</p>
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
          <p className="text-gray-500">No categories found.</p>
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  category.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

