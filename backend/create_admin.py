from django.contrib.auth.models import User
if User.objects.filter(username='admin').exists():
    User.objects.filter(username='admin').delete()
User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
print('Superuser created successfully')
