from sqlmodel import Session, select
from app.models.libro.modelo_categoria import Categoria, CategoriaCreate, CategoriaUpdate

class CategoriaServicio:
    def __init__(self, session: Session):
        self.session = session

    def listar_categorias(self) -> list[Categoria]:
        return self.session.exec(select(Categoria)).all()


    def crear_categoria(self, data: CategoriaCreate) -> Categoria:
        categoria = Categoria.from_orm(data)
        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        return categoria

    def actualizar_categoria(self, categoria_id: int, data: CategoriaUpdate) -> Categoria:
        categoria = self.session.get(Categoria, categoria_id)
        categoria_data = data.dict(exclude_unset=True)
        for key, value in categoria_data.items():
            setattr(categoria, key, value)

        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        return categoria
