from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.database import BaseModel
import enum

class MovementType(enum.Enum):
    IN = "in"
    OUT = "out"

class StockMovement(BaseModel):
    __tablename__ = "stock_movements"
    
    product_id = Column(Integer, ForeignKey("products.id"))
    type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    branch = Column(String, nullable=False)
    movement_date = Column(DateTime(timezone=True), server_default=func.now())  # ✅ Now func is imported
    reference = Column(String)
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    product = relationship("Product")