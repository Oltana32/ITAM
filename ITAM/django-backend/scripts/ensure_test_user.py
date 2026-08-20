import os
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()
if not user:
    user = User.objects.create_user(email='test@example.local', password='TestPass123')
    print('Created user test@example.local with password TestPass123')
else:
    # Ensure password is set to known value
    user.set_password('TestPass123')
    user.save()
    print(f'Ensured password for existing user {user.email} set to TestPass123')
