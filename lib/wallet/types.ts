import { WalletCard, WalletProvider } from '@/types/database';

export interface WalletCardPayload {
  customerId: string;
  customerName: string;
  businessName: string;
  primaryColor?: string;
  logoUrl?: string;
  currentStamps: number;
  stampsRequired: number;
  rewardTitle: string;
  isRewardUnlocked: boolean;
  qrToken: string;
  barcodeValue: string;
}

export interface WalletServiceResult {
  success: boolean;
  provider: WalletProvider;
  cardUrl?: string;
  externalCardId?: string;
  error?: string;
}

export interface IWalletService {
  createCard(payload: WalletCardPayload, provider: WalletProvider): Promise<WalletServiceResult>;
  updateCard(externalCardId: string, payload: WalletCardPayload, provider: WalletProvider): Promise<WalletServiceResult>;
  revokeCard(externalCardId: string, provider: WalletProvider): Promise<boolean>;
  getPassUrl(externalCardId: string, provider: WalletProvider): Promise<string | null>;
}
