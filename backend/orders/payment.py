import razorpay
from django.conf import settings
from decouple import config

# Initialize Razorpay client
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')

# Initialize client only if keys are provided
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    client = None


def create_razorpay_order(amount, currency='INR', receipt=None):
    """
    Create a Razorpay order
    """
    if not client:
        print("Razorpay client not initialized. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")
        return None
    
    try:
        data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': currency,
            'receipt': receipt,
        }
        order = client.order.create(data=data)
        return order
    except Exception as e:
        print(f"Error creating Razorpay order: {str(e)}")
        return None


def verify_razorpay_payment(order_id, payment_id, signature):
    """
    Verify Razorpay payment signature
    """
    if not client:
        print("Razorpay client not initialized")
        return False
    
    try:
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }
        client.utility.verify_payment_signature(params_dict)
        return True
    except Exception as e:
        print(f"Error verifying payment: {str(e)}")
        return False


def capture_razorpay_payment(payment_id, amount):
    """
    Capture Razorpay payment
    """
    if not client:
        print("Razorpay client not initialized")
        return None
    
    try:
        payment = client.payment.capture(payment_id, int(amount * 100))
        return payment
    except Exception as e:
        print(f"Error capturing payment: {str(e)}")
        return None

