/**
 * Debug utility for understanding error object structure
 * Use in development to identify error formats from API
 */

export const debugError = (error: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Debug Info')
    console.log('Full Error Object:', error)
    console.log('Error Type:', typeof error)
    console.log('Error Keys:', Object.keys(error || {}))
    
    if (error?.response) {
      console.log('Response Status:', error.response.status)
      console.log('Response Data:', error.response.data)
      console.log('Response Headers:', error.response.headers)
    }
    
    if (error?.message) {
      console.log('Error Message:', error.message)
    }
    
    console.groupEnd()
  }
}

export const logErrorToConsole = (source: string, error: any, extractedMessage: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📍 Error from ${source}`)
    console.log('Extracted Message:', extractedMessage)
    debugError(error)
    console.groupEnd()
  }
}
