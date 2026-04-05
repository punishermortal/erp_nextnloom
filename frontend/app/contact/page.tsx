'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { FiPhone, FiMail, FiClock } from 'react-icons/fi'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
              Contact
            </h1>
          </div>

          <div className="card p-8 space-y-8">
            {/* Urgent Calls & WhatsApp Support */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FiPhone className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">📞 Urgent Calls & WhatsApp Support</h3>
                <p className="text-gray-600 mb-2">
                  <a href="tel:+918000855595" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    +91 8000855595
                  </a>
                </p>
                <p className="text-sm text-gray-500">Available for urgent calls and WhatsApp messages</p>
              </div>
            </div>

            {/* General Queries */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiMail className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">📧 General Queries</h3>
                <p className="text-gray-600 mb-2">
                  <a href="mailto:info@nexblooms.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    info@nexblooms.com
                  </a>
                </p>
                <p className="text-sm text-gray-500">For product information, feedback, and business inquiries</p>
              </div>
            </div>

            {/* Support / Complaints */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <FiMail className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">🛠️ Support / Complaints</h3>
                <p className="text-gray-600 mb-2">
                  <a href="mailto:support@nexblooms.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    support@nexblooms.com
                  </a>
                </p>
                <p className="text-sm text-gray-500">For order issues, complaints, or technical support</p>
              </div>
            </div>

            {/* Support Hours */}
            <div className="flex items-start space-x-4 pt-4 border-t border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">⏰ Support Hours</h3>
                <p className="text-gray-600 font-medium">Monday – Friday 9:00 AM – 5:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

