

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import date



class Libro(SQLModel, table=True):
    __tablename__ = "libro"
    lib_id: Optional[int] = Field(default=None, primary_key=True)
    lib_titulo: str = Field(max_length=150)
    lib_descripcion: Optional[str]
    lib_fecha: date = Field(default_factory=date.today)
    lib_precio: Optional[int]
    lib_url: Optional[str] = Field(default=None, max_length=255)
    lib_ideditorial: Optional[int] = Field(default=None, foreign_key="editorial.edi_id")
    lib_estado: bool
    lib_portada: Optional[str] = Field(default=None, max_length=100)
    lib_idautor: Optional[int] = Field(default=None, foreign_key="autor.aut_id")
    lib_idcategoria: Optional[int] = Field(default=None, foreign_key="categoria.cat_id")

    editorial: Optional["Editorial"] = Relationship(back_populates="libro") # type: ignore
    categoria: Optional["Categoria"] = Relationship(back_populates="libro") # type: ignore
    autor: Optional["Autor"] = Relationship(back_populates="libro") # type: ignore
    texto: list["Texto"] = Relationship(back_populates="libro") # type: ignore
    progreso: list["ProgresoLectura"] = Relationship(back_populates="libro") # type: ignore
    
    


class LibroCreate(SQLModel):
    lib_titulo: str
    lib_descripcion: Optional[str] = None
    lib_fecha: Optional[date] = None
    lib_precio: int
    lib_url: Optional[str] = None
    lib_ideditorial: Optional[int] = None
    lib_estado: bool
    lib_portada: Optional[str] = None

    model_config = {"from_attributes": True}


class LibroUpdate(SQLModel):
    lib_titulo: Optional[str] = None
    lib_descripcion: Optional[str] = None
    lib_fecha: Optional[date] = None
    lib_precio: Optional[int] = None
    lib_url: Optional[str] = None
    lib_ideditorial: Optional[int] = None
    lib_estado: Optional[bool] = None
    lib_portada: Optional[str] = None

    model_config = {"from_attributes": True}



class LibroResponse(SQLModel):
    lib_id: int
    lib_titulo: str
    lib_descripcion: Optional[str] = None
    lib_fecha: date
    lib_precio: Optional[int] = None
    lib_url: str
    lib_ideditorial: Optional[int] = None
    lib_estado: bool
    lib_portada: Optional[str] = None

    model_config = {"from_attributes": True}
