import { SavingPlaceInfo, SavingPlaceId } from '@/types';

export const SAVING_PLACES: SavingPlaceInfo[] = [
  {
    id: 'rekening_bank',
    name: 'Rekening Tabungan Bank',
    badge: 'Simpanan Reguler',
    emoji: '🏦',
    categoryType: 'simpanan',
    isInvestment: false,
    shortDesc: 'Aman, likuiditas instan, dijamin LPS hingga Rp2 Miliar.',
    fungsi: 'Menyimpan dana operasional sehari-hari, dana darurat siaga, dan mempermudah transaksi perbankan harian.',
    kelebihan: [
      'Likuiditas sangat tinggi — penarikan uang bisa kapan saja via ATM, mobile banking, atau QRIS.',
      'Aman dan dijamin Lembaga Penjamin Simpanan (LPS) hingga Rp 2 Miliar per nasabah per bank.',
      'Dukungan ekosistem perbankan luas (transfer antar-bank, pembayaran tagihan, autodebet).',
    ],
    risiko: [
      'Bunga tabungan relatif rendah (0.1% - 1% per tahun), rentan tergerus laju inflasi.',
      'Terdapat biaya administrasi bulanan dan biaya transfer jika di luar kuota gratis.',
    ],
    likuiditas: 'Sangat Tinggi (Real-time 24/7).',
    halDiperhatikan: [
      'Pastikan saldo memenuhi ketentuan batas saldo minimum bank agar tidak terkena denda saldo.',
      'Pilih bank dengan biaya admin rendah atau bebas biaya admin jika saldo tabungan masih dalam skala awal.',
    ],
    lpsGuarantee: 'Dijamin LPS (Sesuai syarat batas bunga LPS & saldo maks Rp2 Miliar).',
  },
  {
    id: 'ewallet',
    name: 'Dompet Digital / E-Wallet',
    badge: 'Transaksional Mikro',
    emoji: '📱',
    categoryType: 'transaksional',
    isInvestment: false,
    shortDesc: 'Sangat praktis untuk belanja online & QRIS mikro harian.',
    fungsi: 'Memfasilitasi transaksi mikro harian non-tunai, belanja online, transportasi, pesan makanan, dan transfer cepat.',
    kelebihan: [
      'Sangat praktis, transaksi cepat tinggal scan QRIS atau transfer nomor HP.',
      'Banyak promo potongan harga, cashback, dan integrasi ekosistem marketplace.',
      'Dapat dihubungkan langsung ke berbagai layanan pesan-antar dan ride-hailing.',
    ],
    risiko: [
      'Bukan simpanan perbankan, saldo di e-wallet TIDAK dijamin oleh Lembaga Penjamin Simpanan (LPS).',
      'Risiko keamanan siber jika akun di-takeover (OTP phising, social engineering).',
      'Kecenderungan konsumtif lebih tinggi karena kemudahan belanja yang instan.',
    ],
    likuiditas: 'Sangat Tinggi (Instan untuk belanja & transfer).',
    halDiperhatikan: [
      'Jangan simpan dana dalam jumlah besar (batasi maksimal sesuai kebutuhan mingguan/bulanan).',
      'Aktifkan verifikasi 2 langkah (2FA/biometrik) dan jangan pernah membagikan kode OTP ke siapa pun.',
    ],
    lpsGuarantee: 'TIDAK Dijamin LPS (Diawasi oleh Bank Indonesia sebagai Penyelenggara Jasa Pembayaran).',
  },
  {
    id: 'deposito',
    name: 'Deposito Berjangka Bank',
    badge: 'Simpanan Berjangka',
    emoji: '📑',
    categoryType: 'simpanan',
    isInvestment: false,
    shortDesc: 'Bunga lebih tinggi, modal pokok aman terlindungi LPS.',
    fungsi: 'Menyimpan dana yang belum akan digunakan dalam jangka waktu tertentu (1, 3, 6, atau 12 bulan) dengan imbal hasil pasti.',
    kelebihan: [
      'Suku bunga lebih tinggi dibanding tabungan biasa (3% - 6% p.a.).',
      'Pokok simpanan aman terjamin LPS selama suku bunga di bawah tingkat penjaminan LPS.',
      'Membantu disiplin finansial karena uang tidak mudah ditarik sebelum jatuh tempo.',
    ],
    risiko: [
      'Terdapat denda / biaya penalti penarikan jika dicairkan sebelum tanggal jatuh tempo.',
      'Bunga deposito dikenakan pajak penghasilan (PPh final) sebesar 20% jika nominal di atas Rp7.5 Juta.',
    ],
    likuiditas: 'Sedang (Terkunci sesuai tenor, pencairan dini terkena penalti).',
    halDiperhatikan: [
      'Pilihlah tenor yang sesuai dengan rencana penggunaan dana Anda.',
      'Pastikan tingkat suku bunga yang ditawarkan bank tidak melampaui tingkat bunga penjaminan LPS.',
    ],
    lpsGuarantee: 'Dijamin LPS (Hingga Rp2 Miliar jika suku bunga tidak melebihi tingkat bunga penjaminan LPS).',
  },
  {
    id: 'rdpu',
    name: 'Reksa Dana Pasar Uang (RDPU)',
    badge: 'Instrumen Investasi',
    emoji: '📈',
    categoryType: 'investasi',
    isInvestment: true,
    shortDesc: 'Potensi imbal hasil di atas deposito, bebas pajak, bebas denda cair.',
    fungsi: 'Instrumen investasi pasar modal berisiko rendah untuk menumbuhkan dana darurat dan tujuan finansial jangka pendek (kurang dari 1 tahun).',
    kelebihan: [
      'Potensi imbal hasil kompetitif (4% - 6% p.a.) dan BUKAN merupakan objek pajak.',
      'Tidak ada biaya pembelian, penjualan, maupun denda penalti pencairan.',
      'Dikelola oleh Manajer Investasi profesional berlisensi OJK dengan portofolio obligasi jangka pendek & deposito perbankan.',
    ],
    risiko: [
      'Merupakan produk investasi pasar modal: TIDAK dijamin oleh LPS dan nilai aktiva bersih (NAB) dapat berfluktuasi tipis.',
      'Pencairan membutuhkan waktu settlement (T+1 hingga T+2 hari kerja bursa, meski beberapa platform memiliki opsi instant redemption).',
    ],
    likuiditas: 'Tinggi (T+0 instant redemption s/d T+2 hari kerja).',
    halDiperhatikan: [
      'Ini adalah instrumen investasi, bukan simpanan bank reguler.',
      'Pilihlah Manajer Investasi bereputasi tinggi dengan dana kelolaan (AUM) besar dan rekam jejak konsisten.',
    ],
    lpsGuarantee: 'TIDAK Dijamin LPS (Diawasi dan diregulasi oleh OJK; dana disimpan di Bank Kustodian).',
  },
  {
    id: 'tempat_lainnya',
    name: 'Emas Fisik & Kas Cadangan',
    badge: 'Aset Fisik & Hedging',
    emoji: '🪙',
    categoryType: 'aset_fisik',
    isInvestment: true,
    shortDesc: 'Pelindung nilai terhadap inflasi jangka panjang & kas darurat fisik.',
    fungsi: 'Menjaga daya beli uang dalam jangka panjang (lindung nilai/hedging) atau memiliki dana tunai fisik saat terjadi gangguan sistem elektronik.',
    kelebihan: [
      'Tahan terhadap devaluasi mata uang dan inflasi jangka panjang.',
      'Bentuk fisik riil yang dapat disimpan sendiri di safe deposit box atau brankas aman.',
      'Diterima secara universal sebagai aset lindung nilai.',
    ],
    risiko: [
      'Risiko kehilangan fisik (pencurian/kehilangan).',
      'Terdapat selisih harga beli dan harga jual kembali (spread) yang signifikan dalam jangka pendek.',
      'Tidak menghasilkan arus kas atau dividen rutin.',
    ],
    likuiditas: 'Sedang (Perlu mendatangi toko emas/butik logam mulia untuk menjual kembali).',
    halDiperhatikan: [
      'Cocok untuk horizon waktu di atas 3-5 tahun, bukan untuk dana kebutuhan bulanan.',
      'Simpan bukti nota pembelian dan sertifikat keaslian dengan aman.',
    ],
    lpsGuarantee: 'TIDAK Dijamin LPS (Aset komoditas fisik/kas mandiri).',
  },
];

export function getSavingPlaceById(id: string): SavingPlaceInfo | undefined {
  return SAVING_PLACES.find(p => p.id === id);
}
