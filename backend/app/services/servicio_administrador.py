from typing import List
from sqlalchemy.orm import Session
from app.models.usuario.modelo_usuario import Usuario
from app.models.libro.progreso.modelo_progreso import ProgresoLectura
from app.models.texto.modelo_texto import Texto
from app.models.libro.lectura.modelo_lectura import LecturaSesion


class AdministradorServicio:

    def __init__(self, session: Session):
        self.session = session  

    def listar_usuaios(self) -> List[Usuario]:
        return self.session.query(Usuario).all()
    
    def listar_actividad_usuario(self, usu_id: int) -> List[dict]:
        progresos = (
            self.session.query(ProgresoLectura)
            .filter_by(pro_idusuario=usu_id)
            .all()
        )

        libros_con_progreso = []

        for prog in progresos:
            # Obtener sesiones de lectura del usuario para ese libro
            sesiones = (
                self.session.query(LecturaSesion)
                .filter_by(ls_idusuario=usu_id, ls_idlibro=prog.pro_idlibro)
                .all()
            )

            # Calcular tiempo total en minutos sumando duración de cada sesión
            tiempo_minutos = 0
            for sesion in sesiones:
                if sesion.ls_fecha_final:
                    duracion = sesion.ls_fecha_final - sesion.ls_fecha_inicial
                    tiempo_minutos += int(duracion.total_seconds() // 60)

            # Obtener la última sesión con fecha_final más reciente
            ultima_sesion = (
                self.session.query(LecturaSesion)
                .filter_by(ls_idusuario=usu_id, ls_idlibro=prog.pro_idlibro)
                .filter(LecturaSesion.ls_fecha_final != None)
                .order_by(LecturaSesion.ls_fecha_final.desc())
                .first()
            )

            # Total de notas creadas por el usuario en ese libro
            total_notas = (
                self.session.query(Texto)
                .filter_by(txt_idusuario=usu_id, txt_idlibro=prog.pro_idlibro)
                .count()
            )

            libros_con_progreso.append({
                "lib_id": prog.pro_idlibro,
                "lib_titulo": prog.libro.lib_titulo,
                "paginas_leidas": prog.pro_pagina_actual or 0,
                "paginas_totales": prog.pro_pagina_total or 0,
                "notas": total_notas,
                "tiempo_minutos": tiempo_minutos,
                "ultima_sesion": (
                    ultima_sesion.ls_fecha_final.isoformat()
                    if ultima_sesion and ultima_sesion.ls_fecha_final else None
                )
            })

        return libros_con_progreso


