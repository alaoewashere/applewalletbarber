import { WalletCardPayload, WalletServiceResult } from './types';
import { MockWalletService } from './mock-wallet';

export class GoogleWalletService {
  private mockFallback = new MockWalletService();

  async createPass(payload: WalletCardPayload): Promise<WalletServiceResult> {
    const hasCredentials = Boolean(process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_PRIVATE_KEY);

    if (!hasCredentials) {
      return this.mockFallback.createCard(payload, 'google');
    }

    // Real Google Wallet Generic/Loyalty Class JWT generation will be plugged in here in Phase 3
    return this.mockFallback.createCard(payload, 'google');
  }

  async updatePass(externalCardId: string, payload: WalletCardPayload): Promise<WalletServiceResult> {
    return this.mockFallback.updateCard(externalCardId, payload, 'google');
  }
}
