import jwt from 'jsonwebtoken';
import { IWalletService, WalletCardPayload, WalletServiceResult } from './types';

export class GoogleWalletService implements IWalletService {
  private isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_WALLET_ISSUER_ID &&
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    );
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
    return null;
  }

  generateSaveUrl(payload: WalletCardPayload): string {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!issuerId || !clientEmail || !privateKey) {
      throw new Error(
        'Google Wallet credentials missing. Required: GOOGLE_WALLET_ISSUER_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local'
      );
    }

    // Handle escaped newlines in env variables
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const businessId = 'yoused_barber';
    const classId = `${issuerId}.${businessId}`;
    const objectId = `${issuerId}.${payload.customerId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const isRewardUnlocked = payload.currentStamps >= payload.stampsRequired;
    const remaining = Math.max(0, payload.stampsRequired - payload.currentStamps);

    const loyaltyClass = {
      id: classId,
      issuerName: payload.businessName || 'Yoused Barber',
      programName: 'VIP Haircut Rewards',
      reviewStatus: 'UNDER_REVIEW',
      hexBackgroundColor: payload.primaryColor || '#18181b',
    };

    const loyaltyObject = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      accountId: payload.qrToken,
      accountName: payload.customerName,
      barcode: {
        type: 'QR_CODE',
        value: payload.qrToken,
        alternateText: 'Scan at checkout',
      },
      loyaltyPoints: {
        label: 'Haircut Stamps',
        balance: {
          string: `${payload.currentStamps} / ${payload.stampsRequired}`,
        },
      },
      textModulesData: [
        {
          header: 'REWARD',
          body: payload.rewardTitle || 'Free Haircut',
        },
        {
          header: 'STATUS',
          body: isRewardUnlocked
            ? '🎉 1 Free Haircut ready to redeem!'
            : `${remaining} more haircut${remaining === 1 ? '' : 's'} until free cut.`,
        },
      ],
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const origins = [appUrl, 'http://localhost:3000', 'https://pay.google.com'];

    const claims = {
      iss: clientEmail,
      aud: 'google',
      typ: 'savetovm',
      origins,
      payload: {
        loyaltyClasses: [loyaltyClass],
        loyaltyObjects: [loyaltyObject],
      },
    };

    const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
  }

  async createPass(payload: WalletCardPayload): Promise<WalletServiceResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'google',
        error:
          'Google Wallet credentials not configured yet. Set GOOGLE_WALLET_ISSUER_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local.',
      };
    }

    try {
      const saveUrl = this.generateSaveUrl(payload);
      return {
        success: true,
        provider: 'google',
        cardUrl: saveUrl,
        externalCardId: payload.customerId,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: 'google',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async updatePass(externalCardId: string, payload: WalletCardPayload): Promise<WalletServiceResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'google',
        externalCardId,
        error: 'Google Wallet credentials not configured.',
      };
    }

    try {
      const saveUrl = this.generateSaveUrl(payload);
      return {
        success: true,
        provider: 'google',
        cardUrl: saveUrl,
        externalCardId,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: 'google',
        externalCardId,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
