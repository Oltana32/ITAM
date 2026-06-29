import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.users.models import UserProfile

# Create admin user if it doesn't exist
if not User.objects.filter(username='admin').exists():
    user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    UserProfile.objects.create(user=user, role='admin')
    print('Created admin user: admin / admin123')
else:
    print('Admin user already exists')

print('Total users:', User.objects.count())