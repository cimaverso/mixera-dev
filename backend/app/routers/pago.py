
#app/routes/pago.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.servicio_pago import crear_preferencia_pago
from app.core.auth_core import obtener_usuario
from app.services.servicio_libro import LibroServicio
from app.database.database import get_session
from app.services.servicio_compra import CompraServicio

router = APIRouter(prefix="/pago", tags=["Pago"])
@router.get("/{libro}")
def generar_enlace_pago(libro: int, session: Session = Depends(get_session), usuario: dict = Depends(obtener_usuario)):
    
    compra_service = CompraServicio(session)
    libro = LibroServicio(session).listar_libro_id(libro, usuario["usu_id"])
    if not libro:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    try:
        # Crear preferencia de pago con los datos del libro
        link, reference = crear_preferencia_pago(
            libro["titulo"], libro["precio"], usuario["usu_id"], libro["id"]
        )
        compra_service.guardar_compra(usuario['usu_id'], libro["id"], reference)

        return {"link_pago": link}
    
    except Exception as e:
        return {"error": str(e)}
