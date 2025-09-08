from sqlmodel import SQLModel, Field
from typing import Optional


class Categoria(SQLModel, table=True):
    __tablename__ = "categoria"
    cat_id: Optional[int] = Field(default=None, primary_key=True)
    cat_nombre: str = Field(max_length=50, unique=True)
    cat_descripcion: Optional[str]

    #libro: Optional["Libro"] = Relationship(back_populates="categoria")


class CategoriaCreate(SQLModel):
    cat_nombre: str
    cat_descripcion: Optional[str] = None

    model_config = {"from_attributes": True}

class CategoriaUpdate(SQLModel):
    cat_nombre: Optional[str] = None
    cat_descripcion: Optional[str] = None

    model_config = {"from_attributes": True}

class CategoriaResponse(SQLModel):
    cat_id: int
    cat_nombre: str
    cat_descripcion: Optional[str] = None

    model_config = {"from_attributes": True}
