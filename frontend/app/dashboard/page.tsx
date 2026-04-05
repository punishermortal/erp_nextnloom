'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

export default function DashboardLandingPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/dashboard/vendor/login')
      return
    }

    if (user?.role === 'vendor') {
      router.replace('/dashboard/vendor')
    } else if (user?.role === 'admin') {
      router.replace('/dashboard/admin')
    } else {
      router.replace('/')
    }
  }, [isAuthenticated, router, user])

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-gray-500">
      Preparing your personalized workspace...
    </div>
  )
}


