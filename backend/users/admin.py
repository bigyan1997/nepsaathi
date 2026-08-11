from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserReview, PointEvent, PushSubscription


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for NepSaathi User model — no username field."""

    # What shows in the user list
    list_display = ('email', 'first_name', 'last_name', 'is_verified', 'is_staff', 'created_at')
    list_filter = ('is_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    actions = ['verify_users', 'unverify_users']

    @admin.action(description='✅ Verify selected users (sends confirmation email)')
    def verify_users(self, request, queryset):
        from core.emails import send_user_verified_email
        count = 0
        for user in queryset.filter(is_verified=False):
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            try:
                send_user_verified_email(user)
            except Exception as e:
                print(f'Verify email failed for {user.email}: {e}', flush=True)
            count += 1
        self.message_user(request, f'{count} user(s) verified and notified by email.')

    @admin.action(description='❌ Unverify selected users')
    def unverify_users(self, request, queryset):
        updated = queryset.filter(is_verified=True).update(is_verified=False)
        self.message_user(request, f'{updated} user(s) unverified.')

    # Override fieldsets — remove username completely
    fieldsets = (
        ('Login', {
            'fields': ('email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'avatar', 'phone', 'location', 'bio')
        }),
        ('NepSaathi status', {
            'fields': ('is_verified', 'points', 'referral_code', 'referred_by')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Account Status', {
            'fields': ('is_banned', 'ban_reason'),
        }),
    )

    # Override add_fieldsets — form when creating a new user in admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        if change:
            old = User.objects.get(pk=obj.pk)
            was_verified = old.is_verified
            was_banned = old.is_banned
        super().save_model(request, obj, form, change)
        if not change:
            return
        try:
            from core.emails import send_user_verified_email, send_user_banned_email
            if not was_verified and obj.is_verified:
                send_user_verified_email(obj)
            if not was_banned and obj.is_banned:
                send_user_banned_email(obj)
        except Exception as e:
            print(f'User admin email failed: {e}', flush=True)


@admin.register(UserReview)
class UserReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'reviewed_user', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('reviewer__email', 'reviewed_user__email', 'comment')
    readonly_fields = ('reviewer', 'reviewed_user', 'rating', 'comment', 'created_at')
    ordering = ('-created_at',)


@admin.register(PointEvent)
class PointEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'event_type', 'delta', 'description', 'created_at')
    list_filter = ('event_type',)
    search_fields = ('user__email', 'description')
    readonly_fields = ('user', 'event_type', 'delta', 'description', 'created_at')
    ordering = ('-created_at',)


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'endpoint', 'created_at')
    search_fields = ('user__email', 'endpoint')
    readonly_fields = ('user', 'endpoint', 'p256dh', 'auth', 'created_at')
    ordering = ('-created_at',)