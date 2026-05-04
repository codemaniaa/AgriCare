"""
Usage:
    python manage.py seed_demo

Creates 3 demo users + 12 demo products + 4 live auctions + sample bids.
"""
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from agricare.apps.products.models import Product

User = get_user_model()

DEMO_USERS = [
    {'username':'alikhan',   'email':'ali@gmail.com',   'full_name':'Ali Khan',   'role':'farmer','city':'Multan',   'cnic':'3520212345671','password':'demo1234'},
    {'username':'saraahmed', 'email':'sara@gmail.com',  'full_name':'Sara Ahmed', 'role':'seller','city':'Lahore',   'cnic':'3520212345672','password':'demo1234'},
    {'username':'bilalshah', 'email':'bilal@gmail.com', 'full_name':'Bilal Shah', 'role':'buyer', 'city':'Karachi',  'cnic':'4210112345673','password':'demo1234'},
]

DEMO_PRODUCTS = [
    ('Golden Wheat Premium',     'grains',     'Wheat',      150,  5000, 'buy_now',   'Multan'),
    ('Fresh Mangoes Alphonso',   'fruits',     'Mango',      250,  1200, 'buy_now',   'Lahore'),
    ('Corn 3100kg Batch',        'grains',     'Maize',      130,  3100, 'negotiable','Faisalabad'),
    ('Organic Potatoes Grade A', 'vegetables', 'Potato',     80,   2000, 'buy_now',   'Okara'),
    ('Okra Fresh Harvest',       'vegetables', 'Okra',       100,  800,  'buy_now',   'Multan'),
    ('Basmati Rice Premium',     'grains',     'Rice',       190,  2800, 'buy_now',   'Sheikhupura'),
    ('Tomatoes Vine Ripen 1200', 'vegetables', 'Tomato',     120,  1500, 'auction',   'Karachi'),
    ('Guava Fresh Pack 600kg',   'fruits',     'Guava',      90,   600,  'buy_now',   'Lahore'),
    ('Urea Fertilizer 50kg',     'fertilizers','Urea',      3500,  100,  'buy_now',   'Islamabad'),
    ('Premium Fresh Okra 500kg', 'vegetables', 'Okra',       100,  500,  'auction',   'Okara'),
    ('Goat Pair Beetal',         'livestock',  'Goats',    45000,    2,  'auction',   'Gujranwala'),
    ('Garlic Fresh 50kg',        'vegetables', 'Garlic',     200,  500,  'buy_now',   'Sahiwal'),
]

AUCTION_CONFIGS = [
    ('Tomatoes Vine Ripen 1200', 100,   5,  3),   # ends in 3 hours
    ('Premium Fresh Okra 500kg', 100,   5,  5),   # ends in 5 hours
    ('Goat Pair Beetal',        40000, 500, 8),   # ends in 8 hours
]


class Command(BaseCommand):
    help = 'Seed demo users, products and auctions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🌱 Seeding AgriCare demo data...\n'))
        users = self._seed_users()
        self._seed_products(users)
        self._seed_auctions(users)
        self.stdout.write(self.style.SUCCESS('\n✅ Demo data seeded!\n'))
        self.stdout.write('Demo credentials:')
        for u in DEMO_USERS:
            self.stdout.write(f"  {u['username']} | CNIC: {u['cnic']} | pw: {u['password']}")

    def _seed_users(self):
        users = []
        for u in DEMO_USERS:
            obj, created = User.objects.get_or_create(
                username=u['username'],
                defaults={
                    'email':      u['email'],
                    'full_name':  u['full_name'],
                    'role':       u['role'],
                    'city':       u['city'],
                    'cnic':       u['cnic'],
                    'is_active':  True,
                    'is_verified':True,
                }
            )
            if created:
                obj.set_password(u['password'])
                obj.save()
                self.stdout.write(f'  ✓ User: {obj.username}')
            users.append(obj)
        return users

    def _seed_products(self, users):
        for title, cat, subcat, price, stock, ptype, city in DEMO_PRODUCTS:
            if not Product.objects.filter(title=title).exists():
                Product.objects.create(
                    seller      = random.choice(users),
                    title       = title,
                    description = (
                        f'High quality {title.lower()}. Freshly harvested and ready for delivery. '
                        f'Minimum order: 10kg. Bulk discounts available for orders above 100kg. '
                        f'Contact seller for custom quantities and price negotiation.'
                    ),
                    price        = price,
                    category     = cat,
                    subcategory  = subcat,
                    location     = city,
                    product_type = ptype,
                    stock_qty    = stock,
                    rating       = round(random.uniform(4.0, 5.0), 1),
                    rating_count = random.randint(5, 50),
                )
                self.stdout.write(f'  ✓ Product: {title}')

    def _seed_auctions(self, users):
        from agricare.apps.auctions.models import Auction, Bid

        seller = users[0]  # alikhan is the default auction seller

        for title, base, increment, hours in AUCTION_CONFIGS:
            try:
                product = Product.objects.get(title=title)
                if hasattr(product, 'auction'):
                    continue

                end_time = timezone.now() + timezone.timedelta(hours=hours, minutes=14, seconds=21)
                auction  = Auction.objects.create(
                    product           = product,
                    seller            = product.seller,
                    base_price        = base,
                    min_bid_increment = increment,
                    auction_end       = end_time,
                    status            = 'active',
                )

                # Seed some realistic bids
                bid_amounts = sorted([
                    base + increment * random.randint(1, 5),
                    base + increment * random.randint(6, 15),
                    base + increment * random.randint(16, 30),
                ])
                bidders = [u for u in users if u != product.seller]
                for i, amount in enumerate(bid_amounts):
                    bidder = bidders[i % len(bidders)]
                    Bid.objects.create(
                        auction    = auction,
                        bidder     = bidder,
                        amount     = amount,
                        is_winning = (i == len(bid_amounts) - 1),
                        created_at = timezone.now() - timezone.timedelta(minutes=(len(bid_amounts)-i)*5),
                    )

                # Set current price to highest bid
                auction.current_price  = bid_amounts[-1]
                auction.highest_bidder = bidders[(len(bid_amounts)-1) % len(bidders)]
                auction.total_bids     = len(bid_amounts)
                auction.save()

                self.stdout.write(f'  ✓ Auction: {title} — ends in {hours}h')
            except Product.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  ⚠ Product not found: {title}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ Auction error ({title}): {e}'))
