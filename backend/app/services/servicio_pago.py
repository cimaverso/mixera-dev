# app/services/servicio_pago.py
import mercadopago
import os
from dotenv import load_dotenv


load_dotenv()

ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN_PROD")
sdk = mercadopago.SDK(ACCESS_TOKEN)

def crear_preferencia_pago(nombre_producto: str, precio: float, usuario_id: int, libro_id: int, cantidad: int = 1) -> str:

    reference = f"{usuario_id}:{libro_id}"
    preference_data = {
        "items": [
            {
                "title": nombre_producto,
                "quantity": cantidad,
                "currency_id": "COP",
                "unit_price": precio
            }
        ],
        "back_urls": {
            "success": "https://www.tusitio.com/success",
            "failure": "https://www.tusitio.com/failure",
            "pending": "https://www.tusitio.com/pending"
        },
        "auto_return": "approved",
        "notification_url": "https://api.mixera.org/webhook/mercadopago",
        "external_reference": reference
    }

    try:
        response = sdk.preference().create(preference_data)
        link = response["response"]["init_point"]
        return link, reference   
    except Exception as e:
        raise Exception(f"Error creando preferencia: {e}")
