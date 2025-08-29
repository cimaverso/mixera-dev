from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Compra(SQLModel, table=True):
    com_id: Optional[int] = Field(default=None, primary_key=True)
    com_idusuario: Optional[int] = Field(default=None, foreign_key="usuario.usu_id")
    com_idlibro: Optional[int] = Field(default=None, foreign_key="libro.lib_id")
    com_fecha: datetime = Field(default_factory=datetime.utcnow)
    com_estado: Optional[str] = Field(default="pendiente")
    com_referencia: Optional[str] = Field(default=None, index=True)  