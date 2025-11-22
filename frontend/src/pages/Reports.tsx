import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../services/api';
import { StockMovement, BranchType } from '../types';
import './Reports.css';


const Reports: React.FC = () => {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    branch: '',
    category: ''
  });

  const { data: movements, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => stockApi.getReports(filters).then(res => res.data),
    enabled: false
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => stockApi.getCategories().then(res => res.data.categories),
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      branch: '',
      category: ''
    });
  };

  const exportToCSV = () => {
    if (!movements || movements.length === 0) return;

    const headers = ['Date', 'Product', 'Type', 'Quantity', 'Branch', 'Reference'];
    const csvData = movements.map(movement => [
      new Date(movement.movement_date).toLocaleDateString(),
      movement.product?.name || 'N/A',
      movement.type,
      movement.quantity,
      movement.branch,
      movement.reference || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate and export stock reports</p>
      </div>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="section-card">
          <h2>🔍 Filter Reports</h2>
          <form onSubmit={handleGenerateReport} className="filters-form">
            <div className="filters-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Branch</label>
                <select 
                  value={filters.branch}
                  onChange={(e) => handleFilterChange('branch', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Branches</option>
                  {Object.values(BranchType).map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Categories</option>
                  {categories?.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? '⏳ Generating...' : '📈 Generate Report'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section">
        <div className="section-card">
          <div className="results-header">
            <h2>Generated Report</h2>
            {movements && movements.length > 0 && (
              <button
                onClick={exportToCSV}
                className="btn-secondary"
              >
                Export CSV
              </button>
            )}
          </div>

          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Generating report...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error Generating Report</h3>
              <p>Failed to load report data</p>
            </div>
          )}

          {movements && !isLoading && (
            <>
              <div className="report-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Movements</span>
                  <span className="summary-value">{movements.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Stock IN</span>
                  <span className="summary-value">
                    {movements.filter(m => m.type === 'in').length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Stock OUT</span>
                  <span className="summary-value">
                    {movements.filter(m => m.type === 'out').length}
                  </span>
                </div>
              </div>

              {movements.length > 0 ? (
                <div className="table-container">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Branch</th>
                        <th>Reference</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((movement: StockMovement) => (
                        <tr key={movement.id}>
                          <td className="movement-date">
                            {new Date(movement.movement_date).toLocaleDateString()}
                          </td>
                          <td className="product-name">
                            {movement.product?.name || 'N/A'}
                          </td>
                          <td className="movement-type">
                            <span className={`type-badge ${movement.type}`}>
                              {movement.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="movement-quantity">
                            {movement.quantity}
                          </td>
                          <td className="movement-branch">
                            {movement.branch}
                          </td>
                          <td className="movement-reference">
                            {movement.reference || '-'}
                          </td>
                          <td className="movement-time">
                            {new Date(movement.movement_date).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">
                  <p>No movements found for the selected filters.</p>
                </div>
              )}
            </>
          )}

          {!movements && !isLoading && !error && (
            <div className="no-data">
              <p>Use the filters above to generate a stock movement report.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;