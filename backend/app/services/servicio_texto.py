# app/services/servicio_texto.py
from typing import List, Optional
from sqlmodel import Session, select
from app.models.texto.modelo_texto import Texto, TextoCreate

class TextoServicio:
    def __init__(self, session: Session):
        self.session = session

    def listar_libro_id_usuario(self, libro_id: int, usuario_id: int) -> List[Texto]:
        return self.session.exec(
            select(Texto).where(
                (Texto.txt_idlibro == libro_id) & 
                (Texto.txt_idusuario == usuario_id)
            )
        ).all()

    def crear_texto(self, texto_in: TextoCreate, usuario_id: int) -> Texto:
        texto = Texto(
            txt_idlibro=texto_in.txt_idlibro,
            txt_idusuario=usuario_id,
            txt_pagina=texto_in.txt_pagina,
            txt_x=texto_in.txt_x,
            txt_y=texto_in.txt_y,
            txt_texto=texto_in.txt_texto,
            txt_ancho=texto_in.txt_ancho,
            txt_alto=texto_in.txt_alto,
            txt_dimension=texto_in.txt_dimension,
        )
        self.session.add(texto)
        self.session.commit()
        self.session.refresh(texto)
        return texto
    
    def actualizar_texto(self, texto_id: int, data: dict) -> Optional[Texto]:
        texto = self.session.get(Texto, texto_id)
        if not texto:
            return None
        for key, value in data.items():
            setattr(texto, key, value)
        self.session.commit()
        self.session.refresh(texto)
        return texto

    def eliminar_texto(self, texto_id: int) -> bool:
        texto = self.session.get(Texto, texto_id)
        if not texto:
            return False
        self.session.delete(texto)
        self.session.commit()
        return True
