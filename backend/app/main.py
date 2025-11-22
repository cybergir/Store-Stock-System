from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import pandas as pd
import json
from typing import List, Dict, Optional
import logging
from app.db.session import engine, Base, get_db
from app.models.product import Product, StockStatus, UnitType, BranchType
from app.models.stock_movement import StockMovement, MovementType
from app.schemas.product import Product as ProductSchema
from datetime import datetime, date
from decimal import Decimal
import numpy as np
from decimal import Decimal
import io
from app.core.auth import (
    verify_password, get_password_hash, create_access_token, 
    get_current_user, require_role, UserRole
)
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole
    branch: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ProductCreate(BaseModel):
    name: str
    category: str
    quantity: float = 0
    unit: UnitType
    branch: BranchType
    min_stock: float = 5

# Store management endpoints
class StockMovementRequest(BaseModel):
    product_id: int
    movement_type: str
    quantity: float
    target_branch: Optional[str] = None
    reference: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup
    await engine.dispose()

app = FastAPI(
    title="Solai Store System",
    description="Stock management system for sacks and boxes with Excel processing",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_int(value) -> int:
    """Safely convert value to integer"""
    try:
        if pd.isna(value):
            return 0
        if isinstance(value, str) and value.startswith('='):
            return 0
        return int(float(value))
    except (ValueError, TypeError):
        return 0

def get_stock_status(balance: int) -> str:
    """Determine stock status based on balance"""
    if balance <= 0:
        return "critical"
    elif balance <= 5:
        return "low"
    else:
        return "ok"

def calculate_stock_from_source(initial_stock_data, stock_in_data, stock_out_data):
    # Calculate stock balances from INITIAL STOCK, STOCK IN, and STOCK OUT sheets
    stock_dict = {}
    
    # Process INITIAL STOCK sheet
    process_initial_stock_sheet(initial_stock_data, stock_dict)
    
    # Process STOCK IN sheet
    if stock_in_data:
        process_stock_in_sheet(stock_in_data, stock_dict)
    
    # Process STOCK OUT sheet
    if stock_out_data:
        process_stock_out_sheet(stock_out_data, stock_dict)
    
    # Convert to list of stock items
    stock_items = []
    for product_name, data in stock_dict.items():
        balance = data.get('initial', 0) + data.get('added', 0) - data.get('issued', 0)
        
        stock_items.append({
            "name": product_name,
            "category": data.get('category', 'Unknown'),
            "initial": data.get('initial', 0),
            "added": data.get('added', 0),
            "issued": data.get('issued', 0),
            "balance": balance,
            "status": get_stock_status(balance)
        })
    
    return stock_items

def process_initial_stock_sheet(initial_data, stock_dict):
    """Process INITIAL STOCK sheet - filter out empty rows"""
    for row in initial_data:
        # Check if this row has both a product AND a quantity
        product_name = str(row.get('PRODUCT', '')).strip() if row.get('PRODUCT') else None
        initial_qty = safe_int(row.get('NO. OF SACKS', 0))
        
        # Skip rows that don't have both product and quantity
        if not product_name or product_name.startswith('=') or initial_qty == 0:
            continue
            
        if product_name not in stock_dict:
            stock_dict[product_name] = {'initial': 0, 'added': 0, 'issued': 0}
        
        stock_dict[product_name]['initial'] += initial_qty

def process_stock_in_sheet(stock_in_data, stock_dict):
    """Process STOCK IN sheet - filter out empty rows"""
    for row in stock_in_data:
        product_name = str(row.get('PRODUCT', '')).strip() if row.get('PRODUCT') else None
        added_qty = safe_int(row.get('NO. OF SACKS', 0))
        
        # Skip empty rows
        if not product_name or product_name.startswith('=') or added_qty == 0:
            continue
            
        if product_name not in stock_dict:
            stock_dict[product_name] = {'initial': 0, 'added': 0, 'issued': 0}
        
        stock_dict[product_name]['added'] += added_qty

def process_stock_out_sheet(stock_out_data, stock_dict):
    """Process STOCK OUT sheet - filter out empty rows"""
    for row in stock_out_data:
        product_name = str(row.get('PRODUCT', '')).strip() if row.get('PRODUCT') else None
        issued_qty = safe_int(row.get('NO. OF SACKS', 0))
        
        # Skip empty rows
        if not product_name or product_name.startswith('=') or issued_qty == 0:
            continue
            
        if product_name not in stock_dict:
            stock_dict[product_name] = {'initial': 0, 'added': 0, 'issued': 0}
        
        stock_dict[product_name]['issued'] += issued_qty

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        if pd.isna(obj):
            return None
        return super().default(obj)


@app.post("/api/auth/register", response_model=Token)
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create first user as admin, others need admin privileges
    result = await db.execute(select(User))
    users_count = len(result.scalars().all())
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role,
        branch=user_data.branch
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "branch": user.branch
        }
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is disabled")
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "branch": user.branch
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value,
        "branch": current_user.branch
    }

@app.get("/api/users/")
async def get_users(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "branch": user.branch,
            "is_active": user.is_active,
            "last_login": user.last_login
        }
        for user in users
    ]

@app.post("/api/users/")
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role,
        branch=user_data.branch,
        created_by=current_user.email
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {"message": "User created successfully", "user_id": user.id}

@app.put("/api/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    for field, value in user_data.items():
        if field == "password" and value:
            setattr(user, "password_hash", get_password_hash(value))
        elif hasattr(user, field) and field != "id":
            setattr(user, field, value)
    
    await db.commit()
    return {"message": "User updated successfully"}


@app.get("/")
async def root():
    return {"message": "Solai Store System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Solai Store System API is running"}

# Stock endpoints from your previous code
@app.get("/api/stock/current", response_model=List[ProductSchema])
async def get_current_stock(db: AsyncSession = Depends(get_db)):
    """
    Get the current processed stock data
    """
    try:
        result = await db.execute(select(Product).order_by(Product.updated_at.desc()))
        products = result.scalars().all()
        
        if not products:
            return []
            
        return products
        
    except Exception as e:
        logger.error(f"Error fetching stock data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

@app.post("/api/stock/process-excel")
async def process_excel_data_upload(
    file: bytes,
    branch: BranchType = BranchType.BRANCH1,
    db: AsyncSession = Depends(get_db)
):
    """
    Process Excel file with INITIAL STOCK, STOCK IN, and STOCK OUT sheets
    """
    try:
        # Read Excel file
        excel_file = pd.ExcelFile(io.BytesIO(file))
        sheets_data = {}
        
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            sheets_data[sheet_name] = df.to_dict('records')
        
        # Process the three source sheets
        initial_stock_data = sheets_data.get('INITIAL STOCK', [])
        stock_in_data = sheets_data.get('STOCK IN', [])
        stock_out_data = sheets_data.get('STOCK OUT', [])
        
        if not initial_stock_data:
            raise HTTPException(status_code=400, detail="INITIAL STOCK sheet not found")
        
        # Calculate stock from source data using your existing function
        stock_items = calculate_stock_from_source(
            initial_stock_data, 
            stock_in_data, 
            stock_out_data
        )
        
        # Clear existing products for this branch
        await db.execute(select(Product).where(Product.branch == branch).delete())
        
        logger.info(f"Processed {len(stock_items)} stock items from source data")
        
        # Add new products to database
        for item_data in stock_items:
            # Convert status string to StockStatus enum
            status_enum = StockStatus.CRITICAL if item_data["status"] == "critical" else \
                         StockStatus.LOW if item_data["status"] == "low" else StockStatus.OKAY
            
            product = Product(
                name=item_data["name"],
                category=item_data["category"],
                quantity=item_data["balance"],
                unit=UnitType.SACKS,
                branch=branch,
                min_stock=5,
                status=status_enum
            )
            db.add(product)
        
        await db.commit()
        
        return {
            "message": "Excel data processed successfully", 
            "items_processed": len(stock_items),
            "branch": branch.value
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error processing Excel data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing Excel data: {str(e)}")

@app.get("/api/stock/categories")
async def get_stock_categories(db: AsyncSession = Depends(get_db)):
    """
    Get all unique stock categories
    """
    try:
        result = await db.execute(
            select(Product.category).distinct().order_by(Product.category)
        )
        categories = result.scalars().all()
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@app.get("/api/stock/low-stock")
async def get_low_stock_items(db: AsyncSession = Depends(get_db)):
    """
    Get items with low or critical stock status
    """
    try:
        result = await db.execute(
            select(Product).filter(
                Product.status.in_([StockStatus.LOW, StockStatus.CRITICAL])
            ).order_by(Product.quantity)
        )
        low_stock_items = result.scalars().all()
        return low_stock_items
    except Exception as e:
        logger.error(f"Error fetching low stock items: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching low stock items: {str(e)}")



@app.post("/api/stock/movement")
async def record_stock_movement(
    movement_data: StockMovementRequest,
    db: AsyncSession = Depends(get_db)
):
    """Record stock movement"""
    try:
        result = await db.execute(select(Product).where(Product.id == movement_data.product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Convert string to enum for movement type
        if movement_data.movement_type.lower() == "in":
            movement_type_enum = MovementType.IN
            # Stock IN: External → Store (no target_branch needed)
            if movement_data.target_branch:
                raise HTTPException(status_code=400, detail="Stock IN should not have target_branch - it goes to main store")
            movement_branch = "External"
            
        elif movement_data.movement_type.lower() == "out":
            movement_type_enum = MovementType.OUT
            # Stock OUT: Store → Branch (target_branch required)
            if not movement_data.target_branch:
                raise HTTPException(status_code=400, detail="target_branch is required for stock out")
            
            # BRANCH VALIDATION: Only allow valid branches (not Main Store)
            valid_branches = [branch.value for branch in BranchType if branch != BranchType.STORE]
            if movement_data.target_branch not in valid_branches:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid branch. Must be one of: {', '.join(valid_branches)}"
                )
            # PREVENT Stock OUT to Main Store
            if movement_data.target_branch == "Main Store":
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot issue stock to Main Store. Stock OUT must go to branches only."
                )
    
            # CRITICAL: Only allow stock OUT from Main Store (ALREADY IMPLEMENTED!)
            if product.branch != BranchType.STORE:
                raise HTTPException(status_code=400, detail="Can only issue stock from main store")
            movement_branch = movement_data.target_branch
            
        else:
            raise HTTPException(status_code=400, detail="movement_type must be 'in' or 'out'")
        
        # Convert quantity to Decimal
        quantity_decimal = Decimal(str(movement_data.quantity))
        
        # Update stock quantity
        old_quantity = product.quantity
        if movement_type_enum == MovementType.IN:
            product.quantity += quantity_decimal
        else:
            if product.quantity < quantity_decimal:
                raise HTTPException(status_code=400, detail="Insufficient stock in store")
            product.quantity -= quantity_decimal
        
        # Update stock status
        if product.quantity == 0:
            product.status = StockStatus.CRITICAL
        elif product.quantity <= product.min_stock:
            product.status = StockStatus.LOW
        else:
            product.status = StockStatus.OKAY
        
        # Create movement record
        movement = StockMovement(
            product_id=movement_data.product_id,
            type=movement_type_enum,
            quantity=quantity_decimal,
            branch=movement_branch,
            reference=movement_data.reference
        )
        db.add(movement)
        await db.commit()
        await db.refresh(product)
        
        return {
            "message": "Stock movement recorded successfully",
            "movement_id": movement.id,
            "product": {
                "id": product.id,
                "name": product.name,
                "old_quantity": float(old_quantity),
                "new_quantity": float(product.quantity),
                "status": product.status.value,
                "change": f"{float(old_quantity)} → {float(product.quantity)}"
            },
            "movement_details": {
                "type": movement_data.movement_type,
                "quantity": movement_data.quantity,
                "source": "External" if movement_type_enum == MovementType.IN else "Main Store",
                "destination": "Main Store" if movement_type_enum == MovementType.IN else movement_data.target_branch,
                "reference": movement_data.reference
            }
        }
        
    except Exception as e:
        await db.rollback()
        print(f"ERROR: Stock movement failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record stock movement: {str(e)}")


@app.get("/api/stock/alerts")
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
        logger.error(f"Failed to fetch alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stock alerts")

@app.get("/api/stock/reports")
async def get_stock_reports(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    branch: Optional[BranchType] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate stock reports with filters
    """
    try:
        query = select(StockMovement).join(Product)
        
        if start_date:
            query = query.where(StockMovement.movement_date >= start_date)
        if end_date:
            query = query.where(StockMovement.movement_date <= end_date)
        if branch:
            query = query.where(StockMovement.branch == branch.value)
        if category:
            query = query.where(Product.category == category)
        
        result = await db.execute(query)
        movements = result.scalars().all()
        
        return movements
        
    except Exception as e:
        logger.error(f"Failed to generate report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

# Product management endpoints
@app.get("/api/products/", response_model=List[ProductSchema])
async def get_products(db: AsyncSession = Depends(get_db)):
    """Get all products"""
    result = await db.execute(select(Product))
    return result.scalars().all()

@app.post("/api/products/", response_model=ProductSchema)
async def create_product(product_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new product"""
    try:
        # Convert the incoming dict to your Product model
        product = Product(
            name=product_data["name"],
            category=product_data["category"],
            quantity=product_data["quantity"],
            unit=UnitType(product_data["unit"]),
            min_stock=product_data.get("min_stock", 5)
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)
        return product
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating product: {str(e)}")


# Excel processing functions - Simplified version
def process_excel_data(df: pd.DataFrame) -> List[Dict]:
    """
    Process the Excel data structure to extract stock information
    Based on your .xlsx format
    """
    stock_items = []
    section_headers = find_section_headers(df)
    
    if not section_headers:
        return stock_items
    
    # Sort sections by their row index
    sorted_sections = sorted(section_headers.items(), key=lambda x: x[1])
    
    # Process each section with the same logic
    for i, (section_name, start_idx) in enumerate(sorted_sections):
        # Determine the end index
        end_idx = sorted_sections[i + 1][1] if i + 1 < len(sorted_sections) else len(df)
        
        # Extract section data
        section_data = extract_section_data(df, start_idx, end_idx)
        
        # Process ALL sections with the same function
        process_section_data(section_data, section_name, stock_items)
    
    return stock_items

def find_section_headers(df: pd.DataFrame) -> Dict[str, int]:
    """Find all section headers in the Excel file"""
    sections = {}
    # Define all your section names
    section_names = [
        "BALLS", "HANDLES", "BASES", "BUSHES", "CAST", "ARROWS", "SQUARES", 
        "BUTTERFLIES", "DAMRU", "GURJI", "BASKETS", "MINARS", "CHILLAMS", 
        "KONJI", "CURTAIN ACCESSORIES", "SPRAYS", "ROLLERS", "FLOWERS"
    ]
    
    for idx, row in df.iterrows():
        first_cell = row.iloc[0] if len(row) > 0 else None
        if pd.notna(first_cell):
            cell_text = str(first_cell).strip().upper()
            for section_name in section_names:
                if section_name in cell_text and cell_text.startswith(section_name):
                    sections[section_name] = idx
                    break
    
    return sections

def extract_section_data(df: pd.DataFrame, start_idx: int, end_idx: int) -> pd.DataFrame:
    """Extract data for a specific section using defined boundaries"""
    data_start = start_idx + 2  # Skip section header and column labels
    if data_start >= end_idx:
        return pd.DataFrame()
    return df.iloc[data_start:end_idx].reset_index(drop=True)

def process_section_data(section_data: pd.DataFrame, section_name: str, stock_items: List[Dict]):
    """Process any section using the same logic"""
    for _, row in section_data.iterrows():
        if pd.notna(row.iloc[0]) and not str(row.iloc[0]).startswith('='):
            initial = safe_int(row.iloc[1])
            added = safe_int(row.iloc[2])
            issued = safe_int(row.iloc[3])
            balance = initial + added - issued
            
            stock_items.append({
                "name": str(row.iloc[0]).strip(),
                "category": section_name.title(),  # Convert "BALLS" to "Balls"
                "initial": initial,
                "added": added,
                "issued": issued,
                "balance": balance,
                "status": get_stock_status(balance)
            })