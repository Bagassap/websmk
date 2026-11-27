// Pesan singkat yang ditampilkan setelah aksi admin, dikirim lewat ?pesan=kode.
export const FLASH: Record<string, { text: string; error?: boolean }> = {
  tersimpan: { text: 'Perubahan tersimpan.' },
  sampah: { text: 'Dipindahkan ke Sampah. Data masih bisa dipulihkan.' },
  password: { text: 'Password berhasil diganti.' },
  unggah: { text: 'Gambar diunggah dan dikompres ke WebP.' },
  'gambar-kosong': { text: 'Pilih file gambar.', error: true },
  'gambar-besar': { text: 'Ukuran gambar maksimal 15 MB.', error: true },
  'gambar-format': { text: 'Format harus JPG, PNG, WEBP, atau GIF.', error: true },
  'guru-simpan': { text: 'Data guru tersimpan.' },
  'guru-hapus': { text: 'Data guru dihapus.' },
  'guru-nama': { text: 'Nama wajib diisi.', error: true },
  'guru-duplikat': { text: 'Nama dan jabatan yang sama sudah ada.', error: true },
  pengaturan: { text: 'Pengaturan tersimpan.' },
};

export const UPLOAD_ERRORS = {
  'gambar-kosong': FLASH['gambar-kosong'].text,
  'gambar-besar': FLASH['gambar-besar'].text,
  'gambar-format': FLASH['gambar-format'].text,
} as const;
export type UploadError = keyof typeof UPLOAD_ERRORS;
