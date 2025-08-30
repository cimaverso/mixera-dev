# app/utils/url_utils.py

def obtener_base_url(request):
    base_url = str(request.base_url).rstrip("/")
    if "localhost" in base_url or "127.0.0.1" in base_url:
        return base_url
    if base_url.startswith("http://"):
        base_url = base_url.replace("http://", "https://", 1)
    return base_url