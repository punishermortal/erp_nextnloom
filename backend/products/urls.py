from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'vendor/products', views.VendorProductViewSet, basename='vendor-products')
router.register(r'admin/review', views.AdminProductReviewViewSet, basename='admin-product-review')
router.register(r'admin/products', views.AdminProductManagementViewSet, basename='admin-product-management')
router.register(r'', views.ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]

