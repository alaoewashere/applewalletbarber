import { AppleWalletService } from './apple-wallet';
import { GoogleWalletService } from './google-wallet';
import { WalletCardPayload, WalletServiceResult } from './types';
import { WalletProvider } from '@/types/database';

export class WalletService {
  private appleService = new AppleWalletService();
  private googleService = new GoogleWalletService();

  async syncCardToWallets(payload: WalletCardPayload): Promise<{
    apple: WalletServiceResult;
    google: WalletServiceResult;
  }> {
    const [appleRes, googleRes] = await Promise.all([
      this.appleService.createPass(payload).catch((err) => ({
        success: false,
        provider: 'apple' as WalletProvider,
        error: String(err?.message || err),
      })),
      this.googleService.createPass(payload).catch((err) => ({
        success: false,
        provider: 'google' as WalletProvider,
        error: String(err?.message || err),
      })),
    ]);

    return {
      apple: appleRes,
      google: googleRes,
    };
  }

  async updateWallets(
    payload: WalletCardPayload,
    cards: { provider: WalletProvider; externalCardId: string | null }[]
  ): Promise<WalletServiceResult[]> {
    const results: WalletServiceResult[] = [];

    for (const card of cards) {
      if (!card.externalCardId) continue;
      try {
        if (card.provider === 'apple') {
          const res = await this.appleService.updatePass(card.externalCardId, payload);
          results.push(res);
        } else if (card.provider === 'google') {
          const res = await this.googleService.updatePass(card.externalCardId, payload);
          results.push(res);
        }
      } catch (err: unknown) {
        results.push({
          success: false,
          provider: card.provider,
          externalCardId: card.externalCardId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }
}

export const walletService = new WalletService();
