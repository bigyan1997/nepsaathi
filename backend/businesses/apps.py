from django.apps import AppConfig


class BusinessesConfig(AppConfig):
    name = 'businesses'

    def ready(self):
        import businesses.signals  # noqa: F401
