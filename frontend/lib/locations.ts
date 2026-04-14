/**
 * Indian States and Cities Data
 * Maps states to their cities for address forms
 */

export interface LocationData {
  [state: string]: string[]
}

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
  'Puducherry',
  'Delhi',
  'Ladakh',
  'Jammu and Kashmir',
]

export const STATE_CITIES: LocationData = {
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Tirupati',
    'Nellore',
    'Kakinada',
  ],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Nagaon'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg', 'Rajnandgaon'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Gujarat': [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Gandhinagar',
    'Bhavnagar',
    'Anand',
    'Junagadh',
  ],
  'Haryana': ['Faridabad', 'Gurgaon', 'Hisar', 'Rohtak', 'Yamunanagar'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Kangra'],
  'Jharkhand': ['Ranchi', 'Dhanbad', 'Giridih', 'Bokaro'],
  'Karnataka': [
    'Bangalore',
    'Mysore',
    'Hubli',
    'Mangalore',
    'Belgaum',
    'Belagavi',
    'Shimoga',
  ],
  'Kerala': [
    'Kochi',
    'Thiruvananthapuram',
    'Kozhikode',
    'Thrissur',
    'Ernakulam',
    'Kollam',
  ],
  'Madhya Pradesh': [
    'Indore',
    'Bhopal',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Sagrampur',
  ],
  'Maharashtra': [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Ahmednagar',
    'Nashik',
    'Aurangabad',
    'Thane',
    'Kolhapur',
  ],
  'Manipur': ['Imphal', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Rajasthan': [
    'Jaipur',
    'Jodhpur',
    'Kota',
    'Ajmer',
    'Bikaner',
    'Udaipur',
    'Alwar',
  ],
  'Sikkim': ['Gangtok', 'Namchi'],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Salem',
    'Tiruchirappalli',
    'Kanyakumari',
    'Bangalore',
  ],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar'],
  'Tripura': ['Agartala', 'Udaipur'],
  'Uttar Pradesh': [
    'Lucknow',
    'Kanpur',
    'Agra',
    'Varanasi',
    'Meerut',
    'Ghaziabad',
    'Noida',
    'Allahabad',
  ],
  'Uttarakhand': ['Dehradun', 'Nainital', 'Haridwar'],
  'West Bengal': [
    'Kolkata',
    'Asansol',
    'Siliguri',
    'Darjeeling',
    'Jharsuguda',
  ],
  'Chandigarh': ['Chandigarh'],
  'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi'],
  'Ladakh': ['Leh', 'Kargil'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Leh'],
  'Puducherry': ['Puducherry', 'Yanam', 'Mahe'],
  'Lakshadweep': ['Kavaratti'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
}

/**
 * Common zipcode to state mapping (sample data)
 * In production, this should come from a database or API
 */
export const SAMPLE_ZIPCODE_TO_STATE: { [zipcode: string]: string } = {
  '110001': 'Delhi',
  '110002': 'Delhi',
  '110003': 'Delhi',
  '110004': 'Delhi',
  '110005': 'Delhi',
  '110006': 'Delhi',
  '110007': 'Delhi',
  '110008': 'Delhi',
  '110009': 'Delhi',
  '110010': 'Delhi',
  '400001': 'Maharashtra',
  '400002': 'Maharashtra',
  '400003': 'Maharashtra',
  '400004': 'Maharashtra',
  '400005': 'Maharashtra',
  '411001': 'Maharashtra',
  '411002': 'Maharashtra',
  '560001': 'Karnataka',
  '560002': 'Karnataka',
  '560003': 'Karnataka',
  '700001': 'West Bengal',
  '700002': 'West Bengal',
  '700003': 'West Bengal',
  '380001': 'Gujarat',
  '380002': 'Gujarat',
  '380003': 'Gujarat',
  '600001': 'Tamil Nadu',
  '600002': 'Tamil Nadu',
  '600003': 'Tamil Nadu',
  '500001': 'Telangana',
  '500002': 'Telangana',
  '500003': 'Telangana',
  '682001': 'Kerala',
  '682002': 'Kerala',
  '682003': 'Kerala',
}

/**
 * Get cities for a given state
 */
export const getCitiesByState = (state: string): string[] => {
  return STATE_CITIES[state] || []
}

/**
 * Get state from zipcode (if available)
 */
export const getStateByZipcode = (zipcode: string): string | null => {
  return SAMPLE_ZIPCODE_TO_STATE[zipcode] || null
}

/**
 * Format location string
 */
export const formatLocation = (
  address: string,
  city: string,
  state: string,
  zipcode: string
): string => {
  return `${address}, ${city}, ${state} - ${zipcode}`
}
