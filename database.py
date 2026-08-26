# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Menggunakan DATABASE_URL dari environment variable jika ada di cloud,
# atau default ke localhost jika dijalankan di laptop
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/proyek")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
