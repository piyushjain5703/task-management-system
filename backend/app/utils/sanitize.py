import bleach


def sanitize_string(value: str) -> str:
    """Strip all HTML tags from a string to prevent XSS."""
    return bleach.clean(value, tags=[], attributes={}, strip=True).strip()
