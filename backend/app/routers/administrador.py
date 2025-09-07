from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_session
from app.services.servicio_administrador import AdministradorServicio
from app.models.usuario.modelo_usuario import UsuarioResponse
from app.models.libro.modelo_libro_actividad import LibroActividadResponse

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



@router.get("/usuario/{id}/actividad",response_model=List[LibroActividadResponse])
def obtener_actividad_usuario(id: int,session: Session = Depends(get_session)):
    servicio = AdministradorServicio(session)
    filas = servicio.listar_libros_con_progreso(id)
    if not filas:
        raise HTTPException(status_code=404, detail=f"Usuario {id} no tiene libros con progreso")
    # Cada fila es (Libro, ProgresoLectura)
    salida = [
        LibroActividadResponse(
            lib_id=lib.lib_id,
            lib_titulo=lib.lib_titulo,
            pro_pagina_actual=prog.pro_pagina_actual or 0,
            pro_pagina_total=prog.pro_pagina_total or 0,
        )
        for lib, prog in filas
    ]
    return salida


