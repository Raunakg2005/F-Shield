"""
FraudSense — Database Models (v2)
Added: risk_level, confidence_score, final_score, fraud_reasons,
       shap_reasons, review_status, reviewed_by to Transaction.
"""

import os
from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/fraud"
)

engine       = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base         = declarative_base()


class Business(Base):
    __tablename__ = "businesses"

    id                 = Column(Integer, primary_key=True, index=True)
    business_name      = Column(String, nullable=False)
    email              = Column(String, unique=True, nullable=False)
    firebase_uid       = Column(String, unique=True, nullable=True)
    category           = Column(String, default="General")
    total_transactions = Column(Integer, default=0)
    risk_count         = Column(Integer, default=0)
    risk_score         = Column(Float,   default=0.0)    # risk_count / total * 100

    transactions = relationship("Transaction", back_populates="business")


class Transaction(Base):
    __tablename__ = "transactions"

    id               = Column(Integer, primary_key=True, index=True)
    business_id      = Column(Integer, ForeignKey("businesses.id"), nullable=False)

    # Core transaction fields
    amount           = Column(Float,   nullable=False)
    vendor_name      = Column(String,  default="")
    category         = Column(String,  default="")
    payment_method   = Column(String,  default="")
    timestamp        = Column(String,  default="")
    previous_balance = Column(Float,   default=0.0)
    new_balance      = Column(Float,   default=0.0)

    # Fraud detection output
    suspicious_flag  = Column(Boolean, default=False)
    risk_level       = Column(String,  default="low")        # low/medium/high/critical
    confidence_score = Column(Float,   default=0.0)          # ML calibrated prob
    final_score      = Column(Float,   default=0.0)          # composite 0-1 score
    fraud_reasons    = Column(Text,    default="[]")          # rule flag messages (JSON list)
    shap_reasons     = Column(Text,    default="[]")          # SHAP text reasons (JSON list)

    # Human review
    review_status    = Column(String,  default="auto_cleared")  # pending_review / confirmed_fraud / false_positive / auto_cleared
    reviewed_by      = Column(String,  nullable=True)           # firebase UID of reviewer

    created_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="transactions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id             = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    business_id    = Column(Integer, nullable=True)
    event_type     = Column(String,  nullable=False)   # e.g. "fraud_flagged", "review_updated"
    actor_uid      = Column(String,  nullable=True)    # Firebase UID
    details        = Column(Text,    default="{}")
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    """Create all tables. Safe to call on startup."""
    Base.metadata.create_all(bind=engine)
    print("[DB] Tables initialized.")
