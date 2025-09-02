# app/services/servicio_progreso.py
from app.models.libro.progreso.modelo_progreso import ProgresoLectura, ProgresoLecturaCreate
from sqlalchemy.orm import Session
from sqlmodel import select

class ProgresoLecturaServicio:
    def __init__(self, db: Session):
        self.db = db

    def obtener_progreso(self, usuario_id: int, libro_id: int):
        stmt = select(ProgresoLectura).where(
            ProgresoLectura.pro_idusuario == usuario_id,
            ProgresoLectura.pro_idlibro == libro_id
        )
        return self.db.exec(stmt).first()

    def guardar_o_actualizar_progreso(
        self, usuario_id: int, datos: ProgresoLecturaCreate
    ) -> ProgresoLectura:
        # Buscar si ya existe progreso para ese usuario y libro
        query = select(ProgresoLectura).where(
            ProgresoLectura.pro_idusuario == usuario_id,
            ProgresoLectura.pro_idlibro == datos.pro_idlibro
        )
        progreso = self.db.exec(query).first()
        if progreso:
            # Actualiza los campos
            progreso.pro_pagina_actual = datos.pro_pagina_actual
            progreso.pro_pagina_total = datos.pro_pagina_total
        else:
            # Crea nuevo
            progreso = ProgresoLectura(
                pro_idusuario=usuario_id,
                pro_idlibro=datos.pro_idlibro,
                pro_pagina_actual=datos.pro_pagina_actual,
                pro_pagina_total=datos.pro_pagina_total,
            )
            self.db.add(progreso)
        self.db.commit()
        self.db.refresh(progreso)
        return progreso
