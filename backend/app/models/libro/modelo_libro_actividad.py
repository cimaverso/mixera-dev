from sqlmodel import SQLModel, Field


class LibroActividadResponse(SQLModel):
    lib_id: int = Field(..., description="ID del libro")
    lib_titulo: str = Field(..., description="Título del libro")
    pro_pagina_actual: int = Field(..., description="Página actual leída")
    pro_pagina_total: int = Field(..., description="Total de páginas del libro")

    model_config = {"from_attributes": True}
