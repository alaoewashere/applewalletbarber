import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ZipArchive } from 'archiver';

const execFileAsync = promisify(execFile);

export interface ApplePassData {
  serialNumber: string;
  customerName: string;
  businessName: string;
  currentStamps: number;
  stampsRequired: number;
  rewardTitle: string;
  qrToken: string;
  authenticationToken?: string;
  webServiceURL?: string;
  primaryColor?: string;
  logoUrl?: string;
}

export function resolveAppleCertificates(): {
  certPath: string;
  keyPath: string;
  wwdrPath: string;
} {
  const localCert = path.join(process.cwd(), 'certificates', 'pass.pem');
  const localKey = path.join(process.cwd(), 'certificates', 'pass_key.key');
  const localWwdr = path.join(process.cwd(), 'certificates', 'wwdr.pem');

  if (fs.existsSync(localCert) && fs.existsSync(localKey) && fs.existsSync(localWwdr)) {
    return { certPath: localCert, keyPath: localKey, wwdrPath: localWwdr };
  }

  // Fallback to Base64 environment variables (for Vercel serverless deployment)
  const certB64 = process.env.APPLE_CERTIFICATE_BASE64;
  const keyB64 = process.env.APPLE_PRIVATE_KEY_BASE64;
  const wwdrB64 = process.env.APPLE_WWDR_CERTIFICATE_BASE64;

  if (certB64 && keyB64 && wwdrB64) {
    const tmpDir = path.join('/tmp', 'apple_certs');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const certPath = path.join(tmpDir, 'pass.pem');
    const keyPath = path.join(tmpDir, 'pass_key.key');
    const wwdrPath = path.join(tmpDir, 'wwdr.pem');

    fs.writeFileSync(certPath, Buffer.from(certB64, 'base64'));
    fs.writeFileSync(keyPath, Buffer.from(keyB64, 'base64'));
    fs.writeFileSync(wwdrPath, Buffer.from(wwdrB64, 'base64'));

    return { certPath, keyPath, wwdrPath };
  }

  throw new Error(
    'Apple certificates missing. Either place pass.pem, pass_key.key, wwdr.pem in certificates/ or set APPLE_CERTIFICATE_BASE64, APPLE_PRIVATE_KEY_BASE64, APPLE_WWDR_CERTIFICATE_BASE64 in Vercel.'
  );
}

export async function generateApplePassBuffer(data: ApplePassData): Promise<Buffer> {
  const { certPath, keyPath, wwdrPath } = resolveAppleCertificates();
  const assetsDir = path.resolve(process.cwd(), 'lib/wallet/assets/pass-template');

  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.yousedbarber.loyalty';
  const teamIdentifier = process.env.APPLE_TEAM_IDENTIFIER || 'PNRU9TBN6A';

  const isRewardUnlocked = data.currentStamps >= data.stampsRequired;
  const stampsRemaining = Math.max(0, data.stampsRequired - data.currentStamps);

  const passJson: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName: data.businessName || 'Yoused Barber',
    description: `${data.businessName || 'Yoused Barber'} Loyalty Pass`,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(18, 18, 20)',
    labelColor: 'rgb(212, 175, 55)',
    logoText: data.businessName?.toUpperCase() || 'YOUSED BARBER',
    serialNumber: data.serialNumber,
    storeCard: {
      headerFields: [
        {
          key: 'vip_status',
          label: 'MEMBERSHIP',
          value: isRewardUnlocked ? '★ REWARD READY' : 'VIP MEMBER',
        },
      ],
      primaryFields: [
        {
          key: 'stamps',
          label: 'HAIRCUT STAMPS',
          value: `${data.currentStamps} / ${data.stampsRequired}`,
          changeMessage: 'Haircut stamp balance updated to %@',
        },
      ],
      secondaryFields: [
        {
          key: 'customer_name',
          label: 'CLIENT',
          value: data.customerName || 'Valued Client',
        },
        {
          key: 'reward_title',
          label: 'REWARD',
          value: data.rewardTitle || 'Free Haircut',
        },
      ],
      auxiliaryFields: [
        {
          key: 'progress_status',
          label: 'STATUS',
          value: isRewardUnlocked
            ? '🎉 1 FREE HAIRCUT READY TO REDEEM!'
            : `${stampsRemaining} haircut${stampsRemaining === 1 ? '' : 's'} to free cut`,
        },
      ],
      backFields: [
        {
          key: 'program_terms',
          label: 'HOW IT WORKS',
          value:
            '1 haircut = 1 stamp. Collect 5 haircut stamps to unlock 1 free haircut! Show this digital loyalty card to your barber upon checkout.',
        },
        {
          key: 'serial_info',
          label: 'MEMBER PASS ID',
          value: data.serialNumber,
        },
        {
          key: 'barbershop_name',
          label: 'BARBERSHOP',
          value: data.businessName || 'Yoused Barber',
        },
        {
          key: 'auto_updates',
          label: 'PASS UPDATES',
          value:
            'This card updates automatically in real-time as soon as your barber adds a stamp at your visit.',
        },
      ],
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: data.qrToken,
        messageEncoding: 'iso-8859-1',
        altText: 'Scan at checkout',
      },
    ],
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: data.qrToken,
      messageEncoding: 'iso-8859-1',
      altText: 'Scan at checkout',
    },
  };

  // Add Apple Web Service Push URL if configured
  if (data.webServiceURL && data.authenticationToken) {
    passJson.webServiceURL = data.webServiceURL;
    passJson.authenticationToken = data.authenticationToken;
  }

  // Load and hash all bundle files
  const fileBuffers: Record<string, Buffer> = {};
  fileBuffers['pass.json'] = Buffer.from(JSON.stringify(passJson, null, 2), 'utf-8');

  const assetNames = [
    'icon.png',
    'icon@2x.png',
    'icon@3x.png',
    'logo.png',
    'logo@2x.png',
    'logo@3x.png',
    'strip.png',
    'strip@2x.png',
    'strip@3x.png',
  ];

  for (const name of assetNames) {
    const fullPath = path.join(assetsDir, name);
    if (fs.existsSync(fullPath)) {
      fileBuffers[name] = fs.readFileSync(fullPath);
    }
  }

  // Compute manifest.json SHA-1 hashes
  const manifest: Record<string, string> = {};
  for (const [name, buf] of Object.entries(fileBuffers)) {
    manifest[name] = crypto.createHash('sha1').update(buf).digest('hex');
  }
  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
  fileBuffers['manifest.json'] = manifestBuf;

  // Sign manifest with Apple Pass certificate & WWDR
  const tmpId = crypto.randomUUID();
  const tmpManifest = path.join('/tmp', `manifest_${tmpId}.json`);
  const tmpSig = path.join('/tmp', `sig_${tmpId}.der`);

  await fs.promises.writeFile(tmpManifest, manifestBuf);

  try {
    await execFileAsync('openssl', [
      'smime',
      '-sign',
      '-signer',
      certPath,
      '-inkey',
      keyPath,
      '-certfile',
      wwdrPath,
      '-binary',
      '-outform',
      'DER',
      '-in',
      tmpManifest,
      '-out',
      tmpSig,
    ]);

    fileBuffers['signature'] = await fs.promises.readFile(tmpSig);
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tmpManifest)) await fs.promises.unlink(tmpManifest).catch(() => {});
    if (fs.existsSync(tmpSig)) await fs.promises.unlink(tmpSig).catch(() => {});
  }

  // Package all files into in-memory .pkpass ZIP buffer
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err: Error) => reject(err));

    for (const [name, buf] of Object.entries(fileBuffers)) {
      archive.append(buf, { name });
    }

    archive.finalize();
  });
}
