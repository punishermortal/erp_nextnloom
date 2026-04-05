from django.core.management.base import BaseCommand
from products.models import Category, Product
from accounts.models import User
import random


class Command(BaseCommand):
    help = 'Seeds the database with sample categories and products'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting to seed database...'))

        # Create Categories
        categories_data = [
            {
                'name': 'Fresh Fruits',
                'slug': 'fresh-fruits',
                'description': 'Fresh and organic fruits delivered daily'
            },
            {
                'name': 'Fresh Vegetables',
                'slug': 'fresh-vegetables',
                'description': 'Farm-fresh vegetables for your kitchen'
            },
            {
                'name': 'Dairy & Eggs',
                'slug': 'dairy-eggs',
                'description': 'Fresh dairy products and organic eggs'
            },
            {
                'name': 'Bakery',
                'slug': 'bakery',
                'description': 'Freshly baked bread and pastries'
            },
            {
                'name': 'Organic Foods',
                'slug': 'organic-foods',
                'description': '100% organic and natural products'
            },
            {
                'name': 'Beverages',
                'slug': 'beverages',
                'description': 'Fresh juices and healthy drinks'
            },
            {
                'name': 'Snacks',
                'slug': 'snacks',
                'description': 'Healthy snacks and munchies'
            },
            {
                'name': 'Meat & Seafood',
                'slug': 'meat-seafood',
                'description': 'Fresh meat and seafood'
            },
        ]

        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories[cat_data['slug']] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Category already exists: {category.name}'))

        # Create Products
        products_data = [
            # Fresh Fruits
            {
                'name': 'Organic Apples - Red Delicious',
                'slug': 'organic-apples-red-delicious',
                'category': 'fresh-fruits',
                'description': 'Crisp and sweet red delicious apples, grown organically without pesticides. Perfect for snacking or cooking.',
                'price': 4.99,
                'discount_price': 3.99,
                'stock': 100,
                'is_featured': True,
                'rating': 4.5,
                'num_reviews': 45
            },
            {
                'name': 'Fresh Bananas - Organic',
                'slug': 'fresh-bananas-organic',
                'category': 'fresh-fruits',
                'description': 'Sweet and creamy organic bananas. Rich in potassium and perfect for smoothies.',
                'price': 2.49,
                'stock': 150,
                'is_featured': True,
                'rating': 4.7,
                'num_reviews': 89
            },
            {
                'name': 'Strawberries - Fresh',
                'slug': 'strawberries-fresh',
                'category': 'fresh-fruits',
                'description': 'Juicy and sweet fresh strawberries. Perfect for desserts and breakfast.',
                'price': 5.99,
                'discount_price': 4.49,
                'stock': 75,
                'rating': 4.6,
                'num_reviews': 67
            },
            {
                'name': 'Oranges - Navel',
                'slug': 'oranges-navel',
                'category': 'fresh-fruits',
                'description': 'Sweet and juicy navel oranges. High in vitamin C.',
                'price': 3.99,
                'stock': 120,
                'rating': 4.4,
                'num_reviews': 52
            },
            {
                'name': 'Blueberries - Organic',
                'slug': 'blueberries-organic',
                'category': 'fresh-fruits',
                'description': 'Antioxidant-rich organic blueberries. Great for smoothies and baking.',
                'price': 6.99,
                'discount_price': 5.99,
                'stock': 50,
                'is_featured': True,
                'rating': 4.8,
                'num_reviews': 34
            },
            # Fresh Vegetables
            {
                'name': 'Organic Tomatoes',
                'slug': 'organic-tomatoes',
                'category': 'fresh-vegetables',
                'description': 'Fresh organic tomatoes. Perfect for salads, sauces, and cooking.',
                'price': 3.49,
                'stock': 200,
                'is_featured': True,
                'rating': 4.5,
                'num_reviews': 78
            },
            {
                'name': 'Fresh Carrots - Organic',
                'slug': 'fresh-carrots-organic',
                'category': 'fresh-vegetables',
                'description': 'Crisp and sweet organic carrots. Rich in beta-carotene.',
                'price': 2.99,
                'stock': 180,
                'rating': 4.6,
                'num_reviews': 56
            },
            {
                'name': 'Broccoli - Fresh',
                'slug': 'broccoli-fresh',
                'category': 'fresh-vegetables',
                'description': 'Fresh broccoli florets. High in vitamins and fiber.',
                'price': 3.99,
                'stock': 90,
                'rating': 4.3,
                'num_reviews': 43
            },
            {
                'name': 'Spinach - Organic',
                'slug': 'spinach-organic',
                'category': 'fresh-vegetables',
                'description': 'Fresh organic spinach. Perfect for salads and cooking.',
                'price': 2.79,
                'stock': 110,
                'rating': 4.4,
                'num_reviews': 61
            },
            {
                'name': 'Bell Peppers - Mixed Colors',
                'slug': 'bell-peppers-mixed',
                'category': 'fresh-vegetables',
                'description': 'Fresh bell peppers in red, yellow, and green. Sweet and crunchy.',
                'price': 4.49,
                'discount_price': 3.99,
                'stock': 70,
                'rating': 4.7,
                'num_reviews': 39
            },
            # Dairy & Eggs
            {
                'name': 'Organic Whole Milk',
                'slug': 'organic-whole-milk',
                'category': 'dairy-eggs',
                'description': 'Fresh organic whole milk. Rich and creamy.',
                'price': 5.99,
                'stock': 80,
                'is_featured': True,
                'rating': 4.6,
                'num_reviews': 95
            },
            {
                'name': 'Free Range Eggs - Dozen',
                'slug': 'free-range-eggs-dozen',
                'category': 'dairy-eggs',
                'description': 'Fresh free-range eggs from happy hens. Rich in protein.',
                'price': 4.99,
                'discount_price': 4.49,
                'stock': 100,
                'is_featured': True,
                'rating': 4.8,
                'num_reviews': 112
            },
            {
                'name': 'Greek Yogurt - Organic',
                'slug': 'greek-yogurt-organic',
                'category': 'dairy-eggs',
                'description': 'Creamy organic Greek yogurt. High in protein and probiotics.',
                'price': 6.49,
                'stock': 60,
                'rating': 4.7,
                'num_reviews': 73
            },
            {
                'name': 'Butter - Organic',
                'slug': 'butter-organic',
                'category': 'dairy-eggs',
                'description': 'Rich and creamy organic butter. Perfect for cooking and baking.',
                'price': 7.99,
                'stock': 45,
                'rating': 4.5,
                'num_reviews': 58
            },
            # Bakery
            {
                'name': 'Whole Grain Bread',
                'slug': 'whole-grain-bread',
                'category': 'bakery',
                'description': 'Freshly baked whole grain bread. Rich in fiber and nutrients.',
                'price': 3.99,
                'stock': 40,
                'is_featured': True,
                'rating': 4.6,
                'num_reviews': 84
            },
            {
                'name': 'Croissants - Fresh Baked',
                'slug': 'croissants-fresh-baked',
                'category': 'bakery',
                'description': 'Buttery and flaky fresh-baked croissants. Perfect for breakfast.',
                'price': 4.99,
                'discount_price': 3.99,
                'stock': 30,
                'rating': 4.8,
                'num_reviews': 67
            },
            {
                'name': 'Bagels - Assorted',
                'slug': 'bagels-assorted',
                'category': 'bakery',
                'description': 'Fresh baked assorted bagels. Available in multiple flavors.',
                'price': 5.49,
                'stock': 35,
                'rating': 4.4,
                'num_reviews': 52
            },
            # Organic Foods
            {
                'name': 'Organic Quinoa',
                'slug': 'organic-quinoa',
                'category': 'organic-foods',
                'description': 'Nutrient-rich organic quinoa. Perfect for salads and side dishes.',
                'price': 8.99,
                'discount_price': 7.99,
                'stock': 50,
                'is_featured': True,
                'rating': 4.7,
                'num_reviews': 41
            },
            {
                'name': 'Organic Honey - Raw',
                'slug': 'organic-honey-raw',
                'category': 'organic-foods',
                'description': 'Pure raw organic honey. Natural sweetener with health benefits.',
                'price': 12.99,
                'stock': 25,
                'rating': 4.9,
                'num_reviews': 89
            },
            {
                'name': 'Organic Almonds',
                'slug': 'organic-almonds',
                'category': 'organic-foods',
                'description': 'Premium organic almonds. Rich in protein and healthy fats.',
                'price': 11.99,
                'discount_price': 9.99,
                'stock': 40,
                'rating': 4.6,
                'num_reviews': 56
            },
            # Beverages
            {
                'name': 'Fresh Orange Juice',
                'slug': 'fresh-orange-juice',
                'category': 'beverages',
                'description': 'Freshly squeezed orange juice. Rich in vitamin C.',
                'price': 4.99,
                'stock': 60,
                'is_featured': True,
                'rating': 4.5,
                'num_reviews': 78
            },
            {
                'name': 'Organic Green Tea',
                'slug': 'organic-green-tea',
                'category': 'beverages',
                'description': 'Premium organic green tea. Antioxidant-rich and refreshing.',
                'price': 7.99,
                'stock': 70,
                'rating': 4.7,
                'num_reviews': 63
            },
            {
                'name': 'Coconut Water - Natural',
                'slug': 'coconut-water-natural',
                'category': 'beverages',
                'description': 'Natural coconut water. Hydrating and refreshing.',
                'price': 3.99,
                'discount_price': 2.99,
                'stock': 80,
                'rating': 4.4,
                'num_reviews': 47
            },
            # Snacks
            {
                'name': 'Organic Granola',
                'slug': 'organic-granola',
                'category': 'snacks',
                'description': 'Crunchy organic granola with nuts and dried fruits.',
                'price': 6.99,
                'stock': 55,
                'rating': 4.6,
                'num_reviews': 72
            },
            {
                'name': 'Trail Mix - Organic',
                'slug': 'trail-mix-organic',
                'category': 'snacks',
                'description': 'Healthy organic trail mix with nuts, seeds, and dried fruits.',
                'price': 8.49,
                'discount_price': 7.49,
                'stock': 45,
                'rating': 4.5,
                'num_reviews': 58
            },
            # Meat & Seafood
            {
                'name': 'Salmon Fillet - Fresh',
                'slug': 'salmon-fillet-fresh',
                'category': 'meat-seafood',
                'description': 'Fresh salmon fillet. Rich in omega-3 fatty acids.',
                'price': 15.99,
                'stock': 30,
                'is_featured': True,
                'rating': 4.8,
                'num_reviews': 91
            },
            {
                'name': 'Organic Chicken Breast',
                'slug': 'organic-chicken-breast',
                'category': 'meat-seafood',
                'description': 'Fresh organic chicken breast. Lean and protein-rich.',
                'price': 9.99,
                'stock': 50,
                'rating': 4.7,
                'num_reviews': 76
            },
        ]

        created_count = 0
        updated_count = 0

        for prod_data in products_data:
            # Create a copy to avoid modifying the original
            product_data = prod_data.copy()
            category_slug = product_data.pop('category')
            category = categories.get(category_slug)
            
            if not category:
                self.stdout.write(self.style.ERROR(f'Category {category_slug} not found, skipping product {product_data["name"]}'))
                continue

            slug = product_data.pop('slug')
            discount_price = product_data.pop('discount_price', None)
            is_featured = product_data.pop('is_featured', False)
            rating = product_data.pop('rating', 0.0)
            num_reviews = product_data.pop('num_reviews', 0)
            
            product, created = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    **product_data,
                    'category': category,
                    'discount_price': discount_price,
                    'is_featured': is_featured,
                    'rating': rating,
                    'num_reviews': num_reviews,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created product: {product.name}'))
            else:
                # Update existing product
                for key, value in product_data.items():
                    setattr(product, key, value)
                product.category = category
                if discount_price is not None:
                    product.discount_price = discount_price
                product.is_featured = is_featured
                product.rating = rating
                product.num_reviews = num_reviews
                product.save()
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'Updated product: {product.name}'))

        self.stdout.write(self.style.SUCCESS('\nSeeding complete!'))
        self.stdout.write(self.style.SUCCESS(f'  - Created: {created_count} products'))
        self.stdout.write(self.style.SUCCESS(f'  - Updated: {updated_count} products'))
        self.stdout.write(self.style.SUCCESS(f'  - Categories: {len(categories)} categories'))

