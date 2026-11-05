import { IWalletService, WalletCardPayload, WalletServiceResult } from './types';
import { generateApplePassBuffer, getAppleCertificatesPem } from './apple-pass-builder';

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

export class AppleWalletService implements IWalletService {
  private hasValidCertificates(): boolean {
    try {
      getAppleCertificatesPem();
      return true;
    } catch {
      return false;
    }
  }

  async createCard(payload: WalletCardPayload): Promise<WalletServiceResult> {
    return this.createPass(payload);
  }

  async updateCard(externalCardId: string, payload: WalletCardPayload): Promise<WalletServiceResult> {
    return this.updatePass(externalCardId, payload);
  }

  async revokeCard(externalCardId: string): Promise<boolean> {
    return true;
  }

  async getPassUrl(externalCardId: string): Promise<string | null> {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/api/wallet/apple/${externalCardId}/download`;
  }

  async createPass(payload: WalletCardPayload): Promise<WalletServiceResult> {
    if (!this.hasValidCertificates()) {
      return {
        success: false,
        provider: 'apple',
        error: 'Apple Wallet certificates (pass.pem, pass_key.key, wwdr.pem) not found.',
      };
    }

    try {
      const baseUrl = getBaseUrl();
      const downloadUrl = `${baseUrl}/api/wallet/apple/${payload.qrToken}/download`;

      return {
        success: true,
        provider: 'apple',
        cardUrl: downloadUrl,
        externalCardId: payload.qrToken,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: 'apple',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async updatePass(externalCardId: string, payload: WalletCardPayload): Promise<WalletServiceResult> {
    if (!this.hasValidCertificates()) {
      return {
        success: false,
        provider: 'apple',
        error: 'Apple Wallet certificates missing.',
      };
    }

    try {
      const baseUrl = getBaseUrl();
      const downloadUrl = `${baseUrl}/api/wallet/apple/${externalCardId}/download`;

      return {
        success: true,
        provider: 'apple',
        externalCardId,
        cardUrl: downloadUrl,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: 'apple',
        externalCardId,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async generatePassBuffer(payload: WalletCardPayload): Promise<Buffer> {
    const baseUrl = getBaseUrl();
    const webServiceURL = `${baseUrl}/api/wallet/apple`;

    return generateApplePassBuffer({
      serialNumber: payload.qrToken,
      customerName: payload.customerName,
      businessName: payload.businessName,
      currentStamps: payload.currentStamps,
      stampsRequired: payload.stampsRequired,
      rewardTitle: payload.rewardTitle,
      qrToken: payload.qrToken,
      authenticationToken: `auth_${payload.qrToken.replace(/[^a-zA-Z0-9]/g, '')}`,
      webServiceURL,
      primaryColor: payload.primaryColor,
    });
  }
}
