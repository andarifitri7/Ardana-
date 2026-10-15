/**
 * Phone Number Validation & Simulation Service
 * Supports Indonesian phone formats (08xxxxxxxxxx, +628xxxxxxxxxx, 628xxxxxxxxxx).
 * Provides secure phone verification simulation without sending real SMS/WhatsApp.
 */

interface PhoneSimulationRecord {
  phoneNumber: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

const simulationStore = new Map<string, PhoneSimulationRecord>();

export function validateIndonesianPhone(phone: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      normalized: '',
      error: 'Nomor handphone wajib diisi.',
    };
  }

  // Strip whitespaces, dashes, parentheses
  const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Indonesian format regex:
  // Starts with +628, 628, or 08 followed by 8 to 11 digits (total 10-13 digits for 08...)
  const regex = /^(\+628|628|08)[1-9][0-9]{7,11}$/;

  if (!regex.test(cleaned)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Format nomor HP tidak valid. Gunakan format nomor handphone Indonesia seperti 08xxxxxxxxxx atau +628xxxxxxxxxx (10-14 digit).',
    };
  }

  // Normalize to 08... standard representation
  let normalized = cleaned;
  if (normalized.startsWith('+62')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('62')) {
    normalized = '0' + normalized.slice(2);
  }

  return {
    isValid: true,
    normalized,
  };
}

const verifiedPhoneStore = new Map<string, number>();

export class PhoneSimulationService {
  /**
   * Request simulation verification code
   * Note: NEVER sends real SMS or WhatsApp.
   */
  static requestSimulationCode(phoneNumber: string): {
    success: boolean;
    isSimulation: true;
    simulatedCode: string;
    normalizedPhone: string;
    message: string;
    expiresInSeconds: number;
  } {
    const validation = validateIndonesianPhone(phoneNumber);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Nomor HP tidak valid.');
    }

    const phone = validation.normalized;
    const now = Date.now();

    // Check rate limit: 15s between requests for development convenience
    const existing = simulationStore.get(phone);
    if (existing && now - existing.createdAt < 15000) {
      const waitTime = Math.ceil((15000 - (now - existing.createdAt)) / 1000);
      throw new Error(`Harap tunggu ${waitTime} detik sebelum meminta kode simulasi baru.`);
    }

    // Generate random 6-digit simulation code
    let code: string;
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const crypto = require('crypto');
        code = crypto.randomInt(100000, 1000000).toString();
      } catch {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }
    } else {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const ttlMs = 10 * 60 * 1000; // 10 minutes
    const record: PhoneSimulationRecord = {
      phoneNumber: phone,
      code,
      expiresAt: now + ttlMs,
      createdAt: now,
    };

    simulationStore.set(phone, record);

    return {
      success: true,
      isSimulation: true,
      simulatedCode: code,
      normalizedPhone: phone,
      expiresInSeconds: 600,
      message: `[MODE SIMULASI] Gateway SMS/WhatsApp nyata belum diaktifkan. Kode verifikasi simulasi pengujian Anda adalah: ${code}. Masukkan kode ini pada form untuk melanjutkan pendaftaran.`,
    };
  }

  /**
   * Verify simulation code
   * Requires an active code request; rejects blind static codes in production
   */
  static verifySimulationCode(
    phoneNumber: string,
    code: string
  ): {
    success: boolean;
    normalizedPhone: string;
    status: 'simulated_verified';
    message: string;
  } {
    const validation = validateIndonesianPhone(phoneNumber);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Nomor HP tidak valid.');
    }

    const phone = validation.normalized;
    const cleanCode = code ? code.trim() : '';

    if (!cleanCode) {
      throw new Error('Kode verifikasi simulasi wajib diisi.');
    }

    const record = simulationStore.get(phone);
    const now = Date.now();

    if (!record) {
      throw new Error('Kode verifikasi simulasi belum diminta atau telah kedaluwarsa. Silakan klik "Kirim Kode Simulasi" terlebih dahulu.');
    }

    if (now > record.expiresAt) {
      simulationStore.delete(phone);
      throw new Error('Kode verifikasi simulasi telah kedaluwarsa. Silakan minta kode baru.');
    }

    const customEnvCode = process.env.NEXT_PUBLIC_OTP_SIMULATOR_CODE;
    const isMatch = cleanCode === record.code || (Boolean(customEnvCode) && cleanCode === customEnvCode);

    if (!isMatch) {
      throw new Error('Kode verifikasi simulasi salah. Masukkan 6-digit kode yang ditampilkan pada layar.');
    }

    // Clean up used request and save to verified store (valid for 30 minutes)
    simulationStore.delete(phone);
    verifiedPhoneStore.set(phone, now + 30 * 60 * 1000);

    return {
      success: true,
      normalizedPhone: phone,
      status: 'simulated_verified',
      message: 'Nomor HP berhasil diverifikasi (Status: simulated_verified).',
    };
  }

  /**
   * Check if a phone number was recently verified in simulation mode
   */
  static isPhoneSimulatedVerified(phoneNumber: string): boolean {
    const validation = validateIndonesianPhone(phoneNumber);
    if (!validation.isValid) return false;
    const exp = verifiedPhoneStore.get(validation.normalized);
    return Boolean(exp && Date.now() <= exp);
  }
}
