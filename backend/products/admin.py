from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'is_primary')
    verbose_name = 'Product Image'
    verbose_name_plural = 'Product Images'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'product_count', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'slug', 'description', 'image')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
    
    def product_count(self, obj):
        count = obj.products.count()
        url = reverse('admin:products_product_changelist') + f'?category__id__exact={obj.id}'
        return format_html('<a href="{}">{} Products</a>', url, count)
    product_count.short_description = 'Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'name', 'category', 'price_display', 'stock', 'stock_status', 'is_active', 'is_featured', 'rating', 'created_at')
    list_filter = ('category', 'is_active', 'is_featured', 'created_at', 'rating', 'stock')
    search_fields = ('name', 'description', 'category__name')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    list_editable = ('is_active', 'is_featured', 'stock')
    date_hierarchy = 'created_at'
    list_per_page = 25
    actions = ['make_featured', 'make_unfeatured', 'activate_products', 'deactivate_products', 'restock_products']
    
    fieldsets = (
        ('Product Information', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('Pricing', {
            'fields': ('price', 'discount_price')
        }),
        ('Inventory', {
            'fields': ('stock', 'is_active')
        }),
        ('Marketing', {
            'fields': ('is_featured', 'rating', 'num_reviews')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'num_reviews')
    
    def price_display(self, obj):
        if obj.discount_price:
            return format_html(
                '<span style="text-decoration: line-through; color: gray;">₹{}</span> '
                '<span style="color: green; font-weight: bold;">₹{}</span>',
                obj.price, obj.discount_price
            )
        return format_html('₹{}', obj.price)
    price_display.short_description = 'Price'
    
    def stock_status(self, obj):
        if obj.stock == 0:
            return format_html('<span style="color: red; font-weight: bold;">Out of Stock</span>')
        elif obj.stock < 10:
            return format_html('<span style="color: orange; font-weight: bold;">Low Stock ({})</span>', obj.stock)
        else:
            return format_html('<span style="color: green;">In Stock ({})</span>', obj.stock)
    stock_status.short_description = 'Stock Status'
    
    def image_preview(self, obj):
        """Show product image thumbnail in list view"""
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />', obj.image.url)
        # Try to get primary image from ProductImage
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image and primary_image.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />', primary_image.image.url)
        return format_html('<span style="color: #999;">No Image</span>')
    image_preview.short_description = 'Image'
    
    # Admin Actions
    def make_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} products marked as featured.')
    make_featured.short_description = 'Mark selected products as featured'
    
    def make_unfeatured(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f'{updated} products unmarked as featured.')
    make_unfeatured.short_description = 'Unmark selected products as featured'
    
    def activate_products(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} products activated.')
    activate_products.short_description = 'Activate selected products'
    
    def deactivate_products(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} products deactivated.')
    deactivate_products.short_description = 'Deactivate selected products'
    
    def restock_products(self, request, queryset):
        # This is a placeholder - you can customize the restock amount
        from django.db.models import F
        updated = queryset.update(stock=F('stock') + 10)
        self.message_user(request, f'Restocked {updated} products (+10 units each).')
    restock_products.short_description = 'Restock selected products (+10 units)'


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'created_at', 'product__category')
    search_fields = ('product__name',)
    list_editable = ('is_primary',)
    list_per_page = 25
    readonly_fields = ('created_at', 'image_preview')
    
    fieldsets = (
        ('Image Information', {
            'fields': ('product', 'image', 'image_preview', 'is_primary')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover;" />', obj.image.url)
        return 'No image'
    image_preview.short_description = 'Preview'

