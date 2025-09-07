from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_session
from app.services.servicio_administrador import AdministradorServicio
from app.models.usuario.modelo_usuario import UsuarioResponse



router = APIRouter(
    prefix="/administradores",
    tags=["Administradores"],
    
)

@router.get("/usuarios", response_model=List[UsuarioResponse])
def obtener_usuarios(session: Session = Depends(get_session)):
    servicio_administrador = AdministradorServicio(session)
    usuarios = servicio_administrador.listar_usuaios()
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