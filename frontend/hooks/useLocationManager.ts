import { useEffect } from 'react'
import { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { getCitiesByState, getStateByZipcode } from '@/lib/locations'

export function useLocationManager(
  watch: UseFormWatch<any>,
  setValue: UseFormSetValue<any>
) {
  const zipCode = watch('zip_code')
  const state = watch('state')

  // Handle zipcode change - auto-populate state if found
  useEffect(() => {
    if (zipCode && zipCode.length >= 3) {
      const foundState = getStateByZipcode(zipCode)
      if (foundState) {
        setValue('state', foundState)
        // Reset city when state changes via zipcode
        setValue('city', '')
      }
    }
  }, [zipCode, setValue])

  // Handle state change - reset city and populate available cities
  useEffect(() => {
    // This effect is mainly to reset city when state changes
    // The form will handle the city dropdown options via getCitiesByState
    if (state) {
      // Reset city when state changes
      setValue('city', '')
    }
  }, [state, setValue])

  // Get available cities for current state
  const availableCities = state ? getCitiesByState(state) : []

  return {
    availableCities,
    zipCode,
    state,
  }
}
