import os
from datetime import datetime, timezone
import mercadopago

ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN_PROD")
sdk = mercadopago.SDK(ACCESS_TOKEN)


def _sum_fee(payment: dict) -> float:
    fee_details = payment.get("fee_details", [])
    return sum(float(f.get("amount", 0)) for f in fee_details)


def listar_estadisticas():
    result = sdk.payment().search({"status": "approved"})
    pagos = result.get("response", {}).get("results", [])

    hoy = datetime.now(timezone.utc).date()
    mes_actual = hoy.month
    año_actual = hoy.year

    ventas_hoy = 0
    ingresos_mes = 0.0
    comisiones = 0.0

    for p in pagos:
        fecha = None
        if p.get("date_approved"):
            try:
                fecha = datetime.fromisoformat(
                    p["date_approved"].replace("Z", "+00:00")
                ).date()
            except Exception:
                fecha = None

        monto = float(p.get("transaction_amount") or 0)
        fee = _sum_fee(p)

        if fecha == hoy:
            ventas_hoy += 1
        if fecha and fecha.month == mes_actual and fecha.year == año_actual:
            ingresos_mes += monto
            comisiones += fee

    return {
        "ventas_hoy": ventas_hoy,
        "ingresos_mes": round(ingresos_mes, 2),
        "transacciones": len([p for p in pagos if p.get("status") == "approved"]),
        "comisiones": round(comisiones, 2),
    }

