'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

export default function NewProductPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/dashboard/admin/login')
      return
    }
    router.replace('/dashboard/admin/products/new/edit')
  }, [isAuthenticated, user, router])

  return null
}

