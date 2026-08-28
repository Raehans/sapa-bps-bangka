import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://7GtMRc9PHdyS3Hw.root:n23eyfIZyDJl3Wl1@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sapa_bangka"
)

# Konfigurasi Anti-Disconnect (Auto Reconnect & Auto Health-Check)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Otomatis cek koneksi sebelum query, reconnect jika putus
    pool_recycle=60,         # Me-refresh koneksi setiap 60 detik agar tidak ditutup oleh TiDB
    pool_size=5,             # Jumlah koneksi standby
    max_overflow=10,         # Batas lonjakan koneksi
    connect_args={
        "connect_timeout": 10,
        "ssl": {}
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
    finally:
        db.close()
