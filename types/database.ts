export type UserRole = 'owner' | 'staff';

export type LoyaltyCardStatus = 'active' | 'reward_available' | 'inactive';

export type LoyaltyAction =
  | 'stamp_added'
  | 'reward_unlocked'
  | 'reward_redeemed'
  | 'adjustment';

export type RewardStatus = 'available' | 'redeemed' | 'expired';

export type WalletProvider = 'apple' | 'google';

export type WalletCardStatus = 'active' | 'revoked' | 'failed';

export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  business_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  qr_token: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyProgram {
  id: string;
  business_id: string;
  name: string;
  stamps_required: number;
  reward_title: string;
  reward_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyCard {
  id: string;
  customer_id: string;
  business_id: string;
  program_id: string;
  current_stamps: number;
  total_stamps_earned: number;
  status: LoyaltyCardStatus;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  loyalty_card_id: string;
  business_id: string;
  action: LoyaltyAction;
  stamps_change: number;
  performed_by: string | null;
  idempotency_key: string | null;
  notes: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  customer_id: string;
  loyalty_card_id: string;
  business_id: string;
  status: RewardStatus;
  unlocked_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  created_at: string;
}

export interface WalletCard {
  id: string;
  customer_id: string;
  loyalty_card_id: string;
  business_id: string;
  provider: WalletProvider;
  external_card_id: string | null;
  wallet_url: string | null;
  status: WalletCardStatus;
  last_updated_at: string;
  created_at: string;
}

// Composite types for UI views
export interface CustomerWithCard extends Customer {
  card?: LoyaltyCard | null;
  program?: LoyaltyProgram | null;
  available_reward?: Reward | null;
  recent_transactions?: LoyaltyTransaction[];
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeCards: number;
  stampsToday: number;
  availableRewards: number;
  totalRedeemed: number;
}
