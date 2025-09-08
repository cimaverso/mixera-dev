from sqlmodel import SQLModel, Field
from typing import Optional


class Rol(SQLModel, table=True):
    __tablename__ = "rol"
    rol_id: Optional[int] = Field(default=None, primary_key=True)
    rol_nombre: str = Field(max_length=20)

    #usuarios: List["Usuario"] = Relationship(back_populates="rol")


