import { api } from './apiModules';

export interface UsageInfo {
  tier: 'Standard' | 'Legend' | 'VIP';
  responseUsage: {
    used: number;
    limit: number | string;
    remaining: number;
    isUnlimited: boolean;
    periodStart: string;
    periodEnd: string;
  };
  gpt5Usage: {
    used: number;
    limit: number | string;
    remaining: number;
    isUnlimited: boolean;
  };
  subscription: {
    status: string;
    tier: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  upgradeRecommended: boolean;
}

export interface TierInfo {
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    responses: number | string;
    gpt5: number | string;
  };
  popular?: boolean;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

class SubscriptionService {
  async getUsageInfo(): Promise<UsageInfo> {
    try {
      const response = await api.get('/api/subscription/usage');
      return response.data;
    } catch (error) {
      console.error('Failed to get usage info:', error);
      throw error;
    }
  }

  async getTiers(): Promise<{ tiers: TierInfo[] }> {
    try {
      const response = await api.get('/api/subscription/tiers');
      return response.data;
    } catch (error) {
      console.error('Failed to get tiers:', error);
      throw error;
    }
  }

  async createCheckoutSession(tier: 'Legend' | 'VIP'): Promise<CheckoutResponse> {
    try {
      const response = await api.post('/api/subscription/checkout', { tier });
      return response.data;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  async getSubscriptionDetails(): Promise<{ subscription: any }> {
    try {
      const response = await api.get('/api/subscription/details');
      return response.data;
    } catch (error) {
      console.error('Failed to get subscription details:', error);
      throw error;
    }
  }

  async cancelSubscription(): Promise<{ success: boolean }> {
    try {
      const response = await api.post('/api/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Helper method to open checkout in browser
  async initiatePayment(tier: 'Legend' | 'VIP'): Promise<void> {
    try {
      const checkout = await this.createCheckoutSession(tier);
      
      // For React Native, we need to use Linking to open the browser
      const { Linking } = await import('react-native');
      const canOpen = await Linking.canOpenURL(checkout.checkoutUrl);
      
      if (canOpen) {
        await Linking.openURL(checkout.checkoutUrl);
      } else {
        throw new Error('Cannot open payment URL');
      }
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;