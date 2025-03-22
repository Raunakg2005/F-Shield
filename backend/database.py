from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/fraud"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    business_email=Column(String,nullable=False)
    firebase_uid = Column(String, nullable=False)
    business_category = Column(String, nullable=False)
    total_transact= Column(Integer,nullable=0)
    risk=Column(Integer,nullable=0)
    risk_score=Column(Integer,nullable=0)


    # Define relationship with transactions
    transactions = relationship("Transaction", back_populates="business")



class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    amount = Column(Float, nullable=False)

    vendor_name = Column(String, nullable=True)
    vendor_type = Column(String, nullable=True)
    category = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)  # Default timestamp

    location = Column(String, nullable=True)  
    previous_balance = Column(Float, nullable=True)
    new_balance = Column(Float, nullable=True)
    suspicious_flag = Column(String, default=False)  
    payment_method = Column(String, nullable=True)

    # Correct relationship definition
    business = relationship("Business", back_populates="transactions")


# Create the tables
Base.metadata.create_all(bind=engine)
