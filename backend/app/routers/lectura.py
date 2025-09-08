from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_session
from app.core.auth_core import obtener_usuario
from app.models.libro.lectura.modelo_lectura import LecturaSesionCreate, LecturaSesionResponse
from app.services.servicio_lectura import LecturaSesionServicio

router = APIRouter(prefix="/lecturas", tags=["Lecturas"])

@router.get("/tiempo/{id}", response_model=dict)
def tiempo_total_libro(
    id: int,
    session: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):
    servicio = LecturaSesionServicio(session)
    minutos = servicio.tiempo_total_libro(usuario["usu_id"], id)
    return {"minutos": minutos, "horas": round(minutos/60, 2)}

@router.get("/intermitencia/{id}", response_model=dict)
def intermitencia_libro(
    id: int,
    session: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):
    servicio = LecturaSesionServicio(session)
    dias = servicio.intermitencia_libro(usuario["usu_id"], id)
    return {"dias": dias}

@router.post("/iniciar", response_model=LecturaSesionResponse)
def iniciar_sesion_lectura(
    data: LecturaSesionCreate,
    session: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):
    servicio = LecturaSesionServicio(session)
    try:
        nueva_sesion = servicio.iniciar_sesion(usuario_id=usuario["usu_id"], libro_id=data.ls_idlibro)
        return nueva_sesion
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/finalizar/{id}", response_model=LecturaSesionResponse)
def finalizar_sesion_lectura(
    id: int,
    session: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):
    servicio = LecturaSesionServicio(session)
    try:
        sesion = servicio.finalizar_sesion(id, usuario["usu_id"])
        return sesion
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


