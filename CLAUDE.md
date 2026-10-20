Claude

# MyFinance PWA — Aturan Proyek

## Produk

PWA keuangan pribadi, offline-first, dipasang ke Home Screen iPhone. Stack: Vite + React + TypeScript (strict) + Tailwind + Dexie + vite-plugin-pwa + Supabase. Tidak ada backend kustom.

## Arsitektur (tidak boleh dilanggar)

- Dexie/IndexedDB adalah sumber kebenaran. UI TIDAK BOLEH menunggu jaringan. App harus berfungsi penuh tanpa login dan tanpa internet.
- `src/domain/` TIDAK BOLEH meng-import React. Semua aturan bisnis ada di sana dan diuji.
- Tanpa repository layer. Komponen memakai hooks (`useLedger`, `useSetting`) dan fungsi domain.
- Uang selalu bilangan bulat Rupiah (`Number.isSafeInteger`). Jangan pakai desimal untuk uang.
- **Tidak ada kolom saldo tersimpan.** Saldo dompet SELALU dihitung dari `openingBalance` + transaksi (`computeBalances`). Jangan menambah kolom `balance` atau `usageCount`.
- Semua mutasi transaksi hanya lewat `ledger.ts` (`saveTransaction`, `updateTransaction`, `softDeleteTransaction`, `undeleteTransaction`) di dalam transaksi Dexie. Validasi ada di satu tempat (`validate`).
- Pengeluaran = Σ expense.amount + Σ transfer.adminFee. Pokok transfer BUKAN pengeluaran.
- Hapus = soft delete (`isDeleted = 1`) dan idempotent.
- Setiap mutasi: `updatedAt = Date.now()`, `dirty = 1`. Setelah commit, panggil `emitLedgerChanged()`.
- Flag selalu `0 | 1` (IndexedDB tidak bisa mengindeks boolean atau null). Jangan indeks kolom yang bisa `null`.
- ID: `crypto.randomUUID()`. Pengecualian: seed (ID tetap, `updatedAt = 0`, `dirty = 0`) dan transaksi tagihan (`bill:{billId}:{dueAt}`).
- Waktu = epoch ms. `dateKey` = 'YYYY-MM-DD' waktu lokal.
- Setting dengan `local = 1` tidak pernah disinkronkan.
- Sync: last-write-wins per baris, tanpa FK di server, `user_id` selalu dari sesi. Jangan pernah memakai service-role key di klien.

## Platform (iOS PWA)

- Pengembang memakai Windows, tanpa Mac. Pengujian iPhone lewat URL preview Vercel (HTTPS).
- `crypto.randomUUID`, service worker, WebCrypto butuh secure context.
- Haptic TIDAK tersedia di Safari iOS: gunakan umpan balik visual. `lib/haptic.ts` boleh no-op.
- Semua `input`/`textarea`/`select` font-size ≥ 16px. Gunakan `100dvh` dan `env(safe-area-inset-*)`.
- Jangan pernah menyatakan perilaku iOS (penyimpanan persisten, OAuth standalone, Back Tap, overlay App Switcher, instalasi) sebagai "terverifikasi" tanpa bukti uji di iPhone. Tandai: "BELUM DIVERIFIKASI DI iPHONE".

## Gaya

- TypeScript strict; hindari `any`. Gunakan `import type` untuk tipe.
- Tema OLED: bg `#000000`, surface `#121214`, border `#262629`, primary `#6366F1`, danger `#F43F5E`, success `#10B981`, warning `#F59E0B`.
- Kelas Tailwind harus ditulis utuh (tidak dirakit dari string dinamis).
- Tanpa dependensi baru tanpa bertanya.

## Proses (wajib tiap step)

1. Kerjakan HANYA step yang diminta; jangan ubah file di luar scope.
2. Jalankan dan tempel output ASLI: `npx tsc -b`, `npm run lint`, `npx vitest run`, `npm run build`.
3. Jangan mengklaim sukses tanpa menampilkan output tersebut. Jika gagal: perbaiki atau laporkan, jangan dilewati diam-diam.
4. Jika API paket berbeda dari contoh di guide, sesuaikan dengan versi terpasang (`package-lock.json`) dan jelaskan perubahan, tanpa mengubah logika bisnis.
5. Di akhir: daftar file yang dibuat/diubah dan setiap deviasi dari guide.

 