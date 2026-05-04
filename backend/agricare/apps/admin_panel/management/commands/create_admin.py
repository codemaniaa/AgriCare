"""
Management command: create_admin
Usage:
    python manage.py create_admin --email admin@agricare.com --password AdminPass123! --username admin

This is the ONLY way to create admin users — not via frontend registration.
"""

import getpass
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a predefined admin user (is_staff=True, is_superuser=True, role=admin)'

    def add_arguments(self, parser):
        parser.add_argument('--email',    type=str, help='Admin email')
        parser.add_argument('--username', type=str, help='Admin username')
        parser.add_argument('--password', type=str, help='Admin password (or prompted if omitted)')

    def handle(self, *args, **options):
        email    = options['email']    or input('Email: ')
        username = options['username'] or input('Username: ')
        password = options['password'] or getpass.getpass('Password: ')

        if User.objects.filter(email=email).exists():
            self.stderr.write(self.style.ERROR(f'User with email {email} already exists.'))
            return

        user = User.objects.create_superuser(
            email    = email,
            username = username,
            password = password,
        )

        # Set role if your model supports it
        if hasattr(user, 'role'):
            user.role = 'admin'
            user.save(update_fields=['role'])

        self.stdout.write(self.style.SUCCESS(
            f'✅ Admin user created: {email} (id={user.id})\n'
            f'   is_staff=True, is_superuser=True'
        ))
