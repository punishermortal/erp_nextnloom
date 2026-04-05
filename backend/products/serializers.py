from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Category, Product, ProductImage, ProductStatus


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'is_active')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'is_primary')


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False)
    images = ProductImageSerializer(many=True, read_only=True)
    final_price = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    primary_image = serializers.SerializerMethodField()
    vendor = UserSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'description', 'category', 'category_id', 
                  'price', 'discount_price', 'final_price', 'discount_percentage',
                  'stock', 'image', 'images', 'primary_image', 'is_active', 'is_featured', 
                  'rating', 'num_reviews', 'commission_rate', 'status', 'admin_notes',
                  'vendor', 'approved_at', 'created_at', 'updated_at')
        read_only_fields = ('slug', 'status', 'approved_at', 'created_at', 'updated_at', 'num_reviews', 'rating', 'vendor')

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
        # Fallback to main product image
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    final_price = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    primary_image = serializers.SerializerMethodField()
    vendor = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'category', 'price', 'discount_price', 
                  'final_price', 'discount_percentage', 'stock', 'image', 
                  'primary_image', 'is_featured', 'rating', 'num_reviews', 'vendor')

    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
        # Fallback to main product image
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

    def get_vendor(self, obj):
        if not obj.vendor:
            return None
        return {
            'id': obj.vendor.id,
            'business_name': getattr(obj.vendor.vendor_profile, 'business_name', obj.vendor.get_full_name()),
        }


class VendorProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'category',
            'category_id',
            'price',
            'discount_price',
            'stock',
            'image',
            'commission_rate',
            'status',
            'admin_notes',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('slug', 'status', 'admin_notes', 'is_active', 'created_at', 'updated_at', 'category')

    def validate_commission_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Commission rate must be between 0 and 100.")
        return value


class AdminProductReviewSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    vendor = UserSerializer(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'category',
            'price',
            'discount_price',
            'commission_rate',
            'status',
            'vendor',
            'admin_notes',
            'created_at',
            'updated_at',
        )

