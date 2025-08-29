from sqlmodel import SQLModel, Field
from typing import Optional

class TipoAnotacion(SQLModel, table=True):
    tano_id: Optional[int] = Field(default=None, primary_key=True)
    tano_nombre: Optional[str] = Field(default=None, max_length=30)