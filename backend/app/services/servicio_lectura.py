from sqlalchemy.orm import Session
from sqlalchemy import asc
from datetime import datetime
from app.models.libro.lectura.modelo_lectura import LecturaSesion

class LecturaSesionServicio:
    def __init__(self, db: Session):
        self.db = db

    def iniciar_sesion(self, usuario_id: int, libro_id: int) -> LecturaSesion:

        sesion_abierta = (
            self.db.query(LecturaSesion)
            .filter(
                LecturaSesion.ls_idusuario == usuario_id,
                LecturaSesion.ls_idlibro == libro_id,
                LecturaSesion.ls_fecha_final.is_(None)
            )
            .first()
        )
        if sesion_abierta:
            return sesion_abierta  # No crea una nueva, retorna la existente
        
        nueva_sesion = LecturaSesion(
            ls_idusuario=usuario_id,
            ls_idlibro=libro_id,
            ls_fecha_inicial=datetime.utcnow(),
            ls_fecha_final=None
        )
        self.db.add(nueva_sesion)
        self.db.commit()
        self.db.refresh(nueva_sesion)
        return nueva_sesion

    def finalizar_sesion(self, sesion_id: int, usuario_id: int) -> LecturaSesion:
        sesion = self.db.get(LecturaSesion, sesion_id)
        if not sesion:
            raise Exception("Sesión no encontrada")
        if sesion.ls_idusuario != usuario_id:
            raise Exception("No autorizado para finalizar esta sesión")
        if sesion.ls_fecha_final is not None:
            raise Exception("Sesión ya finalizada")
        sesion.ls_fecha_final = datetime.utcnow()
        self.db.add(sesion)
        self.db.commit()
        self.db.refresh(sesion)
        return sesion

    def tiempo_total_libro(self, usuario_id: int, libro_id: int) -> int:
        # Suma de minutos leídos para este usuario y libro
        sesiones = (
            self.db.query(LecturaSesion)
            .filter(
                LecturaSesion.ls_idusuario == usuario_id,
                LecturaSesion.ls_idlibro == libro_id,
                LecturaSesion.ls_fecha_final.isnot(None)
            )
            .all()
        )
        total_minutos = 0
        for sesion in sesiones:
            minutos = int((sesion.ls_fecha_final - sesion.ls_fecha_inicial).total_seconds() // 60)
            total_minutos += minutos
        return total_minutos

    def intermitencia_libro(self, usuario_id: int, libro_id: int) -> float:
        # Promedio de días entre sesiones para este usuario/libro
        sesiones = (
            self.db.query(LecturaSesion)
            .filter(
                LecturaSesion.ls_idusuario == usuario_id,
                LecturaSesion.ls_idlibro == libro_id,
                LecturaSesion.ls_fecha_final.isnot(None)
            )
            .order_by(LecturaSesion.ls_fecha_inicial.asc())
            .all()
        )
        if len(sesiones) < 2:
            return 0.0
        dias = []
        for i in range(1, len(sesiones)):
            d = (sesiones[i].ls_fecha_inicial - sesiones[i-1].ls_fecha_inicial).days
            dias.append(d)
        return round(sum(dias) / len(dias), 2)
    
    def calcular_intermitencia(db, usuario_id, libro_id):
        # Trae todas las sesiones de ese usuario y libro, ordenadas por fecha inicial
        sesiones = (
            db.query(LecturaSesion)
            .filter(LecturaSesion.ls_idusuario == usuario_id,
                    LecturaSesion.ls_idlibro == libro_id)
            .order_by(asc(LecturaSesion.ls_fecha_inicial))
            .all()
        )

        if len(sesiones) < 2:
            return None  # No hay suficiente data para calcular

        # Saca el promedio de diferencia de días entre sesiones
        diferencias = []
        for i in range(1, len(sesiones)):
            fecha1 = sesiones[i-1].ls_fecha_inicial
            fecha2 = sesiones[i].ls_fecha_inicial
            delta = (fecha2 - fecha1).days
            if delta > 0:
                diferencias.append(delta)

        if not diferencias:
            return None

        promedio = sum(diferencias) / len(diferencias)
        return promedio  # puede ser float (ej. 2.7 días)
