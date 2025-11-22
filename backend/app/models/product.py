from sqlalchemy import Column, String, Numeric, Enum
from app.models.database import BaseModel
import enum

class UnitType(enum.Enum):
    SACKS = "sacks"
    BOXES = "boxes"

class BranchType(enum.Enum):
    STORE = "Main Store"
    BRANCH1 = "Gikomba"
    BRANCH2 = "Kariobangi" 
    BRANCH3 = "Kampala"

class StockStatus(enum.Enum):
    CRITICAL = "critical"
    LOW = "low"
    OKAY = "okay"

class Product(BaseModel):
    __tablename__ = "products"
    
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    quantity = Column(Numeric(10, 2), default=0)
    unit = Column(Enum(UnitType), nullable=False)
    # branch = Column(Enum(BranchType), nullable=False)
    min_stock = Column(Numeric(10, 2), default=5)
    status = Column(Enum(StockStatus), default=StockStatus.OKAY)