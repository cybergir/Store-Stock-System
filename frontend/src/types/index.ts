// =============================================
// ENUMS - Matching your SQLAlchemy enums exactly
// =============================================

export enum UnitType {
  SACKS = 'sacks',
  BOXES = 'boxes'
}

export enum BranchType {
  STORE = 'Main Store',
  BRANCH1 = 'Gikomba',
  BRANCH2 = 'Kariobangi',
  BRANCH3 = 'Kampala'
}

export enum StockStatus {
  CRITICAL = 'critical',
  LOW = 'low',
  OKAY = 'okay'
}

export enum MovementType {
  IN = 'in',
  OUT = 'out'
}

// =============================================
// PRODUCT TYPES - Matching your Product model
// =============================================

export interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: UnitType;
  branch: BranchType;
  min_stock: number;
  status: StockStatus;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCreate {
  name: string;
  category: string;
  quantity: number;
  unit: UnitType;
  branch: BranchType;
  min_stock: number;
}

export interface ProductUpdate {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: UnitType;
  branch?: BranchType;
  min_stock?: number;
}

// =============================================
// STOCK MOVEMENT TYPES - Matching your StockMovement model
// =============================================

export interface StockMovement {
  id: number;
  product_id: number;
  type: MovementType;
  quantity: number;
  branch: string;
  reference: string | null;
  movement_date: string;
  created_at: string;
  product?: Product; // Joined product data
}

export interface StockMovementCreate {
  product_id: number;
  movement_type: MovementType;
  quantity: number;
  target_branch?: string;
  reference?: string;
}

export interface StockMovementResponse {
  message: string;
  movement_id: number;
  product: {
    id: number;
    name: string;
    old_quantity: number;
    new_quantity: number;
    status: StockStatus;
    change: string;
  };
  movement_details: {
    type: MovementType;
    quantity: number;
    source: string;
    destination: string;
    reference?: string;
  };
}

// =============================================
// STOCK ALERTS & REPORTS
// =============================================

export interface StockAlerts {
  critical: Product[];
  low: Product[];
}

export interface StockSummary {
  total_products: number;
  critical_count: number;
  low_count: number;
  healthy_count: number;
  total_quantity: number;
}

// =============================================
// EXCEL PROCESSING TYPES
// =============================================

export interface ExcelUploadResponse {
  message: string;
  items_processed: number;
  branch: string;
}

export interface ExcelProcessRequest {
  file: File;
  branch: BranchType;
}

export interface ProcessedStockItem {
  name: string;
  category: string;
  initial: number;
  added: number;
  issued: number;
  balance: number;
  status: StockStatus;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CategoriesResponse {
  categories: string[];
}

// =============================================
// FILTER & QUERY TYPES
// =============================================

export interface StockFilters {
  branch?: BranchType;
  category?: string;
  status?: StockStatus;
  min_quantity?: number;
  max_quantity?: number;
}

export interface MovementFilters {
  start_date?: string;
  end_date?: string;
  branch?: BranchType;
  category?: string;
  movement_type?: MovementType;
  product_id?: number;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  branch?: BranchType;
  category?: string;
}

// =============================================
// DASHBOARD & STATISTICS TYPES
// =============================================

export interface DashboardStats {
  total_products: number;
  total_stock_value: number;
  critical_alerts: number;
  low_stock_items: number;
  recent_movements: number;
  categories_count: number;
}

export interface CategorySummary {
  category: string;
  product_count: number;
  total_quantity: number;
  low_stock_count: number;
  critical_stock_count: number;
}

export interface BranchSummary {
  branch: BranchType;
  product_count: number;
  total_quantity: number;
  stock_value: number;
}

// =============================================
// FORM & UI TYPES
// =============================================

export interface ProductFormData {
  name: string;
  category: string;
  quantity: number;
  unit: UnitType;
  branch: BranchType;
  min_stock: number;
}

export interface MovementFormData {
  product_id: number;
  movement_type: MovementType;
  quantity: number;
  target_branch?: BranchType;
  reference?: string;
}

export interface ExcelUploadFormData {
  file: File | null;
  branch: BranchType;
}

// =============================================
// AUTH & USER TYPES (For future expansion)
// =============================================

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  branch?: BranchType;
  created_at: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_in: number;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// =============================================
// ERROR & LOADING TYPES
// =============================================

export interface ApiError {
  message: string;
  code: number;
  details?: any;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

// =============================================
// TABLE & DATA GRID TYPES
// =============================================

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  key: string;
  value: any;
  operator: 'equals' | 'contains' | 'greater' | 'less';
}

// =============================================
// NOTIFICATION & ALERT TYPES
// =============================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
}

export interface StockAlertNotification {
  id: string;
  product_id: number;
  product_name: string;
  type: 'critical' | 'low';
  current_quantity: number;
  min_stock: number;
  branch: BranchType;
  timestamp: string;
}

// =============================================
// EXPORT & IMPORT TYPES
// =============================================

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  include: string[];
  filters?: MovementFilters | StockFilters;
}

export interface ImportResult {
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

// =============================================
// CONSTANTS & CONFIG TYPES
// =============================================

export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
  features: {
    excelImport: boolean;
    stockMovements: boolean;
    reports: boolean;
    multiBranch: boolean;
  };
}

export interface StatusConfig {
  [StockStatus.CRITICAL]: {
    color: string;
    backgroundColor: string;
    label: string;
  };
  [StockStatus.LOW]: {
    color: string;
    backgroundColor: string;
    label: string;
  };
  [StockStatus.OKAY]: {
    color: string;
    backgroundColor: string;
    label: string;
  };
}

// =============================================
// TYPE GUARDS & VALIDATORS
// =============================================

export const isProduct = (obj: any): obj is Product => {
  return obj && 
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.quantity === 'number' &&
    Object.values(UnitType).includes(obj.unit) &&
    Object.values(BranchType).includes(obj.branch) &&
    typeof obj.min_stock === 'number' &&
    Object.values(StockStatus).includes(obj.status);
};

export const isStockMovement = (obj: any): obj is StockMovement => {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.product_id === 'number' &&
    Object.values(MovementType).includes(obj.type) &&
    typeof obj.quantity === 'number' &&
    typeof obj.branch === 'string' &&
    typeof obj.movement_date === 'string';
};

export const isValidBranch = (branch: string): branch is BranchType => {
  return Object.values(BranchType).includes(branch as BranchType);
};

export const isValidUnit = (unit: string): unit is UnitType => {
  return Object.values(UnitType).includes(unit as UnitType);
};

export const isValidMovementType = (type: string): type is MovementType => {
  return Object.values(MovementType).includes(type as MovementType);
};

// =============================================
// UTILITY TYPES
// =============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================
// REACT QUERY SPECIFIC TYPES
// =============================================

export interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
}

// =============================================
// TYPE UTILITIES (For easy imports)
// =============================================

// You can use these for easy imports, or import directly from the file
export type {
  Product as ProductType,
  StockMovement as StockMovementType,
  StockAlerts as StockAlertsType,
};

// Or create a namespace for better organization
// export namespace Types {
//   export import Product = Product;
//   export import ProductCreate = ProductCreate;
//   export import StockMovement = StockMovement;
//   export import StockMovementCreate = StockMovementCreate;
//   export import StockAlerts = StockAlerts;
//   export import UnitType = UnitType;
//   export import BranchType = BranchType;
//   export import StockStatus = StockStatus;
//   export import MovementType = MovementType;
// }