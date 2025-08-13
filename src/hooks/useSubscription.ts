import { useState, useEffect } from 'react';
import { subscriptionService, UsageInfo } from '../services/subscriptionService';

export const useSubscription = () => {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const usageData = await subscriptionService.getUsageInfo();
      setUsage(usageData);
    } catch (err) {
      setError('Failed to load usage information');
      console.error('Usage fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const refreshUsage = () => {
    fetchUsage();
  };

  // Convert backend tiers to frontend tiers
  const getCurrentTier = (): 'standard' | 'pro' | 'elite' => {
    if (!usage) return 'standard';
    
    switch (usage.tier) {
      case 'Legend':
        return 'pro';
      case 'VIP':
        return 'elite';
      default:
        return 'standard';
    }
  };

  // Convert usage data to the format expected by WalletCard
  const getUsageForWallet = () => {
    if (!usage) return null; // Return null instead of mock data

    return {
      gpt4o: usage.responseUsage.used,
      gpt5: usage.gpt5Usage.used,
      gpt5Limit: typeof usage.gpt5Usage.limit === 'number' ? usage.gpt5Usage.limit : undefined
    };
  };

  return {
    usage,
    loading,
    error,
    refreshUsage,
    currentTier: getCurrentTier(),
    walletUsage: getUsageForWallet(),
    hasRealData: !!usage // Flag to indicate if we have real data
  };
};