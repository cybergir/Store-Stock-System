import io
import math
import json
import logging
from fastapi import (
    APIRouter, UploadFile, File, HTTPException, 
    Query, Depends, status
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import pandas as pd
import numpy as np
from io import BytesIO
from typing import List
from datetime import datetime, date
from decimal import Decimal

from app.db.session import get_db
from app.models.product import Product, StockStatus
from app.models.stock_movement import StockMovement, MovementType
from app.schemas.product import Product as ProductSchema
from app.schemas.stock_movement import StockMovement as StockMovementSchema

router = APIRouter()

# Reuse your existing utility functions
def convert_datetime_to_string(data):
    """Recursively convert objects to JSON serializable formats"""
    if isinstance(data, dict):
        return {key: convert_datetime_to_string(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_datetime_to_string(item) for item in data]
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    elif isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, (np.integer, np.int64, np.int32)):
        return int(data)
    elif isinstance(data, (np.floating, np.float64, np.float32)):
        return float(data)
    elif isinstance(data, (np.bool_)):
        return bool(data)
    elif isinstance(data, float) and (math.isnan(data) or math.isinf(data)):
        return None
    elif data is pd.NaT:
        return None
    elif hasattr(data, 'isoformat'):
        return data.isoformat()
    elif data is None:
        return None

@router.post("/movement")
async def stock_movement(
    movement_data: StockMovementSchema,
    db: AsyncSession = Depends(get_db)
):
    """
    Record stock in/out movement
    """
    try:
        # Get product
        result = await db.execute(select(Product).where(Product.id == movement_data.product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Update stock quantity
        if movement_data.type == MovementType.IN:
            product.quantity += movement_data.quantity
        else:
            product.quantity -= movement_data.quantity
        
        # Update stock status
        if product.quantity == 0:
            product.status = StockStatus.CRITICAL
        elif product.quantity <= product.min_stock:
            product.status = StockStatus.LOW
        else:
            product.status = StockStatus.OKAY
        
        # Create movement record
        movement = StockMovement(**movement_data.dict())
        db.add(movement)
        await db.commit()
        
        return {"message": "Stock movement recorded successfully", "product": product}
        
    except Exception as e:
        await db.rollback()
        logging.error(f"Stock movement failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record stock movement")

@router.get("/alerts")
async def get_stock_alerts(db: AsyncSession = Depends(get_db)):
    """
    Get stock alerts (critical and low stock items)
    """
    try:
        # Critical items (quantity = 0)
        result = await db.execute(
            select(Product).where(Product.status == StockStatus.CRITICAL)
        )
        critical = result.scalars().all()
        
        # Low stock items (quantity <= min_stock but > 0)
        result = await db.execute(
            select(Product).where(Product.status == StockStatus.LOW)
        )
        low = result.scalars().all()
        
        return {
            "critical": critical,
            "low": low
        }
    except Exception as e:
        logging.error(f"Failed to fetch alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stock alerts")

@router.get("/reports")
async def get_stock_reports(
    start_date: date = None,
    end_date: date = None,
    branch: str = None,
    category: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate stock reports with filters
    """
    try:
        query = select(StockMovement)
        
        if start_date:
            query = query.where(StockMovement.movement_date >= start_date)
        if end_date:
            query = query.where(StockMovement.movement_date <= end_date)
        if branch:
            query = query.where(StockMovement.branch == branch)
        if category:
            query = query.join(Product).where(Product.category == category)
        
        result = await db.execute(query)
        movements = result.scalars().all()
        
        return movements
        
    except Exception as e:
        logging.error(f"Failed to generate report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate report")