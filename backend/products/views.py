from django.db.models import Count, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminUser, IsVendorUser
from orders.models import OrderItem
from .models import Category, Product, ProductStatus
from .serializers import (
    AdminProductReviewSerializer,
    CategorySerializer,
    ProductListSerializer,
    ProductSerializer,
    VendorProductSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    pagination_class = None  # Disable pagination for categories

    def get_queryset(self):
        # For admin, return all categories; for public API, filter active only
        if self.request.user.is_authenticated and (self.request.user.is_staff or getattr(self.request.user, 'role', None) == 'admin'):
            return Category.objects.all()
        return Category.objects.filter(is_active=True)

    def get_permissions(self):
        # Allow read-only for everyone, but require admin for write operations
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return []

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        category = self.get_object()
        products = Product.objects.filter(
            category=category,
            is_active=True,
            status=ProductStatus.APPROVED,
        )
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True, status=ProductStatus.APPROVED)
    serializer_class = ProductListSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'rating', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductSerializer
        return ProductListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = self.queryset.filter(is_featured=True)
        serializer = self.get_serializer(featured_products, many=True, context={'request': request})
        return Response(serializer.data)


class VendorProductViewSet(viewsets.ModelViewSet):
    serializer_class = VendorProductSerializer
    permission_classes = [IsAuthenticated, IsVendorUser]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Product.objects.none()
        return Product.objects.filter(vendor=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            vendor=self.request.user,
            status=ProductStatus.PENDING,
            is_active=False,
        )

    def perform_update(self, serializer):
        product = serializer.save(vendor=self.request.user)
        # Keep newly edited products pending if previously rejected
        if product.status != ProductStatus.APPROVED:
            product.is_active = False
            product.save(update_fields=['is_active'])

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        pending_count = queryset.filter(status=ProductStatus.PENDING).count()
        approved_count = queryset.filter(status=ProductStatus.APPROVED).count()
        rejected_count = queryset.filter(status=ProductStatus.REJECTED).count()

        sales = OrderItem.objects.filter(vendor=request.user)
        sales_summary = sales.aggregate(
            total_orders=Count('id'),
            total_commission=Sum('admin_commission'),
            total_earnings=Sum('vendor_earnings'),
        )

        return Response({
            'total_products': queryset.count(),
            'pending_products': pending_count,
            'approved_products': approved_count,
            'rejected_products': rejected_count,
            'total_orders': sales_summary.get('total_orders') or 0,
            'total_commission_paid': sales_summary.get('total_commission') or 0,
            'total_earnings': sales_summary.get('total_earnings') or 0,
        })


class AdminProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class = AdminProductReviewSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Product.objects.exclude(vendor__isnull=True).order_by('-created_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter in ProductStatus.values:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        pending_count = Product.objects.filter(status=ProductStatus.PENDING).count()
        approved_count = Product.objects.filter(status=ProductStatus.APPROVED).count()
        rejected_count = Product.objects.filter(status=ProductStatus.REJECTED).count()

        sales = OrderItem.objects.all()
        sales_summary = sales.aggregate(
            total_orders=Count('id'),
            total_commission=Sum('admin_commission'),
            total_sales=Sum('total'),
        )

        return Response({
            'pending_products': pending_count,
            'approved_products': approved_count,
            'rejected_products': rejected_count,
            'total_orders': sales_summary.get('total_orders') or 0,
            'total_commission_collected': sales_summary.get('total_commission') or 0,
            'gross_sales': sales_summary.get('total_sales') or 0,
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        product = self.get_object()
        product.status = ProductStatus.APPROVED
        product.is_active = True
        product.approved_by = request.user
        product.approved_at = timezone.now()
        product.admin_notes = request.data.get('admin_notes', '')
        product.save()
        return Response(self.get_serializer(product).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        product = self.get_object()
        product.status = ProductStatus.REJECTED
        product.is_active = False
        product.admin_notes = request.data.get('admin_notes', '')
        product.approved_by = request.user
        product.approved_at = timezone.now()
        product.save()
        return Response(self.get_serializer(product).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        on_sale_products = self.queryset.exclude(discount_price__isnull=True)
        serializer = self.get_serializer(on_sale_products, many=True, context={'request': request})
        return Response(serializer.data)


class AdminProductManagementViewSet(viewsets.ModelViewSet):
    """Admin product management - Full CRUD operations"""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Product.objects.all().order_by('-created_at')
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        # Filter by featured
        is_featured = self.request.query_params.get('is_featured')
        if is_featured is not None:
            queryset = queryset.filter(is_featured=is_featured.lower() == 'true')
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['post'])
    def bulk_featured(self, request):
        """Bulk mark products as featured"""
        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response({'error': 'No product IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(id__in=product_ids).update(is_featured=True)
        return Response({'message': f'{updated} products marked as featured', 'updated': updated})

    @action(detail=False, methods=['post'])
    def bulk_unfeatured(self, request):
        """Bulk unmark products as featured"""
        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response({'error': 'No product IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(id__in=product_ids).update(is_featured=False)
        return Response({'message': f'{updated} products unmarked as featured', 'updated': updated})

    @action(detail=False, methods=['post'])
    def bulk_activate(self, request):
        """Bulk activate products"""
        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response({'error': 'No product IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(id__in=product_ids).update(is_active=True)
        return Response({'message': f'{updated} products activated', 'updated': updated})

    @action(detail=False, methods=['post'])
    def bulk_deactivate(self, request):
        """Bulk deactivate products"""
        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response({'error': 'No product IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(id__in=product_ids).update(is_active=False)
        return Response({'message': f'{updated} products deactivated', 'updated': updated})

    @action(detail=False, methods=['post'])
    def bulk_restock(self, request):
        """Bulk restock products (+10 units)"""
        from django.db.models import F
        product_ids = request.data.get('product_ids', [])
        if not product_ids:
            return Response({'error': 'No product IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(id__in=product_ids).update(stock=F('stock') + 10)
        return Response({'message': f'{updated} products restocked (+10 units each)', 'updated': updated})

