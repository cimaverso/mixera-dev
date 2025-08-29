from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List

class Editorial(SQLModel, table=True):
    __tablename__ = "editorial"
    edi_id: Optional[int] = Field(default=None, primary_key=True)
    edi_nombre: str = Field(max_length=100)
    edi_biografia: Optional[str]

    libro: Optional["Libro"] = Relationship(back_populates="editorial")

class EditorialCreate(SQLModel):
    edi_nombre: str
    edi_biografia: Optional[str] = None

    model_config = {"from_attributes": True}


class EditorialUpdate(SQLModel):
    edi_nombre: Optional[str] = None
    edi_biografia: Optional[str] = None

    model_config = {"from_attributes": True}


class EditorialResponse(SQLModel):
    edi_id: int
    edi_nombre: str
    edi_biografia: Optional[str] = None

    model_config = {"from_attributes": True}

