# models.py
from sqlalchemy import Column, Integer, Text, ForeignKey, Time, DateTime
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class HistoryMaster(Base):
    __tablename__ = "history_master"
    id = Column(Integer, primary_key=True, index=True)
    tanggal = Column(Time)
    judul = Column(Text)
    id_user = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    details = relationship("HistoryDetail", back_populates="master")

class HistoryDetail(Base):
    __tablename__ = "history_detail"
    id = Column(Integer, primary_key=True, index=True)
    pertanyaan = Column(Text)
    jawaban = Column(Text)
    id_history = Column(Integer, ForeignKey("history_master.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    master = relationship("HistoryMaster", back_populates="details")

class FAQ(Base):
    __tablename__ = "faqs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pertanyaan = Column(Text, nullable=False)
    jawaban = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

