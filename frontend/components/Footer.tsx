import Link from 'next/link'
import Image from 'next/image'
import { FiFacebook, FiInstagram, FiMail } from 'react-icons/fi'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="bg-gradient-to-r from-primary-500/90 via-accent-500/90 to-primary-500/90 text-center py-4 px-4">
        <p className="text-xs sm:text-sm tracking-[0.4em] uppercase text-white/90">
          Weekly freshness drops · Same-day delivery · Members save more
        </p>
        <p className="text-2xl md:text-3xl font-semibold mt-1">
          Stock your pantry with farm-fresh picks today !
        </p>
      </div>

      <div className="border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">Don’t miss the harvest</p>
            <h4 className="text-xl font-semibold">Get exclusive deals & new arrivals</h4>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="bg-white/5 border border-white/15 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 text-white placeholder:text-white/60 w-full sm:w-64"
            />
            <button
              type="submit"
              className="rounded-full bg-white text-gray-900 font-semibold px-5 py-2 text-sm hover:bg-primary-100 transition-colors"
            >
              Join Us
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-primary-300 flex-shrink-0 bg-white">
                <Image
                  src="/logo.png"
                  alt="NextBloom Logo"
                  fill
                  className="object-contain scale-125"
                  sizes="48px"
                  priority
                />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Nex Blooms
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Fresh groceries, curated with care and delivered when you need them.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/products" className="hover:text-primary-300 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-300 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/refunds-returns" className="hover:text-primary-300 transition-colors">
                  Refunds & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-primary-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-primary-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/faq" className="hover:text-primary-300 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary-300 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary-300 transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-2 uppercase tracking-wide">Stay Connected</h4>
            <p className="text-gray-400 text-sm mb-3">
              Tips, recipes, and seasonal picks—delivered to your feed.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/share/1EzA4gGUBt/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-100 hover:bg-primary-500 hover:border-primary-500 transition">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="https://x.com/Nex_Blooms?t=wubdRc-F07I_Lf6Ln484Uw&s=09" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-100 hover:bg-primary-500 hover:border-primary-500 transition">
                <span className="text-lg font-bold">𝕏</span>
              </a>
              <a href="https://www.instagram.com/nex_blooms?igsh=enFrNjFxOXR3ajlx" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-100 hover:bg-primary-500 hover:border-primary-500 transition">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="mailto:info@nexblooms.com" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-100 hover:bg-primary-500 hover:border-primary-500 transition">
                <FiMail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-5 text-center text-gray-400 text-sm">
          <p>&copy; {year} Nex Blooms. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

