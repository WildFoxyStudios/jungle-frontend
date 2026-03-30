import { api } from "./api";

export interface CreatorProfile {
  user_id: string;
  is_active: boolean;
  subscription_price: string;
  bio?: string;
  welcome_message?: string;
  total_earnings: string;
  total_subscribers: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  status: "active" | "cancelled" | "expired";
  price_paid: string;
  currency: string;
  is_free: boolean;
  auto_renew: boolean;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithCreator {
  subscription: Subscription;
  creator_name: string;
  creator_picture?: string;
  creator_bio?: string;
}

export interface SubscriberInfo {
  subscription: Subscription;
  subscriber_name: string;
  subscriber_picture?: string;
}

export interface StreamTip {
  id: string;
  stream_id: string;
  sender_id: string;
  creator_id: string;
  amount: string;
  platform_fee: string;
  creator_earnings: string;
  message?: string;
  display_name: string;
  created_at: string;
}

export interface EarningEntry {
  id: string;
  earning_type: "subscription" | "tip" | "post_purchase" | "stream_tip";
  amount: string;
  from_user_name?: string;
  description?: string;
  created_at: string;
}

export interface CreatorEarnings {
  total_earnings: string;
  total_subscribers: number;
  total_tips: string;
  total_post_sales: string;
  total_stream_tips: string;
  total_subscription_revenue: string;
  recent_transactions: EarningEntry[];
}

export const monetizationApi = {
  // Creator Profile
  getCreatorProfile: async (userId: string) => {
    return api.get<CreatorProfile>(`/monetization/creator-profile/${userId}`);
  },

  updateCreatorProfile: async (data: {
    subscription_price?: number;
    bio?: string;
    welcome_message?: string;
    is_active?: boolean;
  }) => {
    return api.put<CreatorProfile>("/monetization/creator-profile", data);
  },

  // Subscriptions
  subscribe: async (creatorId: string) => {
    return api.post<Subscription>("/monetization/subscribe", { creator_id: creatorId });
  },

  unsubscribe: async (creatorId: string) => {
    return api.post<{ message: string }>("/monetization/unsubscribe", { creator_id: creatorId });
  },

  isSubscribed: async (creatorId: string) => {
    return api.get<{ is_subscribed: boolean }>(`/monetization/is-subscribed/${creatorId}`);
  },

  getMySubscriptions: async () => {
    return api.get<SubscriptionWithCreator[]>("/monetization/subscriptions");
  },

  getMySubscribers: async () => {
    return api.get<SubscriberInfo[]>("/monetization/subscribers");
  },

  // Post Purchases
  purchasePost: async (postId: string) => {
    return api.post(`/monetization/purchase/${postId}`, {});
  },

  hasPurchasedPost: async (postId: string) => {
    return api.get<{ has_purchased: boolean }>(`/monetization/has-purchased/${postId}`);
  },

  // Tips
  sendTip: async (creatorId: string, amount: number, postId?: string, message?: string) => {
    return api.post(`/monetization/tip/${creatorId}`, { amount, post_id: postId, message });
  },

  // Stream Tips
  sendStreamTip: async (streamId: string, amount: number, message?: string) => {
    return api.post<StreamTip>(`/monetization/stream-tip/${streamId}`, { amount, message });
  },

  getStreamTips: async (streamId: string) => {
    return api.get<StreamTip[]>(`/monetization/stream-tips/${streamId}`);
  },

  // Stream Access
  checkOrGrantStreamAccess: async (streamId: string) => {
    return api.post(`/monetization/stream-access/${streamId}`, {});
  },

  // Earnings
  getCreatorEarnings: async () => {
    return api.get<CreatorEarnings>("/monetization/earnings");
  },
};
