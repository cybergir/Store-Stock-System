import axios from 'axios';
import { Product, ProductCreate, StockMovement, StockMovementCreate, StockAlerts, ExcelUploadResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const healthCheck = () => api.get('/health');

// Product endpoints - exact match to your backend
export const productApi = {
  getAll: () => api.get<Product[]>('/products/'),
  create: (product: ProductCreate) => api.post<Product>('/products/', product),
};

// Stock endpoints - exact match to your backend
export const stockApi = {
  // GET /api/stock/current
  getCurrent: () => api.get<Product[]>('/stock/current'),
  
  // GET /api/stock/alerts  
  getAlerts: () => api.get<StockAlerts>('/stock/alerts'),
  
  // GET /api/stock/low-stock
  getLowStock: () => api.get<Product[]>('/stock/low-stock'),
  
  // POST /api/stock/movement
  recordMovement: (movement: StockMovementCreate) => 
    api.post('/stock/movement', movement),
  
  // GET /api/stock/categories
  getCategories: () => api.get<{categories: string[]}>('/stock/categories'),
  
  // GET /api/stock/reports
  getReports: (params?: {
    start_date?: string;
    end_date?: string;
    branch?: string;
    category?: string;
  }) => api.get<StockMovement[]>('/stock/reports', { params }),
  
  // POST /api/stock/process-excel
  processExcel: (file: File, branch: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ExcelUploadResponse>('/stock/process-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { branch }
    });
  },
};

export default api;