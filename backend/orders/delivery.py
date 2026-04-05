import requests
from django.conf import settings
from decouple import config
import json
from datetime import datetime

# Delhivery API Configuration
# Hardcoded API token - move to .env file for production security
DELHIVERY_API_TOKEN = config('DELHIVERY_API_TOKEN', default='da268bbb415296a2d203c05b269cd28dddab790c')
DELHIVERY_PICKUP_LOCATION = config('DELHIVERY_PICKUP_LOCATION', default='')
DELHIVERY_WAREHOUSE_NAME = config('DELHIVERY_WAREHOUSE_NAME', default='NextBloom Warehouse')
DELHIVERY_PICKUP_NAME = config('DELHIVERY_PICKUP_NAME', default='NextBloom')
DELHIVERY_PICKUP_PHONE = config('DELHIVERY_PICKUP_PHONE', default='+919876543210')
DELHIVERY_PICKUP_ADDRESS = config('DELHIVERY_PICKUP_ADDRESS', default='NextBloom Warehouse, Mumbai')
DELHIVERY_PICKUP_CITY = config('DELHIVERY_PICKUP_CITY', default='Mumbai')
DELHIVERY_PICKUP_STATE = config('DELHIVERY_PICKUP_STATE', default='Maharashtra')
DELHIVERY_PICKUP_PINCODE = config('DELHIVERY_PICKUP_PINCODE', default='400001')
# Enable Delhivery by default (hardcoded token is provided)
DELHIVERY_ENABLED = config('DELHIVERY_ENABLED', default=True, cast=bool)

# Delhivery API Base URL
DELHIVERY_API_BASE_URL = 'https://track.delhivery.com/api'

# Default package weight in grams (if not provided)
DEFAULT_PACKAGE_WEIGHT = 500  # 500 grams = 0.5 kg


def create_delivery_order(order_data):
    """
    Create a delivery order with Delhivery
    order_data should contain:
    - order_id (waybill number)
    - delivery_address
    - delivery_city
    - delivery_state
    - delivery_pincode
    - customer_name
    - customer_phone
    - items (list of items)
    - total_amount
    - payment_method (cod or prepaid)
    """
    if not DELHIVERY_ENABLED or not DELHIVERY_API_TOKEN:
        print("Delhivery integration not enabled or API token not configured")
        return {
            'success': False,
            'message': 'Delhivery integration not enabled',
            'order_id': None,
            'tracking_id': None,
            'status': 'pending'
        }

    try:
        # Calculate total weight from items (default 500g per item if not specified)
        total_weight = len(order_data.get('items', [])) * DEFAULT_PACKAGE_WEIGHT
        
        # Prepare shipment data for Delhivery
        shipment_data = {
            'shipments': [{
                'name': order_data.get('customer_name', 'Customer'),
                'order': order_data.get('order_id'),
                'order_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'payment_mode': 'COD' if order_data.get('payment_method') == 'cod' else 'Prepaid',
                'total_amount': float(order_data.get('total_amount', 0)),
                'cod_amount': float(order_data.get('total_amount', 0)) if order_data.get('payment_method') == 'cod' else 0,
                'add': order_data.get('delivery_address', ''),
                'city': order_data.get('delivery_city', ''),
                'state': order_data.get('delivery_state', ''),
                'pin': order_data.get('delivery_pincode', ''),
                'phone': order_data.get('customer_phone', ''),
                'country': 'India',
                'weight': total_weight / 1000,  # Convert to kg
                'products_desc': ', '.join([item.get('name', '') for item in order_data.get('items', [])]),
                'quantity': len(order_data.get('items', []))
            }],
            'pickup_location': {
                'name': DELHIVERY_PICKUP_NAME,
                'phone': DELHIVERY_PICKUP_PHONE,
                'add': DELHIVERY_PICKUP_ADDRESS,
                'city': DELHIVERY_PICKUP_CITY,
                'state': DELHIVERY_PICKUP_STATE,
                'pin': DELHIVERY_PICKUP_PINCODE,
                'country': 'India'
            }
        }

        # Delhivery API endpoint for creating shipment
        url = f'{DELHIVERY_API_BASE_URL}/p/create'
        headers = {
            'Authorization': f'Token {DELHIVERY_API_TOKEN}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        response = requests.post(
            url,
            headers=headers,
            json=shipment_data,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            # Delhivery returns package details in 'packages' array
            if data.get('packages') and len(data['packages']) > 0:
                package = data['packages'][0]
                waybill = package.get('waybill', order_data.get('order_id'))
                return {
                    'success': True,
                    'message': 'Delhivery shipment created successfully',
                    'order_id': waybill,
                    'tracking_id': waybill,  # Delhivery uses waybill as tracking ID
                    'status': 'In Transit',
                    'client_name': package.get('client_name'),
                    'remarks': data.get('remarks', '')
                }
            else:
                return {
                    'success': True,
                    'message': 'Delhivery shipment created (pending waybill assignment)',
                    'order_id': order_data.get('order_id'),
                    'tracking_id': order_data.get('order_id'),
                    'status': 'Pending'
                }
        else:
            error_msg = f'Delhivery API error: {response.status_code}'
            try:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', error_msg)
            except:
                error_msg = response.text or error_msg
                
            print(f"Delhivery API Error: {error_msg}")
            return {
                'success': False,
                'message': error_msg,
                'order_id': None,
                'tracking_id': None,
                'status': 'Failed'
            }

    except Exception as e:
        error_msg = f'Error creating Delhivery shipment: {str(e)}'
        print(error_msg)
        return {
            'success': False,
            'message': error_msg,
            'order_id': None,
            'tracking_id': None,
            'status': 'Error'
        }


def get_delivery_status(tracking_id):
    """
    Get delivery status from Delhivery using waybill number
    """
    if not DELHIVERY_ENABLED or not DELHIVERY_API_TOKEN:
        return None

    if not tracking_id:
        return None

    try:
        # Delhivery tracking API endpoint
        url = f'{DELHIVERY_API_BASE_URL}/packages/json/'
        headers = {
            'Authorization': f'Token {DELHIVERY_API_TOKEN}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        params = {
            'waybill': tracking_id,
            'verbose': 1
        }

        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('data') and len(data['data']) > 0:
                package_data = data['data'][0]
                return {
                    'status': package_data.get('Status', {}).get('Status', 'Unknown'),
                    'status_type': package_data.get('Status', {}).get('StatusType', ''),
                    'status_location': package_data.get('Status', {}).get('StatusLocation', ''),
                    'status_time': package_data.get('Status', {}).get('StatusDateTime', ''),
                    'delivered_date': package_data.get('DeliveredDate', ''),
                    'waybill': package_data.get('Waybill', tracking_id),
                    'destination': package_data.get('Destination', ''),
                    'origin': package_data.get('Origin', '')
                }
            return None
        else:
            print(f"Delhivery tracking API error: {response.status_code}")
            return None

    except Exception as e:
        print(f"Error getting Delhivery status: {str(e)}")
        return None


def cancel_delivery_order(tracking_id):
    """
    Cancel a Delhivery shipment
    """
    if not DELHIVERY_ENABLED or not DELHIVERY_API_TOKEN:
        return {
            'success': False,
            'message': 'Delhivery integration not enabled'
        }

    try:
        url = f'{DELHIVERY_API_BASE_URL}/packages/json/'
        headers = {
            'Authorization': f'Token {DELHIVERY_API_TOKEN}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        data = {
            'waybill': tracking_id,
            'cancellation': True,
            'cancel': True
        }

        response = requests.post(
            url,
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code == 200:
            return {
                'success': True,
                'message': 'Shipment cancelled successfully'
            }
        else:
            return {
                'success': False,
                'message': f'Failed to cancel shipment: {response.status_code}'
            }

    except Exception as e:
        return {
            'success': False,
            'message': f'Error cancelling shipment: {str(e)}'
        }

