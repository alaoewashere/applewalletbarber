import { IWalletService, WalletCardPayload, WalletServiceResult } from './types';
import { WalletProvider } from '@/types/database';

export class MockWalletService implements IWalletService {
  private baseMockUrl: string;

  constructor(baseMockUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') {
    this.baseMockUrl = baseMockUrl;
  }

  async createCard(payload: WalletCardPayload, provider: WalletProvider): Promise<WalletServiceResult> {
    const externalCardId = `mock_${provider}_${payload.customerId}_${Date.now()}`;
    // Link to digital pass viewer in mock environment
    const cardUrl = `${this.baseMockUrl}/card/${payload.qrToken}?wallet=${provider}&mock=true`;

    return {
      success: true,
      provider,
      externalCardId,
      cardUrl,
    };
  }

  async updateCard(externalCardId: string, payload: WalletCardPayload, provider: WalletProvider): Promise<WalletServiceResult> {
    const cardUrl = `${this.baseMockUrl}/card/${payload.qrToken}?wallet=${provider}&updated=${Date.now()}`;

    return {
      success: true,
      provider,
      externalCardId,
      cardUrl,
    };
  }

  async revokeCard(externalCardId: string, provider: WalletProvider): Promise<boolean> {
    return true;
  }

  async getPassUrl(externalCardId: string, provider: WalletProvider): Promise<string | null> {
    return `${this.baseMockUrl}/api/wallet/pass/${externalCardId}`;
  }
}
