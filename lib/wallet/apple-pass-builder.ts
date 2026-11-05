import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import forge from 'node-forge';
import { ZipArchive } from 'archiver';

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

export function getAppleCertificatesPem(): {
  certPem: string;
  keyPem: string;
  wwdrPem: string;
} {
  // 1. Check Base64 environment variables (primary for Vercel / Serverless deployments)
  const certB64 = process.env.APPLE_CERTIFICATE_BASE64;
  const keyB64 = process.env.APPLE_PRIVATE_KEY_BASE64;
  const wwdrB64 = process.env.APPLE_WWDR_CERTIFICATE_BASE64;

  if (certB64 && keyB64 && wwdrB64) {
    return {
      certPem: Buffer.from(certB64, 'base64').toString('utf-8'),
      keyPem: Buffer.from(keyB64, 'base64').toString('utf-8'),
      wwdrPem: Buffer.from(wwdrB64, 'base64').toString('utf-8'),
    };
  }

  // 2. Fallback to physical files in local certificates/ folder
  const localCert = path.join(process.cwd(), 'certificates', 'pass.pem');
  const localKey = path.join(process.cwd(), 'certificates', 'pass_key.key');
  const localWwdr = path.join(process.cwd(), 'certificates', 'wwdr.pem');

  if (fs.existsSync(localCert) && fs.existsSync(localKey) && fs.existsSync(localWwdr)) {
    return {
      certPem: fs.readFileSync(localCert, 'utf-8'),
      keyPem: fs.readFileSync(localKey, 'utf-8'),
      wwdrPem: fs.readFileSync(localWwdr, 'utf-8'),
    };
  }

  throw new Error(
    'Apple certificates missing. Either set APPLE_CERTIFICATE_BASE64, APPLE_PRIVATE_KEY_BASE64, APPLE_WWDR_CERTIFICATE_BASE64 in Vercel or place files in certificates/.'
  );
}

export async function generateApplePassBuffer(data: ApplePassData): Promise<Buffer> {
  const { certPem, keyPem, wwdrPem } = getAppleCertificatesPem();
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

  // Pure JavaScript PKCS#7 Detached Signing via node-forge (Zero external binary dependencies)
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestBuf.toString('utf-8'), 'utf8');

  const passCert = forge.pki.certificateFromPem(certPem);
  const wwdrCert = forge.pki.certificateFromPem(wwdrPem);
  const privateKey = forge.pki.privateKeyFromPem(keyPem);

  p7.addCertificate(passCert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: privateKey,
    certificate: passCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
      },
    ],
  });

  p7.sign({ detached: true });
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  fileBuffers['signature'] = Buffer.from(der, 'binary');

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
