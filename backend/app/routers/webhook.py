# app/routes/webhook.py
from fastapi import APIRouter, Request, Depends
from app.services.servicio_compra import CompraService
from app.database.database import get_session
from app.services.servicio_pago import sdk
from sqlalchemy.orm import Session

router = APIRouter(prefix="/webhook", tags=["webhook"])

@router.post("/mercadopago")
async def webhook_mercadopago(request: Request, db: Session = Depends(get_session)):

    compra_service = CompraService(db)
    data = await request.json()

    topic = data.get("type") or data.get("topic")
    if topic != "payment":
        return {"status": "ignored", "reason": "topic not payment"}

    payment_id = data.get("data", {}).get("id")
    if not payment_id:
        return {"status": "ignored", "reason": "no payment id"}

    # Consultar pago real con SDK
    payment_info = sdk.payment().get(payment_id)
    response = payment_info.get("response", {})
    status_mp = response.get("status")  # "approved", "pending", etc.
    external_reference = response.get("external_reference")

    if not external_reference:
        return {"status": "ignored", "reason": "no external_reference"}

    compra = compra_service.actualizar_estado_compra(external_reference, status_mp)
    if compra:
        return {"status": "ok", "compra": compra.com_idlibro, "nuevo_estado": status_mp}
    else:
        print(f"No se encontró compra para {external_reference}")
        return {"status": "ignored", "reason": "compra no encontrada"}
