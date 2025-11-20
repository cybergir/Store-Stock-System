import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi, productApi } from '../services/api';
import { StockMovementCreate, BranchType, MovementType } from '../types';
import './StockManagement.css';


const StockManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [branch, setBranch] = useState<string>(BranchType.STORE);
  const [movementForm, setMovementForm] = useState({
    productId: '',
    movementType: MovementType.IN,
    quantity: '',
    targetBranch: '',
    reference: ''
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll().then(res => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => stockApi.getCategories().then(res => res.data.categories),
  });

  const { data: currentStock } = useQuery({
    queryKey: ['currentStock'],
    queryFn: () => stockApi.getCurrent().then(res => res.data),
  });

  const uploadExcel = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected');
      return stockApi.processExcel(selectedFile, branch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Excel processed successfully!');
      setSelectedFile(null);
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  });

  const recordMovement = useMutation({
    mutationFn: (movement: StockMovementCreate) =>
      stockApi.recordMovement(movement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
      alert('Stock movement recorded successfully!');
      setMovementForm({
        productId: '',
        movementType: MovementType.IN,
        quantity: '',
        targetBranch: '',
        reference: ''
      });
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  });

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!movementForm.productId || !movementForm.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    const movementData: StockMovementCreate = {
      product_id: parseInt(movementForm.productId),
      movement_type: movementForm.movementType === MovementType.IN ? MovementType.IN : MovementType.OUT,
      quantity: parseFloat(movementForm.quantity),
      reference: movementForm.reference || undefined,
    };

    if (movementForm.movementType === MovementType.OUT) {
      if (!movementForm.targetBranch) {
        alert('Target branch is required for stock out');
        return;
      }
      movementData.target_branch = movementForm.targetBranch;
    }

    recordMovement.mutate(movementData);
  };

  const handleInputChange = (field: string, value: string) => {
    setMovementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="stock-management">
      <div className="page-header">
        <h1>📦 Stock Management</h1>
        <p>Manage stock movements and upload Excel data</p>
      </div>

      <div className="management-grid">
        {/* Excel Upload Section */}
        <section className="upload-section">
          <div className="section-card">
            <h2>Upload Excel File</h2>
            <p className="section-description">
              Upload your SOLAI STOCK.xlsx file with INITIAL STOCK, STOCK IN, and STOCK OUT sheets
            </p>

            <div className="upload-form">
              <div className="form-group">
                <label>Select Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="form-select"
                >
                  {Object.values(BranchType).map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="file-input"
                />
              </div>

              <button
                onClick={() => uploadExcel.mutate()}
                disabled={!selectedFile || uploadExcel.isPending}
                className="btn-primary upload-btn"
              >
                {uploadExcel.isPending ? 'Processing...' : 'Upload Excel'}
              </button>
            </div>
          </div>
        </section>

        {/* Stock Movement Section */}
        <section className="movement-section">
          <div className="section-card">
            <h2>Record Stock Movement</h2>
            <p className="section-description">
              Record stock movements (IN from external sources, OUT to branches)
            </p>

            <form onSubmit={handleMovementSubmit} className="movement-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product *</label>
                  <select
                    value={movementForm.productId}
                    onChange={(e) => handleInputChange('productId', e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select a product</option>
                    {products?.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.quantity} {product.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Movement Type *</label>
                  <select
                    value={movementForm.movementType}
                    onChange={(e) => handleInputChange('movementType', e.target.value as MovementType)}
                    className="form-select"
                    required
                  >
                    <option value={MovementType.IN}>Stock IN (External → Store)</option>
                    <option value={MovementType.OUT}>Stock OUT (Store → Branch)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={movementForm.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className="form-input"
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                {movementForm.movementType === MovementType.OUT && (
                  <div className="form-group">
                    <label>Target Branch *</label>
                    <select
                      value={movementForm.targetBranch}
                      onChange={(e) => handleInputChange('targetBranch', e.target.value)}
                      className="form-select"
                      required={movementForm.movementType === MovementType.OUT}
                    >
                      <option value="">Select target branch</option>
                      {Object.values(BranchType)
                        .filter(b => b !== BranchType.STORE)
                        .map(branch => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))
                      }
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Reference (Optional)</label>
                <input
                  type="text"
                  value={movementForm.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  className="form-input"
                  placeholder="Invoice number, note, etc."
                />
              </div>

              <button
                type="submit"
                disabled={recordMovement.isPending}
                className="btn-primary submit-btn"
              >
                {recordMovement.isPending ? '⏳ Recording...' : 'Record Movement'}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Current Stock Overview */}
      <section className="overview-section">
        <div className="section-card">
          <h2>📋 Current Stock Overview</h2>
          <div className="stock-summary">
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-label">Total Products</span>
                <span className="stat-value">{currentStock?.length || 0}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Total Quantity</span>
                <span className="stat-value">
                  {currentStock?.reduce((sum, product) => sum + product.quantity, 0) || 0}
                </span>
              </div>
            </div>
          </div>

          {currentStock && currentStock.length > 0 && (
            <div className="quick-stock-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStock.slice(0, 5).map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.quantity} {product.unit}</td>
                      <td>{product.branch}</td>
                      <td>
                        <span className={`status-badge ${product.status}`}>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentStock.length > 5 && (
                <p className="table-note">Showing 5 of {currentStock.length} products</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StockManagement;
