from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Texto(SQLModel, table=True):
    txt_id: Optional[int] = Field(default=None, primary_key=True)
    txt_idlibro: int = Field(foreign_key="libro.lib_id", nullable=False, index=True)
    txt_idusuario: int = Field(foreign_key="usuario.usu_id", nullable=False, index=True)
    txt_pagina: int = Field(nullable=False, ge=1)
    txt_x: float = Field(nullable=False, ge=0.0, le=1.0)
    txt_y: float = Field(nullable=False, ge=0.0, le=1.0)
    txt_texto: str = Field(nullable=False, min_length=1)
    txt_ancho: int = Field(default=200, ge=1)
    txt_alto: int = Field(default=60, ge=1)
    txt_dimension: int = Field(default=14, ge=1)
    txt_creado: Optional[datetime] = Field(default_factory=datetime.utcnow)
    txt_actualizado: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relaciones opcionales (si tienes modelos Libro/Usuario)
    libro: Optional["Libro"] = Relationship(back_populates="texto")
    usuarios: Optional["Usuario"] = Relationship(back_populates="texto")



class TextoCreate(SQLModel):
    txt_idlibro: int
    txt_pagina: int
    txt_x: float
    txt_y: float
    txt_texto: str
    txt_ancho: Optional[int] = 200
    txt_alto: Optional[int] = 60
    txt_dimension: Optional[int] = 14

    model_config = {"from_attributes": True}

class TextoUpdate(SQLModel):
    txt_pagina: Optional[int] = None
    txt_x: Optional[float] = None
    txt_y: Optional[float] = None
    txt_texto: Optional[str] = None
    txt_ancho: Optional[int] = None
    txt_alto: Optional[int] = None
    txt_dimension: Optional[int] = None
    txt_actualizado: Optional[datetime] = Field(default_factory=datetime.utcnow)

    model_config = {"from_attributes": True}

class TextoResponse(SQLModel):
    txt_id: int
    txt_idlibro: int
    txt_idusuario: int
    txt_pagina: int
    txt_x: float
    txt_y: float
    txt_texto: str
    txt_ancho: int
    txt_alto: int
    txt_dimension: int
    txt_creado: datetime
    txt_actualizado: datetime

    model_config = {"from_attributes": True}


class TextoSimpleResponse(SQLModel):
    txt_id: int
    txt_pagina: int
    txt_texto: str
    

    model_config = {"from_attributes": True}