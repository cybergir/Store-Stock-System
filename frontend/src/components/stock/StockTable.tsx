import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../../services/api';
import { Product, BranchType, StockStatus } from '../../types';

interface StockTableProps {
  branchFilter?: BranchType | 'all';
  categoryFilter?: string;
  statusFilter?: StockStatus | 'all';
  maxItems?: number;
}

const StockTable: React.FC<StockTableProps> = ({
  branchFilter = 'all',
  categoryFilter = 'all',
  statusFilter = 'all',
  maxItems
}) => {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['currentStock'],
    queryFn: () => stockApi.getCurrent().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading stock data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Failed to load stock data</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No stock data available</p>
      </div>
    );
  }

  // Filter products based on props
  const filteredProducts = products.filter((product: Product) => {
    const branchMatch = branchFilter === 'all' || product.branch === branchFilter;
    const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || product.status === statusFilter;
    
    return branchMatch && categoryMatch && statusMatch;
  });

  const displayProducts = maxItems ? filteredProducts.slice(0, maxItems) : filteredProducts;

  const StatusBadge: React.FC<{ status: StockStatus }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'critical' 
        ? 'bg-red-100 text-red-800'
        : status === 'low'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-green-100 text-green-800'
    }`}>
      {status}
    </span>
  );

  return (
    <div className="stock-table">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayProducts.map((product: Product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{product.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {product.quantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.branch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.min_stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={product.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No products match the current filters</p>
        </div>
      )}

      {maxItems && filteredProducts.length > maxItems && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Showing {maxItems} of {filteredProducts.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default StockTable;