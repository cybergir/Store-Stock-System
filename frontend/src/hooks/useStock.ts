import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../services/api';

export const useStock = () => {
  const queryClient = useQueryClient();

  const currentStockQuery = useQuery({
    queryKey: ['currentStock'],
    queryFn: () => stockApi.getCurrent().then(res => res.data),
  });

  const stockAlertsQuery = useQuery({
    queryKey: ['stockAlerts'],
    queryFn: () => stockApi.getAlerts().then(res => res.data),
  });

  const recordMovementMutation = useMutation({
    mutationFn: stockApi.recordMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
    },
  });

  return {
    currentStock: currentStockQuery.data,
    stockAlerts: stockAlertsQuery.data,
    isLoading: currentStockQuery.isLoading || stockAlertsQuery.isLoading,
    recordMovement: recordMovementMutation.mutate,
    isRecording: recordMovementMutation.isPending,
  };
};

export default useStock;