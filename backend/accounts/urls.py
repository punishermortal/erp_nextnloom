from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('send-phone-otp/', views.send_phone_signup_otp, name='send-phone-otp'),
    path('send-email-otp/', views.send_email_signup_otp, name='send-email-otp'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

