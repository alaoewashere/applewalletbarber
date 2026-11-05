import fs from 'fs';
import path from 'path';
import { IWalletService, WalletCardPayload, WalletServiceResult } from './types';
import { generateApplePassBuffer } from './apple-pass-builder';

export class AppleWalletService implements IWalletService {
  private hasValidCertificates(): boolean {
    const certPath = path.join(process.cwd(), 'certificates', 'pass.pem');
    const keyPath = path.join(process.cwd(), 'certificates', 'pass_key.key');
    const wwdrPath = path.join(process.cwd(), 'certificates', 'wwdr.pem');
    return fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(wwdrPath);
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/wallet/apple/${externalCardId}/download`;
  }

  async createPass(payload: WalletCardPayload): Promise<WalletServiceResult> {
    if (!this.hasValidCertificates()) {
      return {
        success: false,
        provider: 'apple',
        error: 'Apple Wallet certificates (pass.pem, pass_key.key, wwdr.pem) not found in certificates directory.',
      };
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/api/wallet/apple/${externalCardId}/download`;

      // Optional: If APNs push updates are wired to registered device tokens, send push notification
      // Apple PassKit device will re-fetch GET /v1/passes/{passTypeIdentifier}/{serialNumber}

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webServiceURL = `${appUrl}/api/wallet/apple`;

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
