import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../../services/api';
import { Product, StockAlerts as StockAlertsType } from '../../types';

interface StockAlertsProps {
  maxItems?: number;
  showOnly?: 'critical' | 'low' | 'all';
}

const StockAlerts: React.FC<StockAlertsProps> = ({ 
  maxItems = 10,
  showOnly = 'all'
}) => {
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: () => stockApi.getAlerts().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Failed to load stock alerts</p>
      </div>
    );
  }

  if (!alerts) {
    return (
      <div className="p-4 text-center text-gray-500">
        No alert data available
      </div>
    );
  }

  const criticalAlerts = showOnly === 'all' || showOnly === 'critical' ? alerts.critical : [];
  const lowAlerts = showOnly === 'all' || showOnly === 'low' ? alerts.low : [];

  const displayCriticalAlerts = criticalAlerts.slice(0, maxItems);
  const displayLowAlerts = lowAlerts.slice(0, maxItems);

  const hasAlerts = criticalAlerts.length > 0 || lowAlerts.length > 0;

  if (!hasAlerts) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-green-700 font-medium">✅ All stock levels are good!</p>
        <p className="text-green-600 text-sm mt-1">No critical or low stock alerts</p>
      </div>
    );
  }

  const AlertItem: React.FC<{ product: Product; type: 'critical' | 'low' }> = ({ product, type }) => (
    <div className={`p-3 border rounded-lg ${
      type === 'critical' 
        ? 'bg-red-50 border-red-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-600">
            {product.quantity} {product.unit} • {product.branch}
          </p>
          <p className={`text-sm font-medium ${
            type === 'critical' ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {type === 'critical' ? 'CRITICAL STOCK' : 'LOW STOCK'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          type === 'critical' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {type}
        </span>
      </div>
    </div>
  );

  return (
    <div className="stock-alerts">
      {criticalAlerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <h3 className="text-lg font-semibold text-red-700">
              Critical Stock ({criticalAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {displayCriticalAlerts.map((product: Product) => (
              <AlertItem key={product.id} product={product} type="critical" />
            ))}
          </div>
          {criticalAlerts.length > maxItems && (
            <p className="text-sm text-gray-500 mt-2">
              +{criticalAlerts.length - maxItems} more critical items
            </p>
          )}
        </div>
      )}

      {lowAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <h3 className="text-lg font-semibold text-yellow-700">
              Low Stock ({lowAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {displayLowAlerts.map((product: Product) => (
              <AlertItem key={product.id} product={product} type="low" />
            ))}
          </div>
          {lowAlerts.length > maxItems && (
            <p className="text-sm text-gray-500 mt-2">
              +{lowAlerts.length - maxItems} more low stock items
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlerts;