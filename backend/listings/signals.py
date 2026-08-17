from django.contrib.postgres.search import SearchVector
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Listing


@receiver(post_save, sender=Listing)
def update_listing_search_vector(sender, instance, **kwargs):
    # Use .update() to avoid triggering post_save again and to correctly
    # evaluate SearchVector as a DB expression (not a Python value).
    Listing.objects.filter(pk=instance.pk).update(
        search_vector=(
            SearchVector('title', weight='A', config='english') +
            SearchVector('location', weight='B', config='english') +
            SearchVector('description', weight='C', config='english')
        )
    )
