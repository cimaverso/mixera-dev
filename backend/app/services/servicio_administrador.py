from typing import List
from sqlalchemy.orm import Session
from app.models.usuario.modelo_usuario import Usuario
from app.models.libro.progreso.modelo_progreso import ProgresoLectura
from app.models.libro.modelo_libro import Libro


class AdministradorServicio:

    def __init__(self, session: Session):
        self.session = session  

    def listar_usuaios(self) -> List[Usuario]:

        return self.session.query(Usuario).all()
    
    def listar_libros_con_progreso(self, usu_id: int) -> List[tuple[Libro, ProgresoLectura]]:
        return (
            self.session
                .query(Libro, ProgresoLectura)
                .join(ProgresoLectura, ProgresoLectura.pro_idlibro == Libro.lib_id)
                .filter(ProgresoLectura.pro_idusuario == usu_id)
                .all()
        )

   
