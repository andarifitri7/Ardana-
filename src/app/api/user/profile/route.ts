import { NextRequest, NextResponse } from 'next/server';
import { tatadanaDb } from '@/lib/store/mock-db';
import { verifyPassword } from '@/lib/auth/security';
import { validateIndonesianPhone } from '@/lib/phone/service';

function getSessionUser(req: NextRequest): { userId: string | null; role: string | null; isAdmin: boolean } {
  const adminSession = req.cookies.get('ardana_admin_session')?.value;
  const sessionRole = req.cookies.get('ardana_session_role')?.value;
  const userId = req.cookies.get('ardana_user_id')?.value;

  if (adminSession || sessionRole === 'admin') {
    return { userId: 'usr_admin_main', role: 'admin', isAdmin: true };
  }
  if (userId) {
    return { userId, role: sessionRole || 'user', isAdmin: false };
  }
  return { userId: null, role: null, isAdmin: false };
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session.userId) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    let targetUserId = session.userId;
    // Superadmin can query specific user's profile
    if (session.isAdmin) {
      const queryUserId = req.nextUrl.searchParams.get('userId');
      if (queryUserId) {
        targetUserId = queryUserId;
      }
    }

    const user = tatadanaDb.getUserById(targetUserId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: user.profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat profil akun.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session.userId) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada sesi pengguna aktif. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Determine target user id
    let targetUserId = session.userId;
    if (session.isAdmin && body.target_user_id) {
      targetUserId = body.target_user_id;
    } else if (!session.isAdmin && body.target_user_id && body.target_user_id !== session.userId) {
      tatadanaDb.addAuditLog('Percobaan pengubahan data akun lain tanpa izin ditolak', session.userId, {
        attempted_target: body.target_user_id,
      });
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda hanya dapat memperbarui data akun Anda sendiri.' },
        { status: 403 }
      );
    }

    const targetUser = tatadanaDb.getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Akun pengguna tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    // Security RBAC: User cannot escalate privileges or manipulate administrative fields
    if (!session.isAdmin) {
      const restrictedFields = [
        'role',
        'is_superadmin',
        'account_status',
        'subscription_tier',
        'subscription_status',
        'email_verified',
        'phone_verified',
      ];
      const attemptedRestricted = restrictedFields.filter(
        (field) => field in body && body[field] !== (targetUser.profile as any)[field]
      );

      if (attemptedRestricted.length > 0) {
        tatadanaDb.addAuditLog('Percobaan eskalasi hak akses / manipulasi status ditolak', session.userId, {
          attempted_fields: attemptedRestricted,
        });
        return NextResponse.json(
          {
            success: false,
            error: `Akses ditolak: Anda tidak memiliki izin untuk mengubah ${attemptedRestricted.join(', ')}.`,
          },
          { status: 403 }
        );
      }
    }

    // 1. Validation: Full Name
    if (body.full_name !== undefined) {
      if (typeof body.full_name !== 'string') {
        return NextResponse.json({ success: false, error: 'Nama lengkap harus berupa teks.' }, { status: 400 });
      }
      const cleanName = body.full_name.trim();
      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json({ success: false, error: 'Nama lengkap minimal 2 karakter.' }, { status: 400 });
      }
      if (cleanName.length > 60) {
        return NextResponse.json({ success: false, error: 'Nama lengkap maksimal 60 karakter.' }, { status: 400 });
      }
    }

    // 2. Validation: Email and Unique Check
    let cleanEmail: string | undefined = undefined;
    if (body.email !== undefined) {
      if (typeof body.email !== 'string') {
        return NextResponse.json({ success: false, error: 'Format email tidak valid.' }, { status: 400 });
      }
      cleanEmail = body.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return NextResponse.json({ success: false, error: 'Format alamat email tidak valid.' }, { status: 400 });
      }

      // Check email uniqueness against other users
      if (cleanEmail !== targetUser.email.toLowerCase()) {
        const existingWithEmail = tatadanaDb.getUserByEmail(cleanEmail);
        if (existingWithEmail && existingWithEmail.id !== targetUserId) {
          return NextResponse.json(
            { success: false, error: 'Alamat email ini sudah terdaftar pada akun lain.' },
            { status: 400 }
          );
        }
      }
    }

    // 3. Validation: Phone Number
    let normalizedPhone: string | null | undefined = undefined;
    if (body.phone_number !== undefined) {
      if (typeof body.phone_number !== 'string') {
        return NextResponse.json({ success: false, error: 'Format nomor handphone tidak valid.' }, { status: 400 });
      }
      const rawPhone = body.phone_number.trim();
      if (rawPhone) {
        const validation = validateIndonesianPhone(rawPhone);
        if (!validation.isValid) {
          return NextResponse.json(
            { success: false, error: validation.error || 'Format nomor HP Indonesia tidak valid.' },
            { status: 400 }
          );
        }
        normalizedPhone = validation.normalized;
      } else {
        normalizedPhone = null;
      }
    }

    // 4. Password Change (if requested)
    if (body.new_password !== undefined && body.new_password !== '') {
      if (typeof body.new_password !== 'string' || body.new_password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi baru minimal 6 karakter.' },
          { status: 400 }
        );
      }

      // If user is changing own password, current password is required
      if (!session.isAdmin || targetUserId === session.userId) {
        if (!body.current_password) {
          return NextResponse.json(
            { success: false, error: 'Kata sandi saat ini (lama) wajib diisi untuk verifikasi keamanan.' },
            { status: 400 }
          );
        }
        const isCurrentValid = verifyPassword(body.current_password, targetUser.password_hash);
        if (!isCurrentValid) {
          return NextResponse.json(
            { success: false, error: 'Kata sandi saat ini yang Anda masukkan salah.' },
            { status: 400 }
          );
        }
      }

      // Update password hash using secure scrypt algorithm
      tatadanaDb.updatePassword(targetUserId, body.new_password);
      tatadanaDb.addAuditLog('Kata sandi akun berhasil diubah (scrypt hash)', targetUserId, {
        updated_by: session.userId,
      });
    }

    // 5. Validation: Avatar URL
    if (body.avatar_url !== undefined) {
      if (typeof body.avatar_url !== 'string') {
        return NextResponse.json({ success: false, error: 'URL foto avatar tidak valid.' }, { status: 400 });
      }
      const cleanAvatar = body.avatar_url.trim();
      if (
        cleanAvatar &&
        !cleanAvatar.startsWith('http://') &&
        !cleanAvatar.startsWith('https://') &&
        !cleanAvatar.startsWith('data:image/')
      ) {
        return NextResponse.json(
          { success: false, error: 'URL foto harus diawali http://, https://, atau data:image/' },
          { status: 400 }
        );
      }
    }

    // Build update payload
    const updatedCurrency = body.currency || body.default_currency;
    const updatePayload: any = {};
    if (body.full_name !== undefined) updatePayload.full_name = body.full_name.trim();
    if (cleanEmail !== undefined) updatePayload.email = cleanEmail;
    if (normalizedPhone !== undefined) updatePayload.phone_number = normalizedPhone;
    if (body.avatar_url !== undefined) updatePayload.avatar_url = body.avatar_url.trim();
    if (updatedCurrency !== undefined) {
      updatePayload.currency = updatedCurrency;
      updatePayload.default_currency = updatedCurrency;
    }
    if (body.saving_preference !== undefined) updatePayload.saving_preference = body.saving_preference;
    if (body.telegram_bot_token !== undefined) updatePayload.telegram_bot_token = body.telegram_bot_token;

    // Apply update to store (which synchronously updates user + profile and writes to .data/tatadana-store.json)
    const updated = tatadanaDb.updateProfile(updatePayload, targetUserId);

    tatadanaDb.addAuditLog('Profil diperbarui via API', targetUserId, {
      full_name: updated.full_name,
      email: updated.email,
      phone_number: updated.phone_number,
      default_currency: updated.default_currency,
      saving_preference: updated.saving_preference,
      updated_by: session.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Perubahan data akun berhasil disimpan ke database.',
      profile: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan saat menyimpan data akun.' },
      { status: 500 }
    );
  }
}
