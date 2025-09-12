import os
import httpx
import asyncio
import base64
from datetime import datetime

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")  # ej: soporte@mixera.org
SENDER_NAME  = os.getenv("BREVO_SENDER_NAME", "Mixera")
REPLY_TO_DEF = os.getenv("BREVO_REPLY_TO", "soporte@mixera.org")
DESTINATARIO_SOPORTE = os.getenv("SOPORTE_EMAIL", "tickets@mixera.org")

async def enviar_ticket_soporte(
    nombre_usuario: str,
    correo_usuario: str,
    tipo: str,
    mensaje: str,
    imagen=None
):
    if not BREVO_API_KEY or not SENDER_EMAIL:
        raise RuntimeError("Faltan variables de entorno de Brevo")

    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    subject = f"[Soporte] {tipo.title()} - {nombre_usuario}"

    text = f"""
Nuevo ticket de soporte

Usuario: {nombre_usuario}
Correo: {correo_usuario}
Tipo: {tipo}
Fecha: {fecha}

Mensaje:
{mensaje}
    """.strip()

    html = f"""
<h2>Nuevo ticket de soporte</h2>
<p><b>Usuario:</b> {nombre_usuario}</p>
<p><b>Correo:</b> {correo_usuario}</p>
<p><b>Tipo:</b> {tipo}</p>
<p><b>Fecha:</b> {fecha}</p>
<p><b>Mensaje:</b></p>
<p style="white-space:pre-line">{mensaje}</p>
    """.strip()

    # Adjuntos (opcional)
    attachments = []
    if imagen:
        content = await imagen.read()
        attachments.append({
            "content": base64.b64encode(content).decode(),
            "name": imagen.filename
        })

    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": "cimaverso@gmail.com"}],
        "subject": subject,
        "htmlContent": html,
        "textContent": text,
        # Usa el correo del usuario como replyTo; si no viene, usa el por defecto
        "replyTo": {"email": correo_usuario or REPLY_TO_DEF, "name": nombre_usuario},
        "tags": ["soporte", tipo],
    }
    if attachments:
        payload["attachment"] = attachments

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

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
                continue
            break

    raise RuntimeError(f"Error enviando correo: {r.status_code} - {last_detail}")
