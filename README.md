
# Store Management System

A robust, full-featured Store Management System built with FastAPI, featuring real-time stock tracking, multi-branch support, and automated alerts.

## Features

### Core Functionality
- **Product Management** - Add, view, and manage products
- **Stock Tracking** - Real-time inventory management
- **Multi-Branch Support** - Gikomba, Kariobangi, Kampala branches
- **Automated Alerts** - Critical, Low, and Okay stock status
- **Movement History** - Complete audit trail of all stock movements

### Technical Features
- **RESTful API** with automatic OpenAPI documentation
- **SQLite Database** with SQLAlchemy ORM
- **Data Validation** with Pydantic schemas
- **Error Handling** with proper HTTP status codes
- **Type Safety** with Python type hints

## API Endpoints

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create new product
- `GET /api/products/{id}` - Get product details

### Stock Management
- `POST /api/stock/movement` - Record stock IN/OUT
- `GET /api/stock/current` - Get current stock levels
- `GET /api/stock/alerts` - Get critical/low stock alerts
- `GET /api/stock/low-stock` - Get low stock items only

### System
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

## Installation & Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access the Application
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Usage Examples

### Create a Product
```bash
curl -X 'POST' \
  'http://localhost:8000/api/products/' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Cement",
  "category": "Construction",
  "quantity": 100,
  "unit": "SACKS",
  "branch": "STORE",
  "min_stock": 5
}'
```
