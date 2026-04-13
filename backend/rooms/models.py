from django.db import models

# Create your models here.
from django.db import models
from listings.models import Listing


class Room(models.Model):
    """
    Room/rental specific details for a NepSaathi listing.
    Links back to the base Listing model via OneToOneField.

    Example:
        listing = Listing(type='room', title='Private room in Parramatta')
        room = Room(listing=listing, price=250, room_type='private')
    """

    class RoomType(models.TextChoices):
        PRIVATE = 'private', 'Private Room'
        SHARED = 'shared', 'Shared Room'
        ENTIRE = 'entire', 'Entire Property'
        STUDIO = 'studio', 'Studio'

    class FurnishingType(models.TextChoices):
        FURNISHED = 'furnished', 'Fully Furnished'
        PARTIAL = 'partial', 'Partially Furnished'
        UNFURNISHED = 'unfurnished', 'Unfurnished'

    class BondType(models.TextChoices):
        TWO_WEEKS = '2_weeks', '2 Weeks'
        FOUR_WEEKS = '4_weeks', '4 Weeks'
        SIX_WEEKS = '6_weeks', '6 Weeks'
        NEGOTIABLE = 'negotiable', 'Negotiable'

    # Link to base listing
    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name='room_detail'
    )

    # Room specific fields
    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices,
        default=RoomType.PRIVATE
    )
    price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='Weekly rent in AUD'
    )
    furnishing = models.CharField(
        max_length=20,
        choices=FurnishingType.choices,
        default=FurnishingType.FURNISHED
    )
    bond = models.CharField(
        max_length=20,
        choices=BondType.choices,
        default=BondType.FOUR_WEEKS
    )
    bills_included = models.BooleanField(
        default=False,
        help_text='Are electricity, water, internet included in the rent?'
    )
    available_from = models.DateField(
        null=True,
        blank=True,
        help_text='Date the room is available from'
    )
    bedrooms = models.PositiveIntegerField(default=1)
    bathrooms = models.PositiveIntegerField(default=1)
    max_occupants = models.PositiveIntegerField(
        default=1,
        help_text='Maximum number of people allowed'
    )
    nepalese_household = models.BooleanField(
        default=False,
        help_text='Is this a Nepalese household?'
    )
    pets_allowed = models.BooleanField(default=False)
    parking_available = models.BooleanField(default=False)

    class Meta:
        db_table = 'rooms'
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'

    def __str__(self):
        return f'{self.get_room_type_display()} — ${self.price}/wk ({self.listing.location})'

    @property
    def price_display(self):
        """Returns formatted price string e.g. $250/wk"""
        return f'${self.price}/wk'