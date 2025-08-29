from sqlmodel import Session, select
from sqlalchemy import or_
from fastapi import BackgroundTasks, HTTPException, status, UploadFile
from passlib.context import CryptContext
from jose import jwt, JWTError
import os
import uuid
from PIL import Image
from pathlib import Path
from app.models.usuario.modelo_usuario import Usuario, UsuarioCreate, UsuarioUpdate
from app.core.auth_core import generar_token_activacion
from app.services.servicio_correo import enviar_correo
from app.models.libro.modelo_libro import Libro
from app.models.compra.modelo_compra import Compra
from app.models.progreso.modelo_progreso import ProgresoLectura

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

class ServicioUsuario:
    
    def __init__(self):

        self.upload_directory = Path("uploads/profile-images")
        self.upload_directory.mkdir(parents=True, exist_ok=True)

    def registrar_usuario(self, datos: UsuarioCreate, db: Session, background_tasks: BackgroundTasks) -> Usuario:
        # Verificar si el correo o usuario ya existe
        usuario_duplicado = db.exec(
            select(Usuario).where(
                or_(
                    Usuario.usu_correo == datos.usu_correo,
                    Usuario.usu_usuario == datos.usu_usuario
                )
            )
        ).first()

        if usuario_duplicado:
            if usuario_duplicado.usu_correo == datos.usu_correo:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un correo registrado")
            if usuario_duplicado.usu_usuario == datos.usu_usuario:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario con ese nombre")


        # Crear usuario
        usuario = Usuario(
            usu_usuario=datos.usu_usuario,
            usu_correo=datos.usu_correo,
            usu_clave=pwd_context.hash(datos.usu_clave),
            usu_verificado=False,
            usu_idrol=2
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        # Generar token de activación
        token = generar_token_activacion(usuario.usu_id)
        enlace = f"https://api.mixera.org/usuarios/verificar?token={token}"

        # Enviar correo en segundo plano
        background_tasks.add_task(enviar_correo, usuario.usu_correo, enlace, tipo="activacion")

        return usuario

    def activar_usuario(self, token: str, db: Session) -> dict:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            usu_id = payload.get("sub")
            if not usu_id:
                raise ValueError("Token inválido: falta el sub")
        except JWTError:
            raise ValueError("Token inválido o expirado")

        usuario = db.exec(select(Usuario).where(Usuario.usu_id == int(usu_id))).first()
        if not usuario:
            raise ValueError("Usuario no encontrado")

        if usuario.usu_verificado:
            return {"mensaje": "La cuenta ya está verificada"}

        usuario.usu_verificado = True
        db.add(usuario)
        db.commit()

        return {"mensaje": "Cuenta activada correctamente"}

    async def enviar_solicitud(self, usu_correo: str, db: Session) -> dict:
        usuario = db.exec(select(Usuario).where(Usuario.usu_correo == usu_correo)).first()
        if not usuario:
            raise ValueError("Usuario no encontrado")

        token = jwt.encode(
            {"sub": str(usuario.usu_id), "tipo": "recuperacion"},
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        enlace = f"http://localhost:5173/restablecer?token={token}"
        await enviar_correo(usuario.usu_correo, enlace, tipo="recuperacion")

        return {"mensaje": "Correo de recuperación enviado"}

    def actualizar_clave(self, token: str, nueva_clave: str, db: Session) -> dict:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            usu_id = payload.get("sub")
            tipo = payload.get("tipo")
            if not usu_id or tipo != "recuperacion":
                raise ValueError("Token inválido o no autorizado")
        except JWTError:
            raise ValueError("Token inválido o expirado")

        usuario = db.exec(select(Usuario).where(Usuario.usu_id == int(usu_id))).first()
        if not usuario:
            raise ValueError("Usuario no encontrado")

        usuario.usu_clave = pwd_context.hash(nueva_clave)
        db.add(usuario)
        db.commit()

        return {"mensaje": "Contraseña actualizada correctamente"}

    def actualizar_clave_usuario_autenticado(self, usu_id: int, clave_actual: str, nueva_clave: str, db: Session) -> dict:
        usuario = db.exec(select(Usuario).where(Usuario.usu_id == usu_id)).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # 1) verificar contraseña actual
        if not pwd_context.verify(clave_actual, usuario.usu_clave):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

        # 2) reglas mínimas (opcional)
        if len(nueva_clave) < 8:
            raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
        if pwd_context.verify(nueva_clave, usuario.usu_clave):
            raise HTTPException(status_code=400, detail="La nueva contraseña no puede ser igual a la anterior")

        # 3) actualizar
        usuario.usu_clave = pwd_context.hash(nueva_clave)
        db.add(usuario)
        db.commit()

        return {"mensaje": "Contraseña actualizada correctamente"}

    def listar_perfil_usuario(self, usu_id: int, db: Session) -> Usuario:
        usuario = db.exec(select(Usuario).where(Usuario.usu_id == usu_id)).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return usuario

    def actualizar_perfil_usuario(self, usu_id: int, datos: UsuarioUpdate, db: Session) -> Usuario:
        usuario = db.exec(select(Usuario).where(Usuario.usu_id == usu_id)).first()
        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        for campo, valor in datos.dict(exclude_unset=True).items():
            setattr(usuario, campo, valor)

        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        return usuario
    
    async def subir_imagen_perfil(self, file: UploadFile, usuario_id: int, db: Session) -> dict:
        """Sube imagen de perfil y actualiza en BD."""
        # Extensiones y tamaño máximo (5MB)
        allowed_exts = {"jpg", "jpeg", "png", "gif", "webp"}
        max_size = 5 * 1024 * 1024


        ext = file.filename.lower().split('.')[-1]
        if ext not in allowed_exts:
            raise HTTPException(400, "Formato no permitido. JPG, JPEG, PNG, GIF o WEBP")


        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(400, "Archivo demasiado grande. Máx 5MB")

        # Eliminar imagen anterior
        for path in self.upload_directory.glob(f"user_{usuario_id}_*"):
            if path.is_file():
                path.unlink()

        # Guardar nueva imagen
        filename = f"user_{usuario_id}_{uuid.uuid4()}.{ext}"
        file_path = self.upload_directory / filename
        with open(file_path, "wb") as f:
            f.write(contents)

        # Optimizar con Pillow
        try:
            with Image.open(file_path) as img:
                if img.mode in ("RGBA", "LA", "P"):
                    img = img.convert("RGB")
                img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                img.save(file_path, optimize=True, quality=85)
        except Exception as e:
            print(f"Error optimizando imagen: {e}")

        # Actualizar BD
        url = f"/uploads/profile-images/{filename}"
        usuario = db.exec(select(Usuario).where(Usuario.usu_id == usuario_id)).first()
        if usuario:
            usuario.usu_imagen = url
            db.add(usuario)
            db.commit()

        return {
            "message": "Imagen subida correctamente",
            "url": url
        }
    
    def libros_adquiridos_con_progreso(self, usuario_id: int, db: Session):
        compras_query = (
            select(Compra, Libro)
            .join(Libro, Compra.com_idlibro == Libro.lib_id)
            .where(Compra.com_idusuario == usuario_id)
            .where(Compra.com_estado == "approved")
        )
        resultados = db.exec(compras_query).all()

        libros = []
        for compra, libro in resultados:
            prog_query = (
                select(ProgresoLectura)
                .where(ProgresoLectura.pro_idusuario == usuario_id)
                .where(ProgresoLectura.pro_idlibro == libro.lib_id)
            )
            progreso = db.exec(prog_query).first()
            porcentaje = None
            if progreso and progreso.pro_pagina_total:
                porcentaje = round(100 * progreso.pro_pagina_actual / progreso.pro_pagina_total)

            libros.append({
                "titulo": libro.lib_titulo,
                "fecha": compra.com_fecha.strftime('%d/%m/%Y') if compra.com_fecha else None,
                "progreso": f"{porcentaje}%" if porcentaje is not None else "0%",
            })
        return libros
