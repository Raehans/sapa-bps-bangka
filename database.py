# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Alamat database TiDB Cloud Anda
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://7GtMRc9PHdyS3Hw.root:n23eyfIZyDJl3Wl1@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sapa_bangka?ssl_verify_cert=true&ssl_verify_identity=true"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
