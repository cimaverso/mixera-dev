from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from app.database.database import get_session
from app.models.texto.modelo_texto import TextoCreate, TextoUpdate, TextoResponse
from app.services.servicio_texto import TextoServicio
from app.core.auth_core import obtener_usuario


router = APIRouter(prefix="/textos", tags=["Textos"])

@router.get("/{id}", response_model=List[TextoResponse])
def listar_textos(id: int, db: Session = Depends(get_session)):
    servicio = TextoServicio(db)
    textos = servicio.listar_libro_id(id)
    return textos

@router.post("/", response_model=TextoResponse)
def crear_texto(
    texto_in: TextoCreate,
    db: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario)
):
    servicio = TextoServicio(db)
    texto_creado = servicio.crear_texto(texto_in, usuario["usu_id"])
    return texto_creado

@router.put("/{id}", response_model=TextoResponse)
def actualizar_texto(
    id: int,
    texto_in: TextoUpdate,
    db: Session = Depends(get_session)
):
    servicio = TextoServicio(db)
    texto = servicio.actualizar_texto(id, texto_in.dict(exclude_unset=True))
    if not texto:
        raise HTTPException(status_code=404, detail="Texto no encontrado")
    return texto

@router.delete("/{id}", response_model=dict)
def eliminar_texto(id: int, session: Session = Depends(get_session)):
    servicio = TextoServicio(session)
    exito = servicio.eliminar_texto(id)
    if not exito:
        raise HTTPException(status_code=404, detail="Texto no encontrado")
    return {"ok": True}
