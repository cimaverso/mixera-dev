# main.py

from fastapi import FastAPI
from sqlmodel import SQLModel
from fastapi.staticfiles import StaticFiles
from app.database.database import engine
from fastapi.middleware.cors import CORSMiddleware



from app.routers import usuario, autenticacion, pago, autor, categoria, editorial, libro, webhook, texto, progreso, lectura, administrador


app = FastAPI(
    title="Sistema Mixera",
)

def crear_tablas():
    SQLModel.metadata.create_all(engine)

crear_tablas()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.mount("/uploads/books", StaticFiles(directory="uploads/books"), name="books")
app.mount("/uploads/covers", StaticFiles(directory="uploads/covers"), name="covers")


origins = [
    "http://localhost:5173",  # desarrollo local
    "https://app.mixera.org",  # produccion
    "https://mixera.org"       # producción
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

app.include_router(administrador.router)
app.include_router(usuario.router)
app.include_router(autenticacion.router)
app.include_router(pago.router)
app.include_router(webhook.router)
app.include_router(autor.router)
app.include_router(categoria.router)
app.include_router(editorial.router)
app.include_router(libro.router)
app.include_router(texto.router)
app.include_router(progreso.router)
app.include_router(lectura.router)
