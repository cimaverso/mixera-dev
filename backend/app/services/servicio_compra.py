# app/services/compra_service.py
from app.models.compra.modelo_compra import Compra
from datetime import datetime

class CompraServicio:
    def __init__(self, db):
        self.db = db

    def guardar_compra(self, usuario_id: int, libro_id: int, reference: str):
        compra = self.db.query(Compra).filter(Compra.com_referencia == reference).first()
        if compra:
            return compra
        nueva_compra = Compra(
            com_idusuario=usuario_id,
            com_idlibro=libro_id,
            com_fecha=datetime.utcnow(),
            com_estado="pending",  
            com_referencia=reference
        )
        self.db.add(nueva_compra)
        self.db.commit()
        self.db.refresh(nueva_compra)
        return nueva_compra

    def actualizar_estado_compra(self, external_reference: str, estado: str):
        compra = self.db.query(Compra).filter(Compra.com_referencia == external_reference).first()
        if compra:
            if compra.com_estado != estado:  # Solo actualiza si cambió
                compra.com_estado = estado
                self.db.add(compra)
                self.db.commit()
                self.db.refresh(compra)
        return compra
