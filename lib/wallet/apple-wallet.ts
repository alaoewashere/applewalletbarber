import { IWalletService, WalletCardPayload, WalletServiceResult } from './types';
import { MockWalletService } from './mock-wallet';

export class AppleWalletService {
  private mockFallback = new MockWalletService();

  async createPass(payload: WalletCardPayload): Promise<WalletServiceResult> {
    // Check if Apple PassTypeID & certificates are configured
    const hasCertificates = Boolean(process.env.APPLE_PASS_CERT_BASE64 && process.env.APPLE_PASS_TYPE_ID);

    if (!hasCertificates) {
      return this.mockFallback.createCard(payload, 'apple');
    }

    // Real passkit-generator logic will be plugged in here in Phase 3
    return this.mockFallback.createCard(payload, 'apple');
  }

  async updatePass(externalCardId: string, payload: WalletCardPayload): Promise<WalletServiceResult> {
    return this.mockFallback.updateCard(externalCardId, payload, 'apple');
  }
}
