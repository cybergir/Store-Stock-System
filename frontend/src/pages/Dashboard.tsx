import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { stockApi, productApi } from '../services/api';
import { Product, StockAlerts } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: currentStock, isLoading: stockLoading, error: stockError } = useQuery({
    queryKey: ['currentStock'],
    queryFn: () => stockApi.getCurrent().then(res => res.data),
  });

  const { data: stockAlerts, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: () => stockApi.getAlerts().then(res => res.data),
  });

  const { data: allProducts, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => productApi.getAll().then(res => res.data),
  });

  if (stockLoading || alertsLoading || productsLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading data from backend...</p>
      </div>
    );
  }

  if (stockError || alertsError || productsError) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Connection Error</h3>
        <p>Cannot connect to backend API</p>
        <small>Make sure your FastAPI server is running on http://localhost:8000</small>
      </div>
    );
  }

  const criticalCount = stockAlerts?.critical.length || 0;
  const lowCount = stockAlerts?.low.length || 0;
  const totalProducts = allProducts?.length || 0;
  const healthyCount = totalProducts - criticalCount - lowCount;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Solai Store System</h1>
            <p>Stock management for sacks and boxes</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => navigate('/stock')}
              className="btn-primary"
            >
              Stock Management
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="btn-secondary"
            >
              Products
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Stock Alerts Section */}
        <section className="alerts-section">
          <h2>🚨 Stock Alerts</h2>
          {stockAlerts && (stockAlerts.critical.length > 0 || stockAlerts.low.length > 0) ? (
            <div className="alerts-grid">
              {stockAlerts.critical.length > 0 && (
                <div className="critical-alerts">
                  <h3>Critical Stock (0 items)</h3>
                  <div className="alerts-list">
                    {stockAlerts.critical.map((product: Product) => (
                      <AlertCard key={product.id} product={product} type="critical" />
                    ))}
                  </div>
                </div>
              )}
              
              {stockAlerts.low.length > 0 && (
                <div className="low-alerts">
                  <h3>Low Stock (Below 5)</h3>
                  <div className="alerts-list">
                    {stockAlerts.low.map((product: Product) => (
                      <AlertCard key={product.id} product={product} type="low" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-alerts">
              <p>✅ All stock levels are good! No alerts.</p>
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <StatCard 
              title="Total Products" 
              value={totalProducts}
              color="blue"
              icon="📦"
            />
            <StatCard 
              title="Critical Alerts" 
              value={criticalCount}
              color="red"
              icon="🚨"
            />
            <StatCard 
              title="Low Stock" 
              value={lowCount}
              color="yellow"
              icon="⚠️"
            />
            <StatCard 
              title="Healthy Stock" 
              value={healthyCount}
              color="green"
              icon="✅"
            />
          </div>
        </section>

        {/* Current Stock Table */}
        <section className="stock-section">
          <div className="section-header">
            <h2>📦 Current Stock</h2>
            <span className="product-count">{currentStock?.length || 0} products total</span>
          </div>
          
          {currentStock && currentStock.length > 0 ? (
            <div className="table-container">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStock.map((product: Product) => (
                    <tr key={product.id} className="table-row">
                      <td className="product-name">{product.name}</td>
                      <td className="product-category">{product.category}</td>
                      <td className="product-quantity">
                        <div>{product.quantity} {product.unit}</div>
                        <small>Min: {product.min_stock}</small>
                      </td>
                      <td className="product-branch">{product.branch}</td>
                      <td className="product-status">
                        <StatusBadge status={product.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>No products found in the system.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

// Helper Components
const AlertCard: React.FC<{ product: Product; type: 'critical' | 'low' }> = ({ product, type }) => {
  return (
    <div className={`alert-card ${type}`}>
      <div className="alert-content">
        <div>
          <h4>{product.name}</h4>
          <p className="product-info">
            {product.quantity} {product.unit} • {product.branch}
          </p>
          <p className="alert-type">{type === 'critical' ? 'CRITICAL STOCK' : 'LOW STOCK'}</p>
        </div>
        <span className={`alert-badge ${type}`}>
          {type}
        </span>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: 'critical' | 'low' | 'okay' }> = ({ status }) => {
  return (
    <span className={`status-badge ${status}`}>
      {status}
    </span>
  );
};

const StatCard: React.FC<{ title: string; value: number; color: string; icon: string }> = ({ 
  title, value, color, icon 
}) => {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <dt>{title}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
};

export default Dashboard;