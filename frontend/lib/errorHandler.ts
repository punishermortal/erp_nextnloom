/**
 * Utility function to extract error messages from API responses
 * Handles different error formats from the backend and Redux rejections
 */
export const getErrorMessage = (error: any): string => {
  // If error is directly the data object (from Redux rejectWithValue)
  if (typeof error === 'object' && error !== null && !error.response) {
    const result = extractErrorFromData(error)
    if (result !== 'An error occurred. Please try again.') {
      return result
    }
  }

  // Check for axios error response
  if (error?.response?.data) {
    return extractErrorFromData(error.response.data)
  }

  // Check for serialized error payload (from Redux)
  if (error?.payload?.response?.data) {
    return extractErrorFromData(error.payload.response.data)
  }

  // Check for error message property
  if (error?.message && error.message !== 'Rejected') {
    return error.message
  }

  // Check for payload string (Redux serialized error)
  if (typeof error?.payload === 'string' && error.payload !== 'Rejected') {
    return error.payload
  }

  // Fallback
  return 'An error occurred. Please try again.'
}

/**
 * Extract error message from response data object
 */
function extractErrorFromData(data: any): string {
  if (!data) {
    return 'An error occurred. Please try again.'
  }

  // Format 1: Custom error message
  if (data.error) {
    return data.error
  }

  // Format 2: Detail field
  if (data.detail) {
    return data.detail
  }

  // Format 3: Validation errors (list of field errors)
  if (data.errors && Array.isArray(data.errors)) {
    return data.errors
      .map((e: any) => e.message || e)
      .filter(Boolean)
      .join(', ')
  }

  // Format 4: Validation errors (object with field names as keys)
  // This handles: {email: ["error1"], phone_number: ["error2"]}
  if (typeof data === 'object' && !Array.isArray(data)) {
    const errors: string[] = []
    for (const [field, messages] of Object.entries(data)) {
      // Skip non-error fields like "response" or "status"
      if (field === 'response' || field === 'status' || field === 'statusMessage') {
        continue
      }

      if (Array.isArray(messages)) {
        const fieldErrors = (messages as any[])
          .map((m: any) => (typeof m === 'string' ? m : m.message))
          .filter(Boolean)
        if (fieldErrors.length > 0) {
          errors.push(`${field}: ${fieldErrors.join(', ')}`)
        }
      } else if (typeof messages === 'string' && messages.length > 0) {
        errors.push(`${field}: ${messages}`)
      }
    }
    if (errors.length > 0) {
      return errors.join(' | ')
    }
  }

  // Format 5: Plain string
  if (typeof data === 'string' && data.length > 0) {
    return data
  }

  return 'An error occurred. Please try again.'
}

/**
 * Extract success message from API response
 */
export const getSuccessMessage = (data: any): string => {
  if (data?.message) {
    return data.message
  }
  if (data?.success_message) {
    return data.success_message
  }
  return 'Operation successful!'
}
