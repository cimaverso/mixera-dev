# app/routers/estadisticas.py
from fastapi import APIRouter
from app.services.servicio_estadisticas import listar_estadisticas

router = APIRouter(prefix="/estadisticas", tags=["Estadisticas"])

@router.get("/")
def obtener_estadisticas():
    """Dashboard principal"""
    return listar_estadisticas()
