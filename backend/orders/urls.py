from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .razorpay_views import verify_payment, get_razorpay_key

router = DefaultRouter()
router.register(r'', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('payment/verify/', verify_payment, name='verify-payment'),
    path('payment/razorpay-key/', get_razorpay_key, name='razorpay-key'),
]

