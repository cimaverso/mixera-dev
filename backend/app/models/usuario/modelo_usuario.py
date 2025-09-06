from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import date



class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"
    usu_id: Optional[int] = Field(default=None, primary_key=True)
    usu_usuario: str = Field(max_length=50)
    usu_correo: str = Field(max_length=100, unique=True)
    usu_clave: str
    usu_verificado: bool = Field(default=False)
    usu_fecharegistro: date = Field(default_factory=date.today)
    usu_idrol: Optional[int] = Field(default=None, foreign_key="rol.rol_id")
    usu_nombre: Optional[str] = Field(max_length=30)
    usu_apellido: str = Field(max_length=30)
    usu_ciudad: Optional[str] = Field(max_length=30)
    usu_pais: Optional[str] = Field(max_length=30)
    usu_imagen: Optional[str] = Field(default=None, max_length=100)

    rol: Optional["Rol"] = Relationship(back_populates="usuarios")
    texto: list["Texto"] = Relationship(back_populates="usuarios")
    progreso: list["ProgresoLectura"] = Relationship(back_populates="usuarios")  # type: ignore
    sesion: list["LecturaSesion"] = Relationship(back_populates="usuarios")  # type: ignore


class UsuarioCreate(SQLModel):
    usu_usuario: str
    usu_correo: str
    usu_clave: str

    model_config = {"from_attributes": True}


class UsuarioUpdate(SQLModel):
    usu_usuario: Optional[str] = None
    usu_clave: Optional[str] = None
    usu_nombre: Optional[str] = None
    usu_apellido: Optional[str] = None
    usu_ciudad: Optional[str] = None
    usu_pais: Optional[str] = None
    usu_imagen: Optional[str] = None

    model_config = {"from_attributes": True}


class UsuarioResponse(SQLModel):
    usu_id: int
    usu_usuario: str
    usu_nombre: Optional[str]
    usu_apellido: Optional[str]
    usu_ciudad: Optional[str]
    usu_pais: Optional[str]
    usu_correo: str
    usu_verificado: bool
    usu_fecharegistro: date
    usu_idrol: Optional[int]

    model_config = {"from_attributes": True}
    

class UsuarioPerfilResponse(SQLModel):
    usu_nombre: Optional[str]
    usu_apellido: Optional[str]
    usu_usuario: str
    usu_ciudad: Optional[str]
    usu_pais: Optional[str]
    usu_imagen: Optional[str]

    model_config = {"from_attributes": True}