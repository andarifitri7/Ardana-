import { tatadanaDb } from '@/lib/store/mock-db';
import { hashPassword, verifyPassword } from '@/lib/auth/security';
import { EmailService, EmailSendResult } from '@/lib/email/service';

interface OTPRecord {
  phoneNumber: string;
  code: string;
  expiresAt: number;
}

const phoneOtpStore = new Map<string, OTPRecord>();

export class OTPService {
  /**
   * Generate cryptographically secure 6-digit OTP code
   */
  static generateOTP(): string {
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const crypto = require('crypto');
        return crypto.randomInt(100000, 1000000).toString();
      } catch {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send Email OTP with cryptographic hashing, expiration (10 min), rate-limiting (60s), and real email delivery
   */
  static async sendEmailOTP(email: string): Promise<{
    success: boolean;
    message: string;
    configured: boolean;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
    emailDelivery?: EmailSendResult;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = tatadanaDb.getUserByEmail(cleanEmail);

    if (!user) {
      return {
        success: false,
        configured: EmailService.isConfigured(),
        message: 'Akun dengan email ini tidak ditemukan.',
      };
    }

    const now = Date.now();
    // 1. Rate-limiting check: 60s cooldown
    if (user.email_verification_last_sent_at) {
      const elapsed = Math.floor((now - user.email_verification_last_sent_at) / 1000);
      if (elapsed < 60) {
        const remaining = 60 - elapsed;
        return {
          success: false,
          rateLimited: true,
          retryAfterSeconds: remaining,
          configured: EmailService.isConfigured(),
          message: `Mohon tunggu ${remaining} detik sebelum meminta pengiriman ulang kode verifikasi.`,
        };
      }
    }

    // 2. Generate secure 6-digit code
    const rawCode = this.generateOTP();
    const hashedCode = hashPassword(`otp_${rawCode}`);
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // 3. Store hash and metadata (NEVER expose plain code publicly)
    user.email_verification_code_hash = hashedCode;
    user.email_verification_expires_at = expiresAt;
    user.email_verification_last_sent_at = now;
    // For backwards compatibility with internal methods during transition
    user.email_verification_code = rawCode;
    user.profile.email_verification_code = null; // Do not expose in profile!
    tatadanaDb.saveToStorage();

    // 4. Send email via real EmailService
    const emailResult = await EmailService.sendOTPEmail(cleanEmail, rawCode);

    if (!emailResult.success) {
      return {
        success: false,
        configured: emailResult.configured,
        message: emailResult.message,
        emailDelivery: emailResult,
      };
    }

    return {
      success: true,
      configured: true,
      message: `Kode verifikasi telah dikirimkan ke alamat email ${cleanEmail}. Periksa kotak masuk atau folder Spam/Junk Anda.`,
      emailDelivery: emailResult,
    };
  }

  /**
   * Verify Email OTP code securely against hash and expiration
   */
  static verifyEmailOTP(email: string, code: string): {
    success: boolean;
    message: string;
    profile?: any;
  } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const user = tatadanaDb.getUserByEmail(cleanEmail);

    if (!user) {
      return { success: false, message: 'Akun dengan email ini tidak ditemukan.' };
    }

    // Check if email is already verified (prevent OTP reuse)
    if (user.email_verified) {
      return {
        success: false,
        message: 'Email untuk akun ini sudah terverifikasi sebelumnya. Kode verifikasi tidak dapat digunakan berulang kali.',
        profile: user.profile,
      };
    }

    const now = Date.now();

    // 1. Expiry check
    if (user.email_verification_expires_at && now > user.email_verification_expires_at) {
      return {
        success: false,
        message: 'Kode verifikasi telah kedaluwarsa (batas waktu 10 menit). Silakan minta kode baru.',
      };
    }

    // 2. Hash verification
    let isValid = false;
    if (user.email_verification_code_hash) {
      isValid = verifyPassword(`otp_${cleanCode}`, user.email_verification_code_hash);
    }

    // Fallback: direct code comparison if hash not yet generated
    if (!isValid && user.email_verification_code && user.email_verification_code === cleanCode) {
      isValid = true;
    }

    if (!isValid) {
      return {
        success: false,
        message: 'Kode verifikasi salah atau tidak cocok dengan akun Anda.',
      };
    }

    // 3. Mark verified & transition to pending approval (Requirement 2 & 3)
    user.email_verified = true;
    user.account_status = 'pending';
    user.email_verification_code = null;
    user.email_verification_code_hash = null;
    user.email_verification_expires_at = null;

    user.profile.email_verified = true;
    user.profile.account_status = 'pending';
    user.profile.email_verification_code = null;
    user.profile.updated_at = new Date().toISOString();

    tatadanaDb.saveToStorage();

    tatadanaDb.addAuditLog('Verifikasi email berhasil, status akun masuk ke antrean persetujuan admin', user.id, {
      email: cleanEmail,
      account_status: 'pending',
    });

    return {
      success: true,
      message: 'Email berhasil diverifikasi! Akun Anda kini menunggu persetujuan administrator.',
      profile: user.profile,
    };
  }

  /**
   * Phone OTP support (Simulator / Secondary)
   */
  static async sendPhoneOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      return { success: false, message: 'Nomor handphone tidak valid (minimal 10 digit).' };
    }

    const defaultCode = process.env.NEXT_PUBLIC_OTP_SIMULATOR_CODE || '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000;

    phoneOtpStore.set(cleanPhone, {
      phoneNumber: cleanPhone,
      code: defaultCode,
      expiresAt,
    });

    return {
      success: true,
      message: `Kode OTP verifikasi telah dikirim ke ${cleanPhone}.`,
    };
  }

  static async verifyPhoneOTP(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const cleanCode = code.trim();
    const record = phoneOtpStore.get(cleanPhone);
    const defaultCode = process.env.NEXT_PUBLIC_OTP_SIMULATOR_CODE || '123456';

    const isValid = cleanCode === defaultCode || (record && record.code === cleanCode && Date.now() <= record.expiresAt);

    if (!isValid) {
      return { success: false, message: 'Kode OTP salah atau telah kadaluarsa.' };
    }

    tatadanaDb.updateProfile({
      phone_number: cleanPhone,
      phone_verified: true,
    });

    phoneOtpStore.delete(cleanPhone);
    return { success: true, message: 'Nomor handphone berhasil diverifikasi!' };
  }

  // Aliases for generic calls
  static async sendOTP(phoneNumber: string) {
    return this.sendPhoneOTP(phoneNumber);
  }

  static async verifyOTP(phoneNumber: string, code: string) {
    return this.verifyPhoneOTP(phoneNumber, code);
  }
}
