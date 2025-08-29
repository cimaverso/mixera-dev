from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from app.core.auth_core import usuario_autenticado, crear_tokens, refrescar_token
from app.database.database import get_session
from fastapi import HTTPException
from fastapi import Body


router = APIRouter(prefix="/autenticacion", tags=["Autenticación"])

@router.post("/ingresar")
def iniciar_sesion(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session)
):
    usuario = usuario_autenticado(form_data.username, form_data.password, db)
    return crear_tokens(usuario.usu_usuario, usuario.usu_id, usuario.rol.rol_nombre)


@router.post("/refrescar")
def refresh_token(refresh_token: str = Body(..., embed=True)):
    try:
        nuevos_tokens = refrescar_token(refresh_token)
        return nuevos_tokens
    except HTTPException as e:
        raise e
