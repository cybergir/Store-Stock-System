import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi, productApi } from '../../services/api';
import { StockMovementCreate, Product, BranchType, MovementType } from '../../types';

interface StockMovementProps {
  onSuccess?: () => void;
}

const StockMovement: React.FC<StockMovementProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();
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

  const recordMovement = useMutation({
    mutationFn: (movement: StockMovementCreate) => 
      stockApi.recordMovement(movement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
      setMovementForm({
        productId: '',
        movementType: MovementType.IN,
        quantity: '',
        targetBranch: '',
        reference: ''
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setMovementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movementForm.productId || !movementForm.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    const movementData: StockMovementCreate = {
      product_id: parseInt(movementForm.productId),
      movement_type: movementForm.movementType,
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

  const selectedProduct = products?.find(p => p.id === parseInt(movementForm.productId));

  return (
    <div className="stock-movement">
      <h3 className="text-lg font-semibold mb-4">Record Stock Movement</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select 
              value={movementForm.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a product</option>
              {products?.map((product: Product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.quantity} {product.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type *
            </label>
            <select 
              value={movementForm.movementType}
              onChange={(e) => handleInputChange('movementType', e.target.value as MovementType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={MovementType.IN}>Stock IN (External → Store)</option>
              <option value={MovementType.OUT}>Stock OUT (Store → Branch)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              step="0.01"
              value={movementForm.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quantity"
              required
            />
          </div>

          {movementForm.movementType === MovementType.OUT && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Branch *
              </label>
              <select 
                value={movementForm.targetBranch}
                onChange={(e) => handleInputChange('targetBranch', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference (Optional)
          </label>
          <input
            type="text"
            value={movementForm.reference}
            onChange={(e) => handleInputChange('reference', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Invoice number, note, etc."
          />
        </div>

        {selectedProduct && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Current stock: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong> • 
              Min stock: <strong>{selectedProduct.min_stock}</strong> • 
              Status: <span className={`font-medium ${
                selectedProduct.status === 'critical' ? 'text-red-600' :
                selectedProduct.status === 'low' ? 'text-yellow-600' :
                'text-green-600'
              }`}>{selectedProduct.status}</span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={recordMovement.isPending}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {recordMovement.isPending ? '⏳ Recording...' : '✅ Record Movement'}
        </button>
      </form>

      {recordMovement.isError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            Error: {recordMovement.error?.response?.data?.detail || 'Failed to record movement'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StockMovement;