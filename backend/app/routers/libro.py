# routers/libro_router.py
from fastapi import APIRouter, UploadFile, File, Depends, Form, Request, HTTPException
from sqlalchemy.orm import Session
from app.services.servicio_libro import LibroServicio
from app.models.libro.modelo_libro import LibroCreate, LibroUpdate
from app.database.database import get_session
from app.core.auth_core import obtener_usuario
from datetime import date
from app.utils.url_ultils import obtener_base_url
from typing import Optional

router = APIRouter(prefix="/libros", tags=["Libros"])

class LibroCreateForm:
    def __init__(
        self,
        lib_titulo: str = Form(...),
        lib_descripcion: str = Form(...),
        lib_precio: float = Form(...),
        lib_ideditorial: int = Form(...),
        lib_idautor: int = Form(...),         
        lib_idcategoria: int = Form(...),  
        lib_estado: bool = Form(...),
        
    ):
        self.lib_titulo = lib_titulo
        self.lib_descripcion = lib_descripcion
        self.lib_fecha = date.today()
        self.lib_precio = lib_precio
        self.lib_ideditorial = lib_ideditorial
        self.lib_idautor = lib_idautor        
        self.lib_idcategoria = lib_idcategoria
        self.lib_estado = lib_estado

class LibroUpdateForm:
    def __init__(
        self,
        lib_titulo: Optional[str] = Form(None),
        lib_descripcion: Optional[str] = Form(None),
        lib_precio: Optional[int] = Form(None),
        lib_ideditorial: Optional[int] = Form(None),
        lib_idautor: Optional[int] = Form(None),
        lib_idcategoria: Optional[int] = Form(None),
        lib_estado: Optional[bool] = Form(None),
    ):
        self.lib_titulo = lib_titulo
        self.lib_descripcion = lib_descripcion
        self.lib_precio = lib_precio
        self.lib_ideditorial = lib_ideditorial
        self.lib_idautor = lib_idautor
        self.lib_idcategoria = lib_idcategoria
        self.lib_estado = lib_estado


@router.get("/usuario")
def obtener_libros_comprados(request: Request, session: Session = Depends(get_session),usuario: dict = Depends(obtener_usuario)
):
    base_url = obtener_base_url(request)
    servicio = LibroServicio(session)
    return servicio.listar_libros_comprados(usuario["usu_id"], base_url)


@router.get("/{id}")
def obtener_libro(id: int, request: Request, session: Session = Depends(get_session), usuario: dict = Depends(obtener_usuario)
):
    base_url = obtener_base_url(request)
    servicio_libro = LibroServicio(session).listar_libro_id(id, usuario["usu_id"], base_url)
    if not servicio_libro:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    return servicio_libro


@router.get("/")
def obtener_libros(request: Request, session: Session = Depends(get_session), q: str = ""):
    base_url = obtener_base_url(request)
    servicio = LibroServicio(session)
    libros = servicio.listar_libros(q=q)
    return [servicio.serializar_libros(libro, base_url) for libro in libros]


@router.post("/")
async def crear_libro(data: LibroCreateForm = Depends(), session: Session = Depends(get_session), file: UploadFile = File(...), portada: UploadFile = File(...)
):
    libro_data = LibroCreate(**data.__dict__)
    libro = LibroServicio(session).crear_libro(file, portada, libro_data)
    return libro


@router.put("/{id}")
async def actualizar_libro(id: int, data: LibroUpdateForm = Depends(), session: Session = Depends(get_session), file: Optional[UploadFile] = File(None), portada: Optional[UploadFile] = File(None)
):
    libro_data = LibroUpdate(**data.__dict__)
    servicio = LibroServicio(session)
    return servicio.actualizar_libro(id, libro_data, file, portada)
