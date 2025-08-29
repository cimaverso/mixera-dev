from sqlmodel import Session, select
from app.models.libro.modelo_autor import Autor, AutorCreate, AutorUpdate



class AutorService:
    def __init__(self, session: Session):
        self.session = session

    # Listar todos los autores
    def listar_autores(self) -> list[Autor]:
        return self.session.exec(select(Autor)).all()

    # Crear autor
    def crear_autor(self, data: AutorCreate) -> Autor:
        autor = Autor.from_orm(data)
        self.session.add(autor)
        self.session.commit()
        self.session.refresh(autor)
        return autor

    # Actualizar autor
    def actualizar_autor(self, aut_id: int, data: AutorUpdate) -> Autor:
        autor = self.session.get(Autor, aut_id)

        autor_data = data.dict(exclude_unset=True)
        for key, value in autor_data.items():
            setattr(autor, key, value)

        self.session.add(autor)
        self.session.commit()
        self.session.refresh(autor)
        return autor
