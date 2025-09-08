from sqlmodel import SQLModel, Field
from typing import Optional


class ProgresoLectura(SQLModel, table=True):
    __tablename__ = "progreso_lectura"
    pro_id: Optional[int] = Field(default=None, primary_key=True)
    pro_idusuario: Optional[int] = Field(default=None, foreign_key="usuario.usu_id")
    pro_idlibro: Optional[int] = Field(default=None, foreign_key="libro.lib_id")
    pro_pagina_actual: Optional[int] = None
    pro_pagina_total: Optional[int] = None


    # usuarios: Optional["Usuario"] = Relationship(back_populates="progreso")  # Relación con Usuario
    # libro: Optional["Libro"] = Relationship(back_populates="progreso")    # Relación con Libro



class ProgresoLecturaCreate(SQLModel):
    pro_idlibro: int
    pro_pagina_actual: Optional[int] = None
    pro_pagina_total: Optional[int] = None

    model_config = {"from_attributes": True}

class ProgresoLecturaUpdate(SQLModel):
    pro_pagina_actual: Optional[int] = None
    
    model_config = {"from_attributes": True}


class ProgresoLecturaResponse(SQLModel):
    pro_id: int
    pro_idusuario: Optional[int]
    pro_idlibro: Optional[int]
    pro_pagina_actual: Optional[int]
    pro_pagina_total: Optional[int]

    model_config = {"from_attributes": True}


class ProgresoSimpleResponse(SQLModel):
    pro_id: int
    pro_pagina_actual: Optional[int]
    pro_pagina_total: Optional[int]

    model_config = {"from_attributes": True}