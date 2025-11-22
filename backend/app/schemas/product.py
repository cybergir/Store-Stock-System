from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.product import UnitType, BranchType, StockStatus

class ProductBase(BaseModel):
    name: str
    category: str
    quantity: float
    unit: UnitType
    # branch: BranchType
    min_stock: float = 5

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    min_stock: Optional[float] = None

class Product(ProductBase):
    id: int
    status: StockStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True