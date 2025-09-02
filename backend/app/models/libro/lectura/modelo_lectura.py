from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class LecturaSesion(SQLModel, table=True):
    __tablename__ = "lectura_sesion"
    ls_id: Optional[int] = Field(default=None, primary_key=True)
    ls_idusuario: int = Field(foreign_key="usuario.usu_id")
    ls_idlibro: int = Field(foreign_key="libro.lib_id")
    ls_fecha_inicial: datetime
    ls_fecha_final: Optional[datetime] = None

    
    usuarios: Optional["Usuario"] = Relationship(back_populates="sesion")  # Relación con Usuario
    libro: Optional["Libro"] = Relationship(back_populates="sesion")    # Relación con Libro

    
    
class LecturaSesionCreate(SQLModel):

    ls_idlibro: int
    model_config = {"from_attributes": True}

    

class LecturaSesionUpdate(SQLModel):
    ls_fecha_final: Optional[datetime] = None
    model_config = {"from_attributes": True}

class LecturaSesionResponse(SQLModel):
    ls_id: int
    ls_idusuario: int
    ls_idlibro: int
    ls_fecha_inicial: datetime
    ls_fecha_final: Optional[datetime] = None


