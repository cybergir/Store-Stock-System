import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, stockApi } from '../services/api';
import { Product, ProductCreate, BranchType, UnitType } from '../types';
import './Products.css';


const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductCreate>({
    name: '',
    category: '',
    quantity: 0,
    unit: UnitType.SACKS,
    branch: BranchType.STORE,
    min_stock: 5
  });

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll().then(res => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => stockApi.getCategories().then(res => res.data.categories),
  });

  const createProduct = useMutation({
    mutationFn: (product: ProductCreate) => productApi.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['currentStock'] });
      setShowCreateForm(false);
      setNewProduct({
        name: '',
        category: '',
        quantity: 0,
        unit: UnitType.SACKS,
        branch: BranchType.STORE,
        min_stock: 5
      });
      alert('Product created successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(newProduct);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Products</h3>
        <p>Failed to load products from server</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Products Management</h1>
            <p>View and manage all products in the system</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Add New Product
          </button>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Product</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="form-input"
                    list="categories"
                    required
                  />
                  <datalist id="categories">
                    {categories?.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Initial Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.quantity}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit *</label>
                  <select 
                    value={newProduct.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value as UnitType)}
                    className="form-select"
                    required
                  >
                    <option value={UnitType.SACKS}>Sacks</option>
                    <option value={UnitType.BOXES}>Boxes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Minimum Stock *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.min_stock}
                    onChange={(e) => handleInputChange('min_stock', parseFloat(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending}
                  className="btn-primary"
                >
                  {createProduct.isPending ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="products-table-container">
        <div className="table-header">
          <h3>All Products ({products?.length || 0})</h3>
        </div>
        
        {products && products.length > 0 ? (
          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: Product) => (
                  <tr key={product.id}>
                    <td className="product-name">{product.name}</td>
                    <td className="product-category">{product.category}</td>
                    <td className="product-quantity">
                      <div className="quantity-value">{product.quantity}</div>
                      {product.quantity <= product.min_stock && (
                        <div className="quantity-warning">
                          Below minimum!
                        </div>
                      )}
                    </td>
                    <td className="product-unit">{product.unit}</td>
                    <td className="min-stock">{product.min_stock}</td>
                    <td className="product-status">
                      <span className={`status-badge ${product.status}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="updated-at">
                      {new Date(product.updated_at || product.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-products">
            <p>No products found. Create your first product to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;