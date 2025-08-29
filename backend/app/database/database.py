import os
from sqlmodel import create_engine, Session, SQLModel
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

# Inyección de dependencia a la base de datos
def get_session():
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close() 




