# services/servicio_libros.py
import os
import uuid
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.models.libro.modelo_libro import Libro, LibroCreate, LibroUpdate
from app.models.compra.modelo_compra import Compra 
from app.models.libro.modelo_autor import Autor
from app.models.libro.modelo_categoria import Categoria
from app.models.libro.modelo_editorial import Editorial
from app.models.libro.progreso.modelo_progreso import ProgresoLectura


CARPETA_LIBROS = os.path.join("uploads", "books")
CARPETA_PORTADAS = os.path.join("uploads", "covers")
os.makedirs(CARPETA_LIBROS, exist_ok=True)
os.makedirs(CARPETA_PORTADAS, exist_ok=True)

MAX_FILE_SIZE = 200 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024

class LibroServicio:
    def __init__(self, session: Session):
        self.session = session

    def _guardar_archivo(self, file: UploadFile, carpeta: str, ext_permitida: tuple, max_size: int) -> str:
        if not file.filename.lower().endswith(ext_permitida):
            raise HTTPException(status_code=400, detail=f"Solo se permiten archivos {ext_permitida}")
        unique_name = f"{uuid.uuid4().hex}{os.path.splitext(file.filename)[1].lower()}"
        ruta_destino = os.path.join(carpeta, unique_name)

        total_size = 0
        with open(ruta_destino, "wb") as buffer:
            while True:
                chunk = file.file.read(CHUNK_SIZE)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > max_size:
                    buffer.close()
                    os.remove(ruta_destino)
                    raise HTTPException(status_code=400, detail=f"El archivo excede {max_size/(1024*1024)} MB.")
                buffer.write(chunk)
        return unique_name

    def crear_libro(self, file: UploadFile, portada: UploadFile, data: LibroCreate) -> Libro:
        # Guardar PDF
        pdf_name = self._guardar_archivo(file, CARPETA_LIBROS, (".pdf",), MAX_FILE_SIZE)
        # Guardar portada (opcional)
        portada_name = None
        if portada:
            portada_name = self._guardar_archivo(portada, CARPETA_PORTADAS, (".jpg", ".jpeg", ".png"), 5 * 1024 * 1024)  # máx 5MB portada

        libro = Libro.from_orm(data)
        libro.lib_url = pdf_name
        libro.lib_portada = portada_name
        self.session.add(libro)
        self.session.commit()
        self.session.refresh(libro)
        return libro
    
    def listar_libros(self, q: str = ""):
        query = self.session.query(Libro)
        if q:
            q_pattern = f"%{q}%"
            query = query.filter(
                (Libro.lib_titulo.ilike(q_pattern)) | (Libro.lib_descripcion.ilike(q_pattern))
            )
        return query.all()
    
    def serializar_libros(self, libro: Libro, base_url: str, progreso: ProgresoLectura = None):
        autor = self.session.query(Autor).filter(Autor.aut_id == libro.lib_idautor).first()
        categoria = self.session.query(Categoria).filter(Categoria.cat_id == libro.lib_idcategoria).first()
        editorial = self.session.query(Editorial).filter(Editorial.edi_id == libro.lib_ideditorial).first()
        return {
            "id": libro.lib_id,
            "titulo": libro.lib_titulo,
            "descripcion": libro.lib_descripcion,
            "autor": autor.aut_nombre if autor else None,
            "idautor": libro.lib_idautor,
            "categoria": categoria.cat_nombre if categoria else None,
            "idcategoria": libro.lib_idcategoria,
            "editorial": editorial.edi_nombre if editorial else None,
            "ideditorial": libro.lib_ideditorial,
            "precio": libro.lib_precio,
             "descuento": libro.lib_descuento,
            "portada": f"{base_url}/uploads/covers/{libro.lib_portada}" if libro.lib_portada else None,
            "url": f"{base_url}/uploads/books/{libro.lib_url}" if libro.lib_url else None,
            "progreso_pagina_actual": progreso.pro_pagina_actual if progreso else 0,
            "progreso_pagina_total": progreso.pro_pagina_total if progreso else getattr(libro, "lib_total_paginas", 0),
            "estado": libro.lib_estado,
        }

    def listar_libro_id(self, libro_id: int, user_id: int, base_url: str = ""):
        libro = (
            self.session.query(Libro)
            .filter(Libro.lib_id == libro_id)
            .first()
        )
        if not libro:
            return None

        autor = self.session.query(Autor).filter(Autor.aut_id == libro.lib_idautor).first()
        categoria = self.session.query(Categoria).filter(Categoria.cat_id == libro.lib_idcategoria).first()
        editorial = self.session.query(Editorial).filter(Editorial.edi_id == libro.lib_ideditorial).first()

        compra = (
            self.session.query(Compra)
            .filter(
                Compra.com_idusuario == user_id,
                Compra.com_idlibro == libro_id,
                Compra.com_estado == "approved"
            )
            .first()
        )

        progreso = None
        if compra:
            progreso = (
                self.session.query(ProgresoLectura)
                .filter(
                    ProgresoLectura.pro_idusuario == user_id,
                    ProgresoLectura.pro_idlibro == libro_id
                )
                .first()
            )


    
        return {
            "id": libro.lib_id,
            "titulo": libro.lib_titulo,
            "descripcion": libro.lib_descripcion,
            "fecha": str(libro.lib_fecha),
            "precio": libro.lib_precio,
            "descuento": libro.lib_descuento,
            "estado": libro.lib_estado,
            "portada": f"{base_url}/uploads/covers/{libro.lib_portada}" if libro.lib_portada else None,
            "url": f"{base_url}/uploads/books/{libro.lib_url}" if libro.lib_url else None,
            "autor": autor.aut_nombre if autor else None,
            "categoria": categoria.cat_nombre if categoria else None,
            "editorial": editorial.edi_nombre if editorial else None,
            "comprado": bool(compra),
            "progreso_pagina_actual": progreso.pro_pagina_actual if progreso else 0,
            "progreso_pagina_total": progreso.pro_pagina_total if progreso else libro.lib_total_paginas if hasattr(libro, 'lib_total_paginas') else 0,
        }

    def listar_libros_comprados(self, usuario_id: int, base_url: str):
        compras = self.session.query(Compra).filter(
            Compra.com_idusuario == usuario_id,
            Compra.com_estado == "approved"
        ).all()
        libro_ids = [c.com_idlibro for c in compras]
        if not libro_ids:
            return []

        libros = self.session.query(Libro).filter(Libro.lib_id.in_(libro_ids)).all()

        resultado = []
        for libro in libros:
            progreso = (
                self.session.query(ProgresoLectura)
                .filter(
                    ProgresoLectura.pro_idusuario == usuario_id,
                    ProgresoLectura.pro_idlibro == libro.lib_id
                )
                .first()
            )
            data = self.serializar_libros(libro, base_url, progreso)
            resultado.append(data)

        return resultado
    
    def actualizar_libro(self, libro_id: int, data: "LibroUpdate", file: UploadFile = None, portada: UploadFile = None) -> Libro:
        libro = self.session.query(Libro).filter(Libro.lib_id == libro_id).first()
        if not libro:
            raise HTTPException(status_code=404, detail="Libro no encontrado")

        # Validar si se manda un autor nuevo
        if data.lib_idautor is not None:
            autor = self.session.query(Autor).filter(Autor.aut_id == data.lib_idautor).first()
            if not autor:
                raise HTTPException(status_code=400, detail="El autor no existe")

        # Validar si se manda una categoría nueva
        if data.lib_idcategoria is not None:
            categoria = self.session.query(Categoria).filter(Categoria.cat_id == data.lib_idcategoria).first()
            if not categoria:
                raise HTTPException(status_code=400, detail="La categoría no existe")

        # Validar si se manda una editorial nueva
        if data.lib_ideditorial is not None:
            editorial = self.session.query(Editorial).filter(Editorial.edi_id == data.lib_ideditorial).first()
            if not editorial:
                raise HTTPException(status_code=400, detail="La editorial no existe")

        # Actualizar PDF si se envía
        if file:
            pdf_name = self._guardar_archivo(file, CARPETA_LIBROS, (".pdf",), MAX_FILE_SIZE)
            libro.lib_url = pdf_name

        # Actualizar portada si se envía
        if portada:
            portada_name = self._guardar_archivo(portada, CARPETA_PORTADAS, (".jpg", ".jpeg", ".png"), 5 * 1024 * 1024)
            libro.lib_portada = portada_name

        # Actualizar solo los campos enviados
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(libro, key, value)


        self.session.commit()
        self.session.refresh(libro)
        return libro


    

