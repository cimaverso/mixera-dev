from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.usuario.modelo_usuario import Usuario
from app.models.libro.progreso.modelo_progreso import ProgresoLectura
from app.models.texto.modelo_texto import Texto
from app.models.libro.lectura.modelo_lectura import LecturaSesion
from app.models.compra.modelo_compra import Compra
from app.models.libro.modelo_libro import Libro
from sqlalchemy import func, or_
from datetime import date, datetime


class AdministradorServicio:
    def __init__(self, session: Session):
        self.session = session

    def listar_usuarios(
        self,
        busqueda: Optional[str] = None,
        estado: str = "todos",
        fechaDesde: Optional[str] = None,
        fechaHasta: Optional[str] = None,
    ) -> List[Dict]:
        """
        Retorna una lista de dicts con info de usuario + última actividad
        """
        query = (
            self.session.query(
                Usuario.usu_id,
                Usuario.usu_nombre,
                Usuario.usu_apellido,
                Usuario.usu_usuario,
                Usuario.usu_correo,
                Usuario.usu_verificado,
                Usuario.usu_fecharegistro,
                Usuario.usu_ciudad,
                Usuario.usu_pais,
                func.max(LecturaSesion.ls_fecha_final).label("ultima_actividad"),
            )
            .outerjoin(LecturaSesion, Usuario.usu_id == LecturaSesion.ls_idusuario)
            .group_by(Usuario.usu_id)
        )

        # 🔎 Filtro búsqueda
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

        # ✅ Estado
        if estado != "todos":
            if estado == "activo":
                query = query.filter(Usuario.usu_verificado.is_(True))
            elif estado == "pendiente":
                query = query.filter(Usuario.usu_verificado.is_(False))

        # 📅 Fechas
        if fechaDesde:
            desde = datetime.fromisoformat(fechaDesde)
            query = query.filter(Usuario.usu_fecharegistro >= desde)
        if fechaHasta:
            hasta = datetime.fromisoformat(fechaHasta)
            query = query.filter(Usuario.usu_fecharegistro <= hasta)

        query = query.order_by(Usuario.usu_fecharegistro.desc())
        filas = query.all()

        usuarios: List[Dict] = []
        for (
            usu_id,
            usu_nombre,
            usu_apellido,
            usu_usuario,
            usu_correo,
            usu_verificado,
            usu_fecharegistro,
            usu_ciudad,
            usu_pais,
            ultima_actividad,
        ) in filas:
            usuarios.append(
                {
                    "usu_id": usu_id,
                    "usu_nombre": usu_nombre,
                    "usu_apellido": usu_apellido,
                    "usu_usuario": usu_usuario,
                    "usu_correo": usu_correo,
                    "usu_verificado": bool(usu_verificado),
                    "usu_fecha_registro": (
                        usu_fecharegistro.isoformat()
                        if isinstance(usu_fecharegistro, datetime)
                        else None
                    ),
                    "usu_ciudad": usu_ciudad,
                    "usu_pais": usu_pais,
                    "ultima_actividad": (
                        ultima_actividad.isoformat()
                        if isinstance(ultima_actividad, datetime)
                        else None
                    ),
                }
            )

        return usuarios

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

            tiempo_minutos = 0
            for sesion in sesiones:
                if sesion.ls_fecha_final:
                    duracion = sesion.ls_fecha_final - sesion.ls_fecha_inicial
                    tiempo_minutos += int(duracion.total_seconds() // 60)

            ultima_sesion = (
                self.session.query(LecturaSesion)
                .filter_by(ls_idusuario=usu_id, ls_idlibro=prog.pro_idlibro)
                .filter(LecturaSesion.ls_fecha_final.isnot(None))
                .order_by(LecturaSesion.ls_fecha_final.desc())
                .first()
            )

            total_notas = (
                self.session.query(Texto)
                .filter_by(txt_idusuario=usu_id, txt_idlibro=prog.pro_idlibro)
                .count()
            )

            # Obtener título del libro sin relationship
            libro = (
                self.session.query(Libro)
                .filter(Libro.lib_id == prog.pro_idlibro)
                .first()
            )

            libros_con_progreso.append(
                {
                    "lib_id": prog.pro_idlibro,
                    "lib_titulo": libro.lib_titulo if libro else None,
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
                    "monto": None,
                    "estado": compra.com_estado,
                    "referencia": compra.com_referencia,
                }
            )

        return historial

    def listar_dashboard(self) -> dict:
        hoy = date.today()
        inicio_mes = date(hoy.year, hoy.month, 1)

        total_usuarios = self.session.query(Usuario).count()

        usuarios_activos = (
            self.session.query(Usuario).filter(Usuario.usu_verificado.is_(True)).count()
        )

        total_libros = self.session.query(Libro).count()

        ventas_hoy = (
            self.session.query(Compra)
            .filter(func.date(Compra.com_fecha) == hoy, Compra.com_estado == "approved")
            .count()
        )

        ventas_mes = (
            self.session.query(Compra)
            .filter(Compra.com_fecha >= inicio_mes, Compra.com_estado == "approved")
            .count()
        )

        ingresos_mes = (
            self.session.query(func.sum(Libro.lib_precio))
            .select_from(Compra)
            .join(Libro, Compra.com_idlibro == Libro.lib_id)
            .filter(Compra.com_fecha >= inicio_mes, Compra.com_estado == "approved")
            .scalar()
        ) or 0

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
