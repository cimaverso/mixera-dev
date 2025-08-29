from fastapi import APIRouter, Depends, HTTPException, Query, Body, status, BackgroundTasks, UploadFile, File
from sqlmodel import Session
from jose import JWTError
from pydantic import BaseModel
from app.models.usuario.modelo_usuario import UsuarioCreate, UsuarioResponse, UsuarioPerfilResponse, UsuarioUpdate
from app.database.database import get_session
from fastapi.responses import RedirectResponse
from app.core.auth_core import obtener_usuario
from app.services.servicio_usuario import ServicioUsuario


servicio_usuario = ServicioUsuario()


router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

class RestablecerClave(BaseModel):
    token: str
    nueva_clave: str

class CambioClave(BaseModel):
    actual: str
    nueva: str


@router.get("/libros")
def obtener_libros_adquiridos(
    db: Session = Depends(get_session),
    usuario: dict = Depends(obtener_usuario),
):
    service = ServicioUsuario()
    return service.libros_adquiridos_con_progreso(usuario["usu_id"], db)

@router.get("/verificar")
def verificar_usuario(token: str = Query(...), db: Session = Depends(get_session)):
    try:
        servicio_usuario.activar_usuario(token, db)
        return RedirectResponse("https://dev.mixera.org/verificacion?status=ok",
                                status_code=status.HTTP_303_SEE_OTHER)
    except (ValueError, JWTError):
        return RedirectResponse("https://dev.mixera.org/verificacion?status=error",
                                status_code=status.HTTP_303_SEE_OTHER)
    
@router.get("/perfil", response_model=UsuarioPerfilResponse)
def obtener_perfil(db: Session = Depends(get_session), usuario: dict = Depends(obtener_usuario)):
    try:
        return servicio_usuario.listar_perfil_usuario(usuario["usu_id"], db)
    except ValueError as es:
        raise HTTPException(status_code=404, detail=str(es))
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener el perfil de usuario")

@router.post("/imagen")
async def cargar_imagen(file: UploadFile = File(...), usuario = Depends(obtener_usuario), db: Session = Depends(get_session)):
    try:
        return await servicio_usuario.subir_imagen_perfil(file, usuario["usu_id"], db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Error al subir la imagen")

@router.post("/recuperar", response_model=dict)
async def solicitar_recuperacion(usu_correo: str = Body(..., embed=True), db: Session = Depends(get_session)):
    try:
        return await servicio_usuario.enviar_solicitud(usu_correo, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Error al enviar el correo de recuperación")

@router.post("/registrar", response_model=UsuarioResponse)
def registrar(usuario: UsuarioCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    try:
        return servicio_usuario.registrar_usuario(usuario, db, background_tasks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/restablecer", response_model=dict)
def restablecer_clave(datos: RestablecerClave, db: Session = Depends(get_session)):
    try:
        return servicio_usuario.actualizar_clave(datos.token, datos.nueva_clave, db)
    except (ValueError, JWTError):
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo restablecer la contraseña")
    
@router.put("/clave", response_model=dict)
def actualizar_clave(datos: CambioClave, usuario = Depends(obtener_usuario), db: Session = Depends(get_session)):
    try:
        return servicio_usuario.actualizar_clave_usuario_autenticado(usuario["usu_id"], datos.actual, datos.nueva, db)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo cambiar la contraseña")

@router.put("/perfil", response_model=UsuarioResponse)
def actualizar_perfil(datos: UsuarioUpdate, db: Session = Depends(get_session), usuario=Depends(obtener_usuario)):
    try:
        return servicio_usuario.actualizar_perfil_usuario(usuario["usu_id"], datos, db)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el perfil")
    