from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_session
from app.services.servicio_administrador import AdministradorServicio



router = APIRouter(
    prefix="/administracion",
    tags=["Administración"],
    
)


@router.get("/dashboard")
def dashboard(session: Session = Depends(get_session)):
    servicio = AdministradorServicio(session)
    return servicio.listar_dashboard()

@router.get("/usuarios")
def obtener_usuarios(session: Session = Depends(get_session),
    busqueda: str = Query(None, description="Buscar por nombre, email o usuario"),
    estado: str = Query("todos", description="Filtrar por estado"),
    fechaDesde: str = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    fechaHasta: str = Query(None, description="Fecha final (YYYY-MM-DD)")
):
    servicio_administrador = AdministradorServicio(session)
    usuarios = servicio_administrador.listar_usuarios(
        busqueda=busqueda,
        estado=estado,
        fechaDesde=fechaDesde,
        fechaHasta=fechaHasta
    )
    if not usuarios:
        raise HTTPException(status_code=404, detail="No se encontraron usuarios")
    return usuarios


@router.get("/usuarios/{usu_id}/actividad", response_model=List[dict])
def obtener_actividad_usuario(usu_id: int, session: Session = Depends(get_session)):
    servicio = AdministradorServicio(session)
    libros = servicio.listar_actividad_usuario(usu_id)
    if not libros:
        raise HTTPException(status_code=404, detail="No se encontraron libros ni progreso para el usuario")
    return libros

@router.get("/usuarios/{usu_id}/historial", response_model=List[dict])
def obtener_historial_usuario(usu_id: int, session: Session = Depends(get_session)):
    servicio = AdministradorServicio(session)
    historial = servicio.listar_historial_usuario(usu_id)
    if not historial:
        raise HTTPException(status_code=404, detail="No se encontraron compras para el usuario")
    return historial


