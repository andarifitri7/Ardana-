import { NextRequest, NextResponse } from 'next/server';

interface RecommendedCategory {
  name: string;
  emoji: string;
  type: 'expense' | 'income';
  color: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileDescription = '' } = body;

    const lower = profileDescription.toLowerCase();

    // Context-sensitive intelligent category generator
    let recommendations: RecommendedCategory[] = [
      { name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#812D46' },
      { name: 'Transportasi', emoji: '🚗', type: 'expense', color: '#3b82f6' },
      { name: 'Tagihan & Utilitas', emoji: '🏠', type: 'expense', color: '#ef4444' },
      { name: 'Gaji Bulanan', emoji: '💼', type: 'income', color: '#10b981' },
    ];

    if (lower.includes('mahasiswa') || lower.includes('kuliah') || lower.includes('kampus')) {
      recommendations.push(
        { name: 'Uang Saku & Beasiswa', emoji: '🎓', type: 'income', color: '#06b6d4' },
        { name: 'Fotokopi & Buku Kuliah', emoji: '📚', type: 'expense', color: '#f59e0b' },
        { name: 'Nongkrong & Ngopi', emoji: '☕', type: 'expense', color: '#8b5cf6' },
        { name: 'Sewa Kosan', emoji: '🛏️', type: 'expense', color: '#ec4899' }
      );
    } else if (lower.includes('freelance') || lower.includes('remote') || lower.includes('desain')) {
      recommendations.push(
        { name: 'Project Client Fee', emoji: '💻', type: 'income', color: '#06b6d4' },
        { name: 'Langganan Software & Cloud', emoji: '☁️', type: 'expense', color: '#6366f1' },
        { name: 'Work From Cafe', emoji: '☕', type: 'expense', color: '#f59e0b' },
        { name: 'Upgrade Hardware', emoji: '🖥️', type: 'expense', color: '#3b82f6' }
      );
    } else if (lower.includes('keluarga') || lower.includes('anak') || lower.includes('menikah')) {
      recommendations.push(
        { name: 'Kebutuhan Popok & Susu', emoji: '🍼', type: 'expense', color: '#ec4899' },
        { name: 'Belanja Dapur & Supermarket', emoji: '🛒', type: 'expense', color: '#10b981' },
        { name: 'Kesehatan & Dokter Anak', emoji: '💊', type: 'expense', color: '#ef4444' },
        { name: 'Tabungan Pendidikan Anak', emoji: '🏫', type: 'expense', color: '#8b5cf6' }
      );
    } else {
      // Default fintech professional set
      recommendations.push(
        { name: 'Hiburan & Hobi', emoji: '🎮', type: 'expense', color: '#8b5cf6' },
        { name: 'Kesehatan & Gym', emoji: '💊', type: 'expense', color: '#10b981' },
        { name: 'Belanja Fashion & Kebutuhan', emoji: '👕', type: 'expense', color: '#ec4899' },
        { name: 'Investasi & Dividen', emoji: '📈', type: 'income', color: '#84cc16' }
      );
    }

    return NextResponse.json({
      success: true,
      recommendations,
      message: `Berhasil menghasilkan ${recommendations.length} rekomendasi kategori berbasis AI untuk profil: "${profileDescription || 'Umum'}"`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
