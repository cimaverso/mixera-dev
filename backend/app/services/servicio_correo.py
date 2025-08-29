# app/services/servicio_correo.py
import os
import httpx
import asyncio

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

# 👉 Debe ser del dominio autenticado (mixera.org). Sin default externo.
SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")          # ej: soporte@mixera.org
SENDER_NAME  = os.getenv("BREVO_SENDER_NAME", "Mixera")
REPLY_TO     = os.getenv("BREVO_REPLY_TO", "soporte@mixera.org")

def _plantilla_html(enlace: str, titulo: str, boton: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif">
      <tr><td align="center">
        <table width="560" cellpadding="24" cellspacing="0" style="border:1px solid #eee;border-radius:10px">
          <tr><td>
            <h2 style="margin:0 0 12px 0">{titulo}</h2>
            <p style="margin:0 0 16px 0">Si no fuiste tú, ignora este mensaje.</p>
            <p style="margin:24px 0">
              <a href="{enlace}" style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;
                 text-decoration:none;display:inline-block">{boton}</a>
            </p>
            <p style="color:#666;font-size:12px">El enlace vence en 24 horas.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """

async def enviar_correo(destinatario: str, enlace: str, tipo: str = "activacion") -> None:
    if not BREVO_API_KEY:
        raise RuntimeError("Falta BREVO_API_KEY en variables de entorno.")
    if not SENDER_EMAIL:
        raise RuntimeError("Falta BREVO_SENDER_EMAIL (usa tu remitente verificado, p.ej. soporte@mixera.org).")

    if tipo == "recuperacion":
        subject = "Recupera tu contraseña"
        html = _plantilla_html(enlace, "Solicitud de recuperación de contraseña", "Restablecer contraseña")
        text = f"Para restablecer tu contraseña, abre: {enlace}"
        tags = ["auth", "password_reset"]
    else:
        subject = "Activa tu cuenta"
        html = _plantilla_html(enlace, "Activa tu cuenta", "Activar cuenta")
        text = f"Para activar tu cuenta, abre: {enlace}"
        tags = ["auth", "activation"]

    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": destinatario}],
        "subject": subject,
        "htmlContent": html,
        "textContent": text,
        "replyTo": {"email": REPLY_TO},
        "tags": tags,
    }
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    # Reintentos básicos para 429/5xx
    backoffs = [0, 1, 2, 4]
    async with httpx.AsyncClient(timeout=20) as client:
        last_detail = None
        for delay in backoffs:
            if delay:
                await asyncio.sleep(delay)
            r = await client.post(BREVO_API_URL, json=payload, headers=headers)
            if r.status_code < 400:
                return
            last_detail = r.text[:800]
            if r.status_code in (429, 500, 502, 503, 504):
                continue  # reintenta
            break  # 4xx que no vale reintentar

    raise RuntimeError(f"Error enviando correo: {r.status_code} - {last_detail}")
