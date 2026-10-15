/**
 * Production-ready Email Delivery Service for Ardana FinTech
 * Supports native SMTP (direct TLS / socket) and Resend API without third-party dependencies.
 */

export interface EmailSendResult {
  success: boolean;
  message: string;
  configured: boolean;
  error?: string;
  messageId?: string;
}

export class EmailService {
  /**
   * Check whether real email delivery credentials are configured in the environment
   */
  static isConfigured(): boolean {
    const hasResend = Boolean(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('example'));
    const hasSmtp = Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      !process.env.SMTP_HOST.includes('example')
    );
    return hasResend || hasSmtp;
  }

  /**
   * Get sender address with fallback
   */
  static getFromAddress(): string {
    return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Ardana Keuangan <no-reply@tatadana.id>';
  }

  /**
   * Send 6-digit OTP verification email to user
   */
  static async sendOTPEmail(toEmail: string, otpCode: string): Promise<EmailSendResult> {
    const cleanTo = toEmail.trim().toLowerCase();
    const from = this.getFromAddress();
    const subject = `Kode Verifikasi Akun Ardana: ${otpCode}`;

    const textBody = `Halo,\n\nTerima kasih telah mendaftar di Ardana - Catat Keuangan Cerdas.\n\n` +
      `Kode verifikasi OTP akun Anda adalah: ${otpCode}\n\n` +
      `Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda.\n\n` +
      `PENTING: Jika Anda tidak menemukan email ini di kotak masuk utama, mohon periksa folder Spam/Junk.\n\n` +
      `Salam hangat,\nTim Ardana Indonesia`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 20px; background-color: #ffffff; border: 1px solid #f1e5e8; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #812D46; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Ardana</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Personal Finance FinTech</p>
        </div>
        <div style="background-color: #fdf8f9; border: 1px solid #f9e2e7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0;">Gunakan kode verifikasi berikut untuk memverifikasi alamat email Anda:</p>
          <div style="font-size: 36px; font-weight: 800; font-family: monospace; letter-spacing: 6px; color: #812D46; padding: 12px; background: #ffffff; border-radius: 8px; border: 1px dashed #c98f9d; display: inline-block;">
            ${otpCode}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">⏱️ Kode ini kedaluwarsa dalam <strong>10 menit</strong>.</p>
        </div>
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">
            📂 <strong>Informasi Kotak Masuk:</strong> Jika email ini tidak muncul di kotak masuk utama, harap periksa folder <strong>Spam / Junk</strong> Anda.
          </p>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 16px 0;">
          Setelah email terverifikasi, akun Anda akan masuk ke status <strong>Menunggu Persetujuan Admin</strong> sebelum dapat mengakses dashboard keuangan.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          © 2026 Ardana FinTech Indonesia • Email otomatis, jangan membalas email ini.
        </p>
      </div>
    `;

    // 1. Check if configured
    if (!this.isConfigured()) {
      console.warn(
        `[EmailService] SMTP / Email provider credentials not configured in environment variables.\n` +
        `Required environment variables for real email delivery:\n` +
        `- SMTP_HOST (e.g. smtp.gmail.com / mail.yourdomain.com)\n` +
        `- SMTP_PORT (e.g. 587 or 465)\n` +
        `- SMTP_USER (e.g. your-smtp-username@domain.com)\n` +
        `- SMTP_PASSWORD (e.g. your-smtp-app-password)\n` +
        `- EMAIL_FROM (e.g. Ardana <no-reply@domain.com>)\n` +
        `Alternatively, provide RESEND_API_KEY.`
      );

      return {
        success: false,
        configured: false,
        message: 'Layanan email (SMTP) belum dikonfigurasi pada server. Silakan hubungi administrator atau lengkapi environment variables SMTP.',
        error: 'SMTP_NOT_CONFIGURED',
      };
    }

    // 2. Try Resend REST API if key present
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('example')) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [cleanTo],
            subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        const data = await res.json();
        if (res.ok && data.id) {
          console.log(`[EmailService] OTP email successfully dispatched via Resend API to ${cleanTo} (id: ${data.id})`);
          return {
            success: true,
            configured: true,
            messageId: data.id,
            message: `Kode verifikasi telah dikirimkan ke ${cleanTo}. Silakan periksa kotak masuk atau folder spam Anda.`,
          };
        } else {
          console.error(`[EmailService] Resend API rejected email delivery:`, data);
          return {
            success: false,
            configured: true,
            error: data.message || 'Resend API rejected delivery',
            message: `Gagal mengirim email verifikasi ke ${cleanTo}. Layanan email mengembalikan error.`,
          };
        }
      } catch (err: any) {
        console.error(`[EmailService] Network error sending via Resend:`, err);
        return {
          success: false,
          configured: true,
          error: err.message,
          message: `Gagal menghubungi penyedia layanan email: ${err.message}`,
        };
      }
    }

    // 3. Native SMTP Client via Node.js net/tls socket
    const host = process.env.SMTP_HOST!;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER!;
    const pass = process.env.SMTP_PASSWORD!;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    try {
      const smtpRes = await this.sendViaNativeSMTP({
        host,
        port,
        secure,
        user,
        pass,
        from,
        to: cleanTo,
        subject,
        textBody,
        htmlBody,
      });

      if (smtpRes.success) {
        console.log(`[EmailService] OTP email successfully sent via SMTP (${host}:${port}) to ${cleanTo}`);
        return {
          success: true,
          configured: true,
          message: `Kode verifikasi telah dikirimkan ke ${cleanTo}. Silakan periksa kotak masuk atau folder spam Anda.`,
        };
      } else {
        console.error(`[EmailService] SMTP delivery failed to ${cleanTo}:`, smtpRes.error);
        return {
          success: false,
          configured: true,
          error: smtpRes.error,
          message: `Pengiriman email melalui SMTP (${host}) gagal: ${smtpRes.error}`,
        };
      }
    } catch (err: any) {
      console.error(`[EmailService] Unexpected SMTP socket error:`, err);
      return {
        success: false,
        configured: true,
        error: err.message,
        message: `Terjadi kendala koneksi ke server SMTP: ${err.message}`,
      };
    }
  }

  /**
   * Pure Node.js SMTP protocol implementation (no external dependencies required)
   */
  private static async sendViaNativeSMTP(options: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string;
    subject: string;
    textBody: string;
    htmlBody: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined') {
      return { success: false, error: 'SMTP cannot run in browser environment' };
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tls = require('tls');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const net = require('net');

    return new Promise((resolve) => {
      let socket: any;
      let step = 0;
      let buffer = '';
      const boundary = `====_Ardana_Fintech_${Date.now()}_====`;
      const isStartTlsNeeded = !options.secure && options.port !== 465;

      const cleanup = () => {
        try {
          if (socket && !socket.destroyed) socket.end();
        } catch {}
      };

      const fail = (err: string) => {
        cleanup();
        resolve({ success: false, error: err });
      };

      const sendLine = (cmd: string) => {
        if (socket && socket.writable) {
          socket.write(cmd + '\r\n');
        }
      };

      const bindSocketEvents = (currentSocket: any) => {
        currentSocket.setTimeout(15000, () => {
          fail('Koneksi SMTP timeout (15 detik)');
        });

        currentSocket.on('error', (err: any) => {
          fail(`SMTP Socket error: ${err.message}`);
        });

        currentSocket.on('data', (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split('\r\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const code = parseInt(line.substring(0, 3), 10);
            const isMultiLine = line.charAt(3) === '-';
            if (isMultiLine) continue; // wait for final line

            if (step === 0) {
              // Greeting (220)
              if (code === 220) {
                step = 1;
                sendLine(`EHLO tatadana.id`);
              } else {
                return fail(`Unexpected greeting: ${line}`);
              }
            } else if (step === 1) {
              // EHLO response (250)
              if (code === 250) {
                if (isStartTlsNeeded) {
                  // Upgrade connection with STARTTLS
                  step = 15;
                  sendLine(`STARTTLS`);
                } else {
                  step = 2;
                  sendLine(`AUTH LOGIN`);
                }
              } else {
                return fail(`EHLO rejected: ${line}`);
              }
            } else if (step === 15) {
              // STARTTLS response (220)
              if (code === 220) {
                step = 16;
                buffer = ''; // Clear plain text buffer before TLS stream

                // Upgrade current net socket to TLS socket
                currentSocket.removeAllListeners('data');
                currentSocket.removeAllListeners('error');
                currentSocket.removeAllListeners('timeout');

                try {
                  const secureSocket = tls.connect({
                    socket: currentSocket,
                    host: options.host,
                    servername: options.host,
                    rejectUnauthorized: false,
                  }, () => {
                    // Handshake completed on secureConnect
                    socket = secureSocket;
                    sendLine(`EHLO tatadana.id`);
                  });

                  socket = secureSocket;
                  bindSocketEvents(secureSocket);
                } catch (tlsErr: any) {
                  return fail(`STARTTLS upgrade failed: ${tlsErr.message}`);
                }
              } else {
                return fail(`STARTTLS rejected: ${line}`);
              }
            } else if (step === 16) {
              // Post-STARTTLS EHLO response (250)
              if (code === 250) {
                step = 2;
                sendLine(`AUTH LOGIN`);
              } else {
                return fail(`Post-STARTTLS EHLO rejected: ${line}`);
              }
            } else if (step === 2) {
              // AUTH LOGIN username prompt (334)
              if (code === 334) {
                step = 3;
                sendLine(Buffer.from(options.user).toString('base64'));
              } else {
                return fail(`AUTH LOGIN rejected: ${line}`);
              }
            } else if (step === 3) {
              // AUTH LOGIN password prompt (334)
              if (code === 334) {
                step = 4;
                sendLine(Buffer.from(options.pass).toString('base64'));
              } else {
                return fail(`Username rejected: ${line}`);
              }
            } else if (step === 4) {
              // AUTH SUCCESS (235)
              if (code === 235) {
                step = 5;
                const fromMatch = options.from.match(/<([^>]+)>/);
                const cleanFrom = fromMatch ? fromMatch[1] : options.from;
                sendLine(`MAIL FROM:<${cleanFrom}>`);
              } else {
                return fail(`Autentikasi SMTP gagal: Password salah atau App Password dibutuhkan. (${line})`);
              }
            } else if (step === 5) {
              // MAIL FROM response (250)
              if (code === 250) {
                step = 6;
                sendLine(`RCPT TO:<${options.to}>`);
              } else {
                return fail(`Pengirim ditolak oleh server SMTP: ${line}`);
              }
            } else if (step === 6) {
              // RCPT TO response (250)
              if (code === 250) {
                step = 7;
                sendLine(`DATA`);
              } else {
                return fail(`Alamat penerima (${options.to}) ditolak oleh server SMTP: ${line}`);
              }
            } else if (step === 7) {
              // DATA response (354)
              if (code === 354) {
                step = 8;
                const message = [
                  `From: ${options.from}`,
                  `To: ${options.to}`,
                  `Subject: ${options.subject}`,
                  `MIME-Version: 1.0`,
                  `Content-Type: multipart/alternative; boundary="${boundary}"`,
                  ``,
                  `--${boundary}`,
                  `Content-Type: text/plain; charset=UTF-8`,
                  `Content-Transfer-Encoding: 7bit`,
                  ``,
                  options.textBody,
                  ``,
                  `--${boundary}`,
                  `Content-Type: text/html; charset=UTF-8`,
                  `Content-Transfer-Encoding: 7bit`,
                  ``,
                  options.htmlBody,
                  ``,
                  `--${boundary}--`,
                  `.`,
                ].join('\r\n');
                sendLine(message);
              } else {
                return fail(`Perintah DATA ditolak: ${line}`);
              }
            } else if (step === 8) {
              // DATA OK (250)
              if (code === 250) {
                step = 9;
                sendLine(`QUIT`);
                cleanup();
                return resolve({ success: true });
              } else {
                return fail(`Pesan ditolak oleh server SMTP: ${line}`);
              }
            }
          }
        });
      };

      const connectSocket = () => {
        try {
          if (options.secure || options.port === 465) {
            socket = tls.connect({
              host: options.host,
              port: options.port,
              servername: options.host,
              rejectUnauthorized: false,
            });
          } else {
            socket = net.connect({
              host: options.host,
              port: options.port,
            });
          }

          bindSocketEvents(socket);
        } catch (err: any) {
          fail(`Gagal memulai koneksi socket SMTP: ${err.message}`);
        }
      };

      connectSocket();
    });
  }
}
