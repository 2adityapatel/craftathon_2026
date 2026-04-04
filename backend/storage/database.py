from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

from config import settings

# In case the directory needs to be navigated relative to main script when using sqlite
db_url = settings.database_url

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String, primary_key=True, index=True)
    case_key_hash = Column(String, unique=True, index=True)
    status = Column(String, default="RECEIVED")
    evidence_type = Column(String)
    risk_score = Column(Float)
    category = Column(String)
    confidence = Column(Float)
    is_duplicate = Column(Boolean, default=False)
    repeat_offender = Column(Boolean, default=False)
    repeat_count = Column(Integer, default=0)
    should_escalate = Column(Boolean, default=False)
    domain = Column(String, index=True, nullable=True)
    ipfs_cid = Column(String)
    evidence_hash = Column(String)
    blockchain_tx = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id"))
    old_status = Column(String)
    new_status = Column(String)
    notes = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)
    blockchain_tx = Column(String)

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="authority")

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
