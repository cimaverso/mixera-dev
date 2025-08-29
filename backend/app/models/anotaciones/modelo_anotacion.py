from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Anotacion(SQLModel, table=True):
    ano_id: Optional[int] = Field(default=None, primary_key=True)
    ano_idusuario: Optional[int] = Field(default=None, foreign_key="usuario.usu_id")
    ano_idlibro: Optional[int] = Field(default=None, foreign_key="libro.lib_id")
    ano_idtipo: Optional[int] = Field(default=None, foreign_key="tipo_anotacion.tano_id")
    ano_pagina: Optional[int] = None
    ano_contenido: Optional[str] = None
    ano_fecha: datetime = Field(default_factory=datetime.utcnow)


    