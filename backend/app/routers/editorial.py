from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.database.database import get_session
from app.models.libro.modelo_editorial import Editorial, EditorialCreate, EditorialUpdate
from app.services.servicio_editorial import EditorialService

router = APIRouter(prefix="/editoriales", tags=["Editoriales"])


@router.get("/", response_model=List[Editorial])
def listar_editoriales(session: Session = Depends(get_session)):
    return EditorialService(session).listar_editoriales()

@router.post("/", response_model=Editorial, status_code=201)
def crear_editorial(data: EditorialCreate, session: Session = Depends(get_session)):
    return EditorialService(session).crear_editorial(data)

@router.put("/{id}", response_model=Editorial)
def actualizar_editorial(id: int, data: EditorialUpdate, session: Session = Depends(get_session)):
    return EditorialService(session).actualizar_editorial(id, data)
