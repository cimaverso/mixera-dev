# app/routes/progreso.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.servicio_progreso import ProgresoLecturaService
from app.database.database import get_session
from app.models.progreso.modelo_progreso import ProgresoLecturaCreate, ProgresoLecturaResponse
from app.core.auth_core import obtener_usuario  # Tu dependencia de usuario

router = APIRouter(prefix="/progresos", tags=["Progresos"])



@router.get("/usuario/{id}", response_model=ProgresoLecturaResponse)
def obtener_progreso_libro_usuario(
    id: int,
    db: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):
    usuario_id = usuario["usu_id"]
    servicio = ProgresoLecturaService(db)
    progreso = servicio.obtener_progreso(usuario_id, id)
    return progreso

@router.post("/usuario", response_model=ProgresoLecturaResponse)
def guardar_progreso(
    progreso_data: ProgresoLecturaCreate,
    db: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):

    servicio = ProgresoLecturaService(db)
    progreso = servicio.guardar_o_actualizar_progreso(usuario["usu_id"], progreso_data)
    return progreso
