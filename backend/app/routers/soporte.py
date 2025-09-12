from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException
from app.core.auth_core import obtener_usuario
from app.services.servicio_soporte import enviar_ticket_soporte

router = APIRouter(prefix="/soporte", tags=["Soporte"])

@router.post("/ticket")
async def crear_ticket(
    tipo: str = Form(...),
    mensaje: str = Form(...),
    imagen: UploadFile | None = File(None),
    usuario=Depends(obtener_usuario)
):
    try:
        await enviar_ticket_soporte(
            nombre_usuario=usuario["usu_nombre"],
            correo_usuario=usuario["usu_correo"],   
            tipo=tipo,
            mensaje=mensaje,
            imagen=imagen
        )
        return {"status": "success", "message": "Ticket enviado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando ticket: {e}")
