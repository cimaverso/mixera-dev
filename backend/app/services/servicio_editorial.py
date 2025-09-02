from sqlmodel import Session, select
from fastapi import HTTPException
from app.models.libro.modelo_editorial import Editorial, EditorialCreate, EditorialUpdate

class EditorialServicio:
    def __init__(self, session: Session):
        self.session = session

    def listar_editoriales(self) -> list[Editorial]:
        return self.session.exec(select(Editorial)).all()

    def obtener_editorial(self, edit_id: int) -> Editorial:
        editorial = self.session.get(Editorial, edit_id)
        if not editorial:
            raise HTTPException(404, detail="Editorial no encontrada")
        return editorial

    def crear_editorial(self, data: EditorialCreate) -> Editorial:
        editorial = Editorial.from_orm(data)
        self.session.add(editorial)
        self.session.commit()
        self.session.refresh(editorial)
        return editorial

    def actualizar_editorial(self, edit_id: int, data: EditorialUpdate) -> Editorial:
        editorial = self.session.get(Editorial, edit_id)
        if not editorial:
            raise HTTPException(404, detail="Editorial no encontrada")
        editorial_data = data.dict(exclude_unset=True)
        for key, value in editorial_data.items():
            setattr(editorial, key, value)
        self.session.add(editorial)
        self.session.commit()
        self.session.refresh(editorial)
        return editorial
