
from sqlmodel import SQLModel, Field
from typing import Optional


class Autor(SQLModel, table=True):
    __tablename__ = "autor"
    aut_id: Optional[int] = Field(default=None, primary_key=True)
    aut_nombre: str = Field(max_length=100)
    aut_biografia: Optional[str]


    #libro: Optional["Libro"] = Relationship(back_populates="autor")


class AutorCreate(SQLModel):
    aut_nombre: str
    aut_biografia: Optional[str] = None
    
    model_config = {"from_attributes": True}


class AutorUpdate(SQLModel):
    aut_nombre: Optional[str] = None
    aut_biografia: Optional[str] = None
    
    model_config = {"from_attributes": True}


class AutorResponse(SQLModel):
    aut_id: int
    aut_nombre: str
    aut_biografia: Optional[str] = None

    model_config = {"from_attributes": True}
