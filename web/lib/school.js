export const FOUNDED = 2003;
export const VIDEO_ID = 'VFZLOky6AkA';

export const SOCIALS = [
  { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/smklimpung' },
  { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/smk_maarifnu01_limpung/' },
  { key: 'youtube', label: 'YouTube', url: 'https://youtube.com/@smkmaarifnu01limpung' },
  { key: 'x', label: 'X', url: 'https://x.com/sekolahkeren_' },
];

export const PROGRAMS = [
  { slug: 'akuntansi', code: 'AKL', icon: 'Calculator', name: 'Akuntansi dan Keuangan Lembaga', text: 'Keterampilan mengelola keuangan, pencatatan transaksi, pajak, dan layanan perbankan.', tracks: 'Akuntansi · Layanan Perbankan' },
  { slug: 'pemasaran', code: 'PM', icon: 'Megaphone', name: 'Pemasaran', text: 'Prinsip ekonomi serta keterampilan menjual produk dan layanan jasa marketing.', tracks: 'Bisnis · Digital Marketing' },
  { slug: 'teknik-otomotif', code: 'TO', icon: 'Wrench', name: 'Teknik Otomotif', text: 'Perawatan dan pengembangan mesin sepeda motor melalui praktik di bengkel.', tracks: 'Teknik Sepeda Motor' },
  { slug: 'pplg', code: 'PPLG', icon: 'CodeXml', name: 'Pengembangan Perangkat Lunak dan GIM', text: 'Program keahlian yang berkonsentrasi pada bidang informatika, aplikasi, dan gim.', tracks: 'Perangkat Lunak · GIM' },
];

export const FEATURES = [
  { icon: 'Trophy', title: 'Beasiswa Prestasi', text: 'Apresiasi bagi peserta didik berprestasi akademik dan nonakademik.', href: '/berita?q=beasiswa' },
  { icon: 'Users', title: 'Guru Berpengalaman', text: 'Tenaga pendidik dan kependidikan yang mendampingi setiap siswa.', href: '/guru-dan-staff' },
  { icon: 'Building2', title: 'Fasilitas Lengkap', text: 'Ruang praktik, Nusa Sport Center, musholla, dan pondok pesantren.', href: '/fasilitas' },
  { icon: 'Handshake', title: 'Mitra Industri', text: 'Dipercaya oleh berbagai industri dan organisasi kelas nasional.', href: '/tentang-kami' },
];

export const FACILITIES = [
  { slug: 'nusa-sport-center', title: 'Nusa Sport Center', text: 'Sarana olahraga modern untuk siswa yang aktif dan sehat.' },
  { slug: 'laboratorium-akl', title: 'Ruang Praktik AKL', text: 'Dirancang dengan standar industri untuk praktik siswa AKL.' },
  { slug: 'business-center', title: 'Business Center', text: 'Tempat siswa mempraktikkan bisnis di lingkungan nyata.' },
  { slug: 'laboratorium-to', title: 'Ruang Praktik Otomotif', text: 'Menyerupai bengkel profesional dengan peralatan praktik.' },
  { slug: 'laboratorium-pplg', title: 'Ruang Praktik PPLG', text: 'Laboratorium untuk belajar membangun perangkat lunak.' },
  { slug: 'asrama', title: 'Pondok Al-Hasani', text: 'Membentuk generasi mandiri, disiplin, dan berakhlak mulia.' },
];

// Foto terbaru dari sekolah, menggantikan foto bawaan WordPress.
export const FACILITY_PHOTOS = {
  asrama: '/uploads/foto/fasilitas-alhasani.webp',
  'laboratorium-akl': '/uploads/foto/fasilitas-akl.webp',
  'business-center': '/uploads/foto/fasilitas-business-center.webp',
  'laboratorium-to': '/uploads/foto/fasilitas-otomotif.webp',
  'laboratorium-pplg': '/uploads/foto/fasilitas-pplg.webp',
};

export const MISSIONS = [
  'Membentuk peserta didik untuk rajin dalam beribadah',
  'Membentuk peserta didik berkompetensi di bidangnya',
  'Membentuk peserta didik berprestasi di bidang nonakademik',
  'Membentuk peserta didik berjiwa jujur, disiplin, dan bertanggung jawab',
];
export const VISION = 'Menghasilkan sumber daya manusia yang bertakwa, profesional, berdaya saing global, dan berakhlakul karimah.';

export const TESTIMONIALS = [
  { name: 'H. Yaqut Cholil Qoumas', role: 'Menteri Agama Kabinet Indonesia Maju', text: "Dari SMK Ma'arif NU 01 Limpung, mari kibarkan semangat membangun peradaban untuk Indonesia Maju." },
  { name: 'Dr. H. Wihaji, S.Ag., M.Pd', role: 'Menteri Kependudukan Kabinet Merah Putih', text: "SMK Ma'arif NU 01 Limpung mempunyai anak didik luar biasa dan diberikan keterampilan-keterampilan yang cukup sehingga sekarang alumninya menyebar ke mana-mana." },
  { name: 'Septiana Tahani, S.Sos', role: 'Alumni & Influencer', text: 'Sekolah ini tidak hanya memberikan saya pengetahuan akademik, tetapi juga membantu saya mengembangkan karakter, percaya diri, dan kemampuan sosial yang sangat berguna dalam menghadapi dunia nyata.' },
];

export const PARTNERS = [
  ['BNI', 'bni'], ['BRI', 'bri'], ['Honda', 'honda'], ['AHM', 'ahm'], ['Alfamart', 'alfamart'],
  ['Ramayana', 'ramayana'], ['Dinustek', 'dinustek'], ['KITB', 'kitb'], ['LPK', 'lpk'],
].map(([name, file]) => ({ name, src: `/uploads/2025/07/${file}.webp` }));
