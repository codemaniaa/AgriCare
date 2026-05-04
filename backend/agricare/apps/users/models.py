import random
import string
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
    ('admin', 'Admin'), 
    ('farmer', 'Farmer'),
    ('buyer', 'Buyer'),
    ('seller', 'Seller'), 
    ]

    username        = models.CharField(max_length=50, unique=True)
    email           = models.EmailField(unique=True)
    full_name       = models.CharField(max_length=150)
    role            = models.CharField(max_length=20, choices=ROLE_CHOICES, default='buyer')
    city            = models.CharField(max_length=100, blank=True)
    cnic            = models.CharField(max_length=15, unique=True)  # XXXXX-XXXXXXX-X
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_verified     = models.BooleanField(default=False)
    is_active       = models.BooleanField(default=False)   # activated after OTP
    is_staff        = models.BooleanField(default=False)
    date_joined     = models.DateTimeField(default=timezone.now)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    # privacy control
    show_phone = models.BooleanField(default=True)
    show_email = models.BooleanField(default=False)
    show_address = models.BooleanField(default=True)
    
    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'cnic']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'

    def __str__(self):
        return f'{self.username} ({self.role})'


class OTPVerification(models.Model):
    email      = models.EmailField()
    otp        = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used    = models.BooleanField(default=False)

    class Meta:
        db_table = 'otp_verifications'
        ordering = ['-created_at']

    def is_valid(self):
        expiry = self.created_at + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        return not self.is_used and timezone.now() <= expiry

    @classmethod
    def generate_otp(cls):
        return ''.join(random.choices(string.digits, k=6))

    def __str__(self):
        return f'{self.email} — {self.otp}'
