'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { logout, loadCurrentUser } from '@/store/slices/authSlice'
import { FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { cart } = useSelector((state: RootState) => state.cart)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(loadCurrentUser())
    }
  }, [dispatch, isAuthenticated, user])

  const handleLogout = () => {
    dispatch(logout())
    router.push('/')
  }

  const cartItemsCount = isMounted ? (cart?.total_items || 0) : 0

  const renderDesktopLinks = () => {
    if (!isMounted) {
      return (
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-white font-semibold shadow hover:shadow-lg transition-all"
          >
            Sign Up
          </Link>
        </div>
      )
    }

    if (isAuthenticated) {
      return (
        <>
          <Link href="/orders" className="text-gray-600 hover:text-emerald-600 transition-colors">
            Orders
          </Link>
          <Link href="/cart" className="relative text-gray-600 hover:text-emerald-600 transition-colors">
            <FiShoppingCart className="w-6 h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <FiUser className="w-5 h-5" />
              <span>{user?.first_name || user?.email}</span>
            </Link>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors">
              Logout
            </button>
          </div>
        </>
      )
    }

    return (
      <div className="flex items-center space-x-4">
        <Link href="/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
          Login
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-white font-semibold shadow hover:shadow-lg transition-all"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  const renderMobileLinks = () => {
    if (!isMounted) {
      return (
        <>
          <Link href="/login" className="block text-gray-700 hover:text-emerald-600">
            Login
          </Link>
          <Link
            href="/register"
            className="block text-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-white font-semibold py-2"
          >
            Sign Up
          </Link>
        </>
      )
    }

    if (isAuthenticated) {
      return (
        <>
          <Link href="/orders" className="block text-gray-700 hover:text-emerald-600">
            Orders
          </Link>
          <Link href="/cart" className="block text-gray-700 hover:text-emerald-600">
            Cart ({cartItemsCount})
          </Link>
          <Link href="/profile" className="block text-gray-700 hover:text-emerald-600">
            Profile
          </Link>
          <button onClick={handleLogout} className="block text-red-600">
            Logout
          </button>
        </>
      )
    }

    return (
      <>
        <Link href="/login" className="block text-gray-700 hover:text-primary-600">
          Login
        </Link>
        <Link href="/register" className="block btn-primary text-center">
          Sign Up
        </Link>
      </>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-100 flex-shrink-0 bg-white transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Nex Blooms Logo"
                fill
                className="object-contain scale-125"
                priority
                sizes="48px"
              />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-400 bg-clip-text text-transparent hidden sm:block tracking-wide">
              Nex Blooms
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Products
            </Link>
            {/* Show panels before login, or only to admins/vendors after login */}
            {isMounted && (
              <>
                {(!isAuthenticated || (isAuthenticated && user?.role === 'vendor')) && (
                  <Link href="/dashboard/vendor/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
                    Vendor Panel
                  </Link>
                )}
                {(!isAuthenticated || (isAuthenticated && (user?.role === 'admin' || user?.is_staff))) && (
                  <Link href="/dashboard/admin/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
                    Admin Panel
                  </Link>
                )}
              </>
            )}
            {!isMounted && (
              <>
                <Link href="/dashboard/vendor/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  Vendor Panel
                </Link>
                <Link href="/dashboard/admin/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  Admin Panel
                </Link>
              </>
            )}
            {renderDesktopLinks()}
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-emerald-50">
            <Link href="/" className="block text-gray-700 hover:text-emerald-600">
              Home
            </Link>
            <Link href="/products" className="block text-gray-700 hover:text-emerald-600">
              Products
            </Link>
            {/* Show panels before login, or only to admins/vendors after login */}
            {isMounted && (
              <>
                {(!isAuthenticated || (isAuthenticated && user?.role === 'vendor')) && (
                  <Link href="/dashboard/vendor/login" className="block text-gray-700 hover:text-emerald-600">
                    Vendor Panel
                  </Link>
                )}
                {(!isAuthenticated || (isAuthenticated && (user?.role === 'admin' || user?.is_staff))) && (
                  <Link href="/dashboard/admin/login" className="block text-gray-700 hover:text-emerald-600">
                    Admin Panel
                  </Link>
                )}
              </>
            )}
            {!isMounted && (
              <>
                <Link href="/dashboard/vendor/login" className="block text-gray-700 hover:text-emerald-600">
                  Vendor Panel
                </Link>
                <Link href="/dashboard/admin/login" className="block text-gray-700 hover:text-emerald-600">
                  Admin Panel
                </Link>
              </>
            )}
            {renderMobileLinks()}
          </div>
        )}
      </div>
    </nav>
  )
}

