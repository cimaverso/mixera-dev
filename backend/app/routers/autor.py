from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List

from app.models.libro.modelo_autor import Autor, AutorCreate, AutorUpdate
from app.database.database import get_session
from app.services.servicio_autor import AutorServicio

router = APIRouter(prefix="/autores", tags=["Autores"])


@router.get("/", response_model=List[Autor])
def listar_autores(session: Session = Depends(get_session)):
    return AutorServicio(session).listar_autores()

@router.post("/", response_model=Autor, status_code=201)
def crear_autor(data: AutorCreate, session: Session = Depends(get_session)):
    return AutorServicio(session).crear_autor(data)

@router.put("/{id}", response_model=Autor)
def actualizar_autor(id: int, data: AutorUpdate, session: Session = Depends(get_session)):
    autor = AutorServicio(session).actualizar_autor(id, data)
    if not autor:
        raise HTTPException(status_code=404, detail="Autor no encontrado")
    return autor
