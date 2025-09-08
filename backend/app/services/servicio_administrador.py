from typing import List
from sqlalchemy.orm import Session
from app.models.usuario.modelo_usuario import Usuario
from app.models.libro.progreso.modelo_progreso import ProgresoLectura
from app.models.texto.modelo_texto import Texto
from app.models.libro.lectura.modelo_lectura import LecturaSesion
from app.models.compra.modelo_compra import Compra
from app.models.libro.modelo_libro import Libro
from sqlalchemy import func
from datetime import date

from sqlalchemy import or_
from datetime import datetime


class AdministradorServicio:
    def __init__(self, session: Session):
        self.session = session

    def listar_usuarios(
        self, busqueda=None, estado="todos", fechaDesde=None, fechaHasta=None
    ) -> List[Usuario]:
        query = self.session.query(Usuario)

        # 🔎 Filtro búsqueda (nombre, apellido, email, usuario)
        if busqueda:
            like = f"%{busqueda}%"
            query = query.filter(
                or_(
                    Usuario.usu_nombre.ilike(like),
                    Usuario.usu_apellido.ilike(like),
                    Usuario.usu_correo.ilike(like),
                    Usuario.usu_usuario.ilike(like),
                )
            )

        if estado != "todos":
            if estado == "activo":
                query = query.filter(Usuario.usu_verificado.is_(True))
            elif estado == "pendiente":
                query = query.filter(Usuario.usu_verificado.is_(False))

        if fechaDesde:
            desde = datetime.fromisoformat(fechaDesde)
            query = query.filter(Usuario.usu_fecharegistro >= desde)
        if fechaHasta:
            hasta = datetime.fromisoformat(fechaHasta)
            query = query.filter(Usuario.usu_fecharegistro <= hasta)

        return query.all()

    def listar_actividad_usuario(self, usu_id: int) -> List[dict]:
        progresos = (
            self.session.query(ProgresoLectura).filter_by(pro_idusuario=usu_id).all()
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
                .filter(LecturaSesion.ls_fecha_final.isnot(None))
                .order_by(LecturaSesion.ls_fecha_final.desc())
                .first()
            )

            # Total de notas creadas por el usuario en ese libro
            total_notas = (
                self.session.query(Texto)
                .filter_by(txt_idusuario=usu_id, txt_idlibro=prog.pro_idlibro)
                .count()
            )

            libros_con_progreso.append(
                {
                    "lib_id": prog.pro_idlibro,
                    "lib_titulo": prog.libro.lib_titulo,
                    "paginas_leidas": prog.pro_pagina_actual or 0,
                    "paginas_totales": prog.pro_pagina_total or 0,
                    "notas": total_notas,
                    "tiempo_minutos": tiempo_minutos,
                    "ultima_sesion": (
                        ultima_sesion.ls_fecha_final.isoformat()
                        if ultima_sesion and ultima_sesion.ls_fecha_final
                        else None
                    ),
                }
            )

        return libros_con_progreso

    def listar_historial_usuario(self, usu_id: int) -> List[dict]:
        compras = (
            self.session.query(Compra)
            .filter(Compra.com_idusuario == usu_id)
            .order_by(Compra.com_fecha.desc())
            .all()
        )

        historial = []
        for compra in compras:
            libro = (
                self.session.query(Libro)
                .filter(Libro.lib_id == compra.com_idlibro)
                .first()
            )

            historial.append(
                {
                    "id": compra.com_id,
                    "libro_titulo": libro.lib_titulo if libro else None,
                    "fecha_compra": compra.com_fecha.isoformat(),
                    "monto": None,  # si en tu modelo no guardas monto, aquí queda vacío o lo sacas de otro lado
                    "estado": compra.com_estado,
                    "referencia": compra.com_referencia,
                }
            )

        return historial

    def listar_dashboard(self) -> dict:
        hoy = date.today()
        inicio_mes = date(hoy.year, hoy.month, 1)

        # Total usuarios
        total_usuarios = self.session.query(Usuario).count()

        # Usuarios activos
        usuarios_activos = (
            self.session.query(Usuario).filter(Usuario.usu_verificado.is_(True)).count()
        )

        # Total libros
        total_libros = self.session.query(Libro).count()

        # Ventas de hoy
        ventas_hoy = (
            self.session.query(Compra)
            .filter(func.date(Compra.com_fecha) == hoy, Compra.com_estado == "approved")
            .count()
        )

        # Ventas del mes
        ventas_mes = (
            self.session.query(Compra)
            .filter(Compra.com_fecha >= inicio_mes, Compra.com_estado == "approved")
            .count()
        )

        # Ingresos del mes
        ingresos_mes = (
            self.session.query(func.sum(Libro.lib_precio))
            .select_from(Compra)  # 👈 empezamos desde Compra
            .join(Libro, Compra.com_idlibro == Libro.lib_id)  # relación explícita
            .filter(
                Compra.com_fecha >= inicio_mes,
                Compra.com_estado == "approved",  # 👈 tu estado real
            )
            .scalar()
        ) or 0

        # Descargas totales (puedes ajustar según tu lógica real)
        descargas = self.session.query(LecturaSesion).count()

        return {
            "totalUsuarios": total_usuarios,
            "usuariosActivos": usuarios_activos,
            "totalLibros": total_libros,
            "ventasHoy": ventas_hoy,
            "ventasMes": ventas_mes,
            "ingresosMes": ingresos_mes,
            "descargas": descargas,
        }
