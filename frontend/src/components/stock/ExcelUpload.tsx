import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../../services/api';
import { BranchType } from '../../types';

interface ExcelUploadProps {
  onSuccess?: () => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [branch, setBranch] = useState<BranchType>(BranchType.STORE);

  const uploadExcel = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected');
      return stockApi.processExcel(selectedFile, branch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedFile(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  return (
    <div className="excel-upload">
      <h3 className="text-lg font-semibold mb-4">Upload Excel File</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Branch
          </label>
          <select 
            value={branch}
            onChange={(e) => setBranch(e.target.value as BranchType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(BranchType).map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload SOLAI STOCK.xlsx with INITIAL STOCK, STOCK IN, and STOCK OUT sheets
          </p>
        </div>

        <button
          onClick={() => uploadExcel.mutate()}
          disabled={!selectedFile || uploadExcel.isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploadExcel.isPending ? '📤 Processing...' : '📤 Upload Excel'}
        </button>
      </div>

      {uploadExcel.isError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            Error: {uploadExcel.error?.response?.data?.detail || 'Failed to upload file'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;