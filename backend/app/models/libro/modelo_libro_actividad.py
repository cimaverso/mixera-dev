from sqlmodel import SQLModel, Field

class LibroActividadResponse(SQLModel):
    lib_id: int = Field(..., description="ID del libro")
    lib_titulo: str = Field(..., description="Título del libro")
    pro_pagina_actual: int = Field(..., description="Página actual leída")
    pro_pagina_total: int = Field(..., description="Total de páginas del libro")
    horas_leidas: int = Field(..., description="Horas totales de lectura")
    minutos_leidos: int = Field(..., description="Minutos adicionales de lectura")
    intermitencia_dias: float = Field(..., description="Días de intermitencia de lectura")
    textos_count: int = Field(..., description="Número de anotaciones/textos realizados")

    model_config = {"from_attributes": True}
