from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('username', 'email', 'full_name', 'role', 'city', 'is_active', 'is_verified', 'date_joined')
    list_filter   = ('role', 'is_active', 'is_verified', 'is_staff')
    search_fields = ('username', 'email', 'full_name', 'cnic')
    ordering      = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal', {'fields': ('full_name', 'email', 'cnic', 'city', 'role', 'profile_picture')}),
        ('Status', {'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
        ('Dates', {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('username', 'email', 'cnic', 'full_name', 'role', 'city', 'password1', 'password2'),
        }),
    )
    readonly_fields = ('date_joined', 'last_login')


@admin.register(OTPVerification)
class OTPAdmin(admin.ModelAdmin):
    list_display  = ('email', 'otp', 'is_used', 'created_at')
    list_filter   = ('is_used',)
    search_fields = ('email',)
    ordering      = ('-created_at',)
