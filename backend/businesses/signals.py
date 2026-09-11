from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Business


@receiver(post_save, sender=Business)
@receiver(post_delete, sender=Business)
def invalidate_business_list_cache(sender, instance, **kwargs):
    from listings.list_cache import invalidate
    invalidate("business")
