04 vibe coding guide pwa

# 🛠️ Panduan Vibe Coding — MyFinance PWA (Step-by-Step + Full Code)

> **STATUS KODE:** Ditulis dari pengetahuan API paket, **belum dikompilasi atau dijalankan**. [Medium confidence] strukturnya benar; hampir pasti ada beberapa error kecil akibat beda versi paket (terutama Tailwind, react-router, Dexie, Supabase, Vite template). Tempel error ke AI agent dengan prompt: *"Ini error akibat beda versi paket. Baca versi terpasang di package-lock.json, sesuaikan API call-nya, jangan ubah logika bisnis."*

## 0. Cara Memakai

1. Taruh `CLAUDE.md` di root repo (agen membacanya).
2. Kerjakan **satu step per satu waktu**. Setelah tiap step jalankan:
  ```bash
  npx tsc -b && npm run lint && npx vitest run && npm run build

  ```
3. Commit tiap akhir step: `git add -A && git commit -m "fase1-step3"`.
4. Uji di iPhone lewat **URL preview Vercel** (HTTPS), dari PWA yang terpasang di Home Screen. Jangan memasukkan data penting sebelum Fase 0 lolos.
5. Template prompt per step:
  ```text
  Konteks: baca CLAUDE.md dan 04_vibe_coding_guide_pwa.md bagian "<NAMA STEP>".Tugas: implementasikan HANYA step itu; buat/ubah HANYA file yang disebut.Selesai bila: tsc, lint, vitest, build bersih. Tempel output ASLI.Jika API paket berbeda dari contoh, sesuaikan dengan versi terpasang dan jelaskan perubahannya.

  ```

---

# FASE 0 — Spike di iPhone 🔒

## Step 0.1 — Scaffold

```bash
npm create vite@latest myfinance-pwa -- --template react-ts
cd myfinance-pwa
npm install
npm install dexie dexie-react-hooks react-router-dom recharts @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest fake-indexeddb
git init

```

Tambahkan di `package.json` bagian `scripts`: `"test": "vitest run"`.

## Step 0.2 — Konfigurasi Vite + PWA

`vite.config.ts` (dipakai sampai akhir)

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'MyFinance',
        short_name: 'MyFinance',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});

```

**Ikon:** siapkan satu gambar persegi 1024px `public/icon-source.png`, lalu hasilkan ikon (nama file hasil harus cocok dengan manifest di atas: `pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png`, `apple-touch-icon.png`):

```bash
npx @vite-pwa/assets-generator --preset minimal-2023 public/icon-source.png

```

> Nama file dan preset keluaran generator bisa berbeda antar versi (**needs verification**). Jika berbeda, sesuaikan `manifest.icons` dan `includeAssets`.

`index.html` (ganti isi `<head>`)

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#000000" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="MyFinance" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="icon" href="/favicon.ico" />
    <title>MyFinance</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

`vercel.json`

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

```

`src/index.css` (dipakai sampai akhir; Tailwind v4 style)

```css
@import "tailwindcss";

@theme {
  --color-bg: #000000;
  --color-surface: #121214;
  --color-border: #262629;
  --color-primary: #6366f1;
  --color-danger: #f43f5e;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-dim: #8e8e93;
}

html, body, #root { height: 100%; background: #000; color: #fff; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
}
input, textarea, select { font-size: 16px; } /* cegah zoom otomatis Safari */
button { cursor: pointer; }

```

> Jika memakai Tailwind versi lama (v3), setup berbeda (`tailwind.config`, `@tailwind base`). Minta agen menyesuaikan dengan versi terpasang.

## Step 0.3 — Halaman Spike

`src/features/spike/Spike.tsx`

```tsx
import { useEffect, useState } from 'react';
import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

const sdb = new Dexie('spike');
sdb.version(1).stores({ meta: 'key' });

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const sb = url && anon ? createClient(url, anon) : null;

export default function Spike() {
  const [info, setInfo] = useState<Record<string, string>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void (async () => {
      const out: Record<string, string> = {};
      const nav = navigator as Navigator & { standalone?: boolean };
      out.standalone = String(
        window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true,
      );
      out.dariShortcut = String(new URLSearchParams(location.search).get('from') ?? '-');
      out.secureContext = String(window.isSecureContext);
      out.randomUUID = typeof crypto.randomUUID === 'function' ? 'ada' : 'TIDAK ADA';
      out.online = String(navigator.onLine);
      out.userAgent = navigator.userAgent;

      const meta = sdb.table('meta');
      const first = await meta.get('firstSeen');
      if (!first) {
        await meta.put({ key: 'firstSeen', value: Date.now() });
        out.firstSeen = 'BARU dibuat sekarang';
      } else {
        out.firstSeen = new Date(first.value as number).toLocaleString('id-ID');
      }
      const opens = (((await meta.get('opens'))?.value as number | undefined) ?? 0) + 1;
      await meta.put({ key: 'opens', value: opens });
      out.jumlahBuka = String(opens);

      try {
        out.persistedSebelumnya = String(await navigator.storage?.persisted?.());
        out.persistRequest = String(await navigator.storage?.persist?.());
        const est = await navigator.storage?.estimate?.();
        out.kuota = est ? `${est.usage} / ${est.quota}` : 'n/a';
      } catch (e) {
        out.persistError = String(e);
      }
      setInfo(out);
    })();

    if (sb) {
      void sb.auth.getSession().then(({ data }) => setSession(data.session));
      const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
      return () => data.subscription.unsubscribe();
    }
  }, []);

  return (
    <div className="p-4 pb-24 space-y-4 text-sm">
      <h1 className="text-xl font-bold">Spike PWA</h1>
      <div className="rounded-xl border border-border bg-surface p-3 space-y-1 break-all">
        {Object.entries(info).map(([k, v]) => (
          <div key={k}><span className="text-dim">{k}:</span> {v}</div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <h2 className="font-semibold">Uji login</h2>
        {!sb && <p className="text-warning">VITE_SUPABASE_URL / ANON_KEY belum diisi.</p>}
        {sb && session && (
          <>
            <p className="text-success">Masuk sebagai {session.user.email}</p>
            <button className="h-11 px-4 rounded-xl border border-border" onClick={() => void sb.auth.signOut()}>
              Keluar
            </button>
          </>
        )}
        {sb && !session && (
          <>
            <button
              className="h-11 w-full rounded-xl bg-primary"
              onClick={() =>
                void sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/spike' } })
              }
            >
              Masuk dengan Google
            </button>
            <input className="w-full h-11 rounded-xl border border-border bg-bg px-3" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button
              className="h-11 w-full rounded-xl border border-border"
              onClick={async () => {
                const { error } = await sb.auth.signInWithOtp({ email });
                setMsg(error ? error.message : 'Kode dikirim. Masukkan kode di bawah.');
              }}
            >
              Kirim kode OTP
            </button>
            <input className="w-full h-11 rounded-xl border border-border bg-bg px-3" placeholder="kode 6 digit" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
            <button
              className="h-11 w-full rounded-xl border border-border"
              onClick={async () => {
                const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
                setMsg(error ? error.message : 'Berhasil');
              }}
            >
              Verifikasi kode
            </button>
            {msg && <p className="text-dim">{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}

```

`src/main.tsx` (sementara)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Spike from './features/spike/Spike';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Spike />
  </StrictMode>,
);

```

> Template email OTP Supabase harus menampilkan kode: ubah template "Magic Link/OTP" agar memuat `{{ .Token }}`. Redirect URL OAuth (`https://domain/spike`) harus didaftarkan di Supabase (Authentication → URL Configuration) dan di OAuth client Google.

## Step 0.4 — Deploy & Uji

1. Push ke GitHub (privat), impor ke Vercel, isi env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
2. Di Safari iPhone buka `https://<domain>/spike` → Bagikan → **Add to Home Screen** → buka dari ikon.
3. Lakukan checklist Fase 0 di `03_roadmap_pwa.md` dan **tulis hasilnya**:


| Uji                                                           | Hasil (lolos/gagal + catatan) |
| ------------------------------------------------------------- | ----------------------------- |
| `standalone = true` saat dibuka dari ikon                     |                          |
| `jumlahBuka` bertambah, `firstSeen` tetap — besok             |                          |
| — 3 hari                                                      |                          |
| — 7 hari                                                      |                          |
| Mode pesawat: app terbuka                                     |                          |
| Login Google di PWA: sesi bertahan setelah tutup-buka         |                          |
| Login email OTP: sesi bertahan                                |                          |
| Shortcut/Back Tap → `?from=shortcut`: `standalone` true/false |                          |


Ikuti pohon keputusan di roadmap sebelum lanjut.

---

# FASE 1 — Fondasi, Tema OLED & Database Lokal

## Step 1.1 — Helper (`src/lib/`)

`id.ts`

```ts
export const newId = (): string => crypto.randomUUID();

```

`dates.ts`

```ts
export const DAY_MS = 86_400_000;

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
export function addDays(ms: number, n: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + n);
  return d.getTime();
}
export function startOfMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
export function startOfNextMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}
export function daysInMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
/** Tambah bulan dengan menjepit tanggal (31 Jan + 1 bln = 28/29 Feb). */
export function addMonthsClamped(ms: number, n: number): number {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = d.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), last), d.getHours(), d.getMinutes(), d.getSeconds()).getTime();
}
export function dateKey(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

```

`format.ts`

```ts
const nf = new Intl.NumberFormat('id-ID');
export const rp = (v: number): string => (v < 0 ? '-' : '') + 'Rp ' + nf.format(Math.abs(v));
export const num = (v: number): string => nf.format(v);

const dtf = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' });
export const formatDateTime = (ms: number): string => dtf.format(new Date(ms));

const dayf = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const formatDay = (ms: number): string => dayf.format(new Date(ms));

```

`expr.ts` (logika numpad, murni dan teruji)

```ts
import { num } from './format';

const TOKEN = /\d+|[+-]/g;

/** "25000+5000-1000" -> 29000, dihitung kiri ke kanan; tidak pernah < 0. */
export function evalExpr(e: string): number {
  let total = 0;
  let sign = 1;
  for (const m of e.matchAll(TOKEN)) {
    const t = m[0];
    if (t === '+') sign = 1;
    else if (t === '-') sign = -1;
    else total += sign * Number.parseInt(t, 10);
  }
  return total < 0 ? 0 : total;
}

export function prettyExpr(e: string): string {
  return e.replace(/\d+/g, (d) => num(Number.parseInt(d, 10)));
}

export function pressDigit(e: string, d: string): string {
  if (e.length >= 18) return e;
  const last = /\d+$/.exec(e)?.[0];
  if (last === undefined && (d === '0' || d === '000')) return e;
  if (last === '0') {
    if (d === '0' || d === '000') return e;
    return e.slice(0, -1) + d;
  }
  return e + d;
}

export function pressOp(e: string, op: '+' | '-'): string {
  if (e === '') return e;
  if (/[+-]$/.test(e)) return e.slice(0, -1) + op;
  return e + op;
}

export const pressBack = (e: string): string => e.slice(0, -1);

```

`expr.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { evalExpr, pressDigit, pressOp, prettyExpr } from './expr';

describe('expr', () => {
  it('menghitung kiri ke kanan', () => expect(evalExpr('25000+5000-1000')).toBe(29000));
  it('hasil negatif dijepit ke 0', () => expect(evalExpr('100-500')).toBe(0));
  it('tidak ada nol di depan', () => {
    expect(pressDigit('', '0')).toBe('');
    expect(pressDigit('', '000')).toBe('');
    expect(pressDigit('0', '5')).toBe('5');
    expect(pressDigit('5', '000')).toBe('5000');
  });
  it('operator ganti operator, tidak di awal', () => {
    expect(pressOp('', '+')).toBe('');
    expect(pressOp('5+', '-')).toBe('5-');
  });
  it('batas panjang', () => expect(pressDigit('1'.repeat(18), '1')).toBe('1'.repeat(18)));
  it('format ribuan', () => expect(prettyExpr('25000+5')).toBe('25.000+5'));
});

```

`events.ts`

```ts
const bus = new EventTarget();
export const emitLedgerChanged = (): void => {
  bus.dispatchEvent(new Event('ledger-changed'));
};
export const onLedgerChanged = (fn: () => void): (() => void) => {
  bus.addEventListener('ledger-changed', fn);
  return () => bus.removeEventListener('ledger-changed', fn);
};

```

`haptic.ts` (Safari iOS tidak mendukung getar; Android ya)

```ts
export function haptic(kind: 'light' | 'success' | 'error' = 'light'): void {
  try {
    const ms = kind === 'light' ? 8 : kind === 'success' ? 15 : 40;
    navigator.vibrate?.(ms);
  } catch {
    /* tidak didukung */
  }
}

```

`share.ts`

```ts
/** Di iOS: Web Share dengan berkas (bisa "Simpan ke Berkas"). Fallback: unduh biasa. */
export async function shareOrDownload(content: string, filename: string, mime: string): Promise<void> {
  const file = new File([content], filename, { type: mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

```

`storage.ts`

```ts
export async function requestPersist(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
export async function storageInfo(): Promise<{ persisted: boolean; usage: number; quota: number }> {
  const est = await navigator.storage?.estimate?.();
  return {
    persisted: (await navigator.storage?.persisted?.()) ?? false,
    usage: est?.usage ?? 0,
    quota: est?.quota ?? 0,
  };
}

```

## Step 1.2 — Skema & DB (`src/db/`)

`schema.ts`

```ts
export type Flag = 0 | 1;
export type WalletType = 'bank' | 'ewallet' | 'cash';
export type TxType = 'expense' | 'income' | 'transfer';
export type CategoryType = 'expense' | 'income';
export type Frequency = 'weekly' | 'monthly' | 'yearly';

export interface Syncable {
  updatedAt: number;
  isDeleted: Flag;
  dirty: Flag;
}

export interface Wallet extends Syncable {
  id: string;
  name: string;
  type: WalletType;
  openingBalance: number;
  colorHex: string;
  isDefault: Flag;
  excludeFromTotal: Flag;
  sortOrder: number;
}

export interface Category extends Syncable {
  id: string;
  name: string;
  type: CategoryType;
  colorHex: string;
  monthlyLimit: number | null;
  sortOrder: number;
}

export interface Tx extends Syncable {
  id: string;
  type: TxType;
  amount: number;
  walletId: string;
  destinationWalletId: string | null;
  adminFee: number;
  categoryId: string | null;
  note: string | null;
  occurredAt: number;
  dateKey: string;
  createdAt: number;
}

export interface Bill extends Syncable {
  id: string;
  name: string;
  amount: number;
  walletId: string;
  categoryId: string;
  frequency: Frequency;
  nextDueAt: number;
  autoRecord: Flag;
  isActive: Flag;
}

export interface Setting {
  key: string;
  value: unknown;
  updatedAt: number;
  dirty: Flag;
  local: Flag; // 1 = tidak pernah disinkronkan
}

```

`db.ts`

```ts
import Dexie from 'dexie';
import type { EntityTable } from 'dexie';
import type { Bill, Category, Setting, Tx, Wallet } from './schema';

export class AppDB extends Dexie {
  wallets!: EntityTable<Wallet, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Tx, 'id'>;
  bills!: EntityTable<Bill, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor() {
    super('myfinance');
    // Flag memakai 0/1 karena IndexedDB tidak bisa mengindeks boolean/null.
    this.version(1).stores({
      wallets: 'id, isDeleted, dirty, sortOrder',
      categories: 'id, type, isDeleted, dirty, sortOrder',
      transactions: 'id, occurredAt, dateKey, walletId, categoryId, isDeleted, dirty',
      bills: 'id, nextDueAt, isDeleted, dirty',
      settings: 'key, dirty',
    });
  }
}

export const db = new AppDB();

```

`seed.ts` (ID tetap, `updatedAt = 0`, `dirty = 0`)

```ts
import { db } from './db';
import type { Category, CategoryType, Wallet, WalletType } from './schema';

export const SEED = {
  walletMandiri: 'wallet_mandiri',
  walletGopay: 'wallet_gopay',
  walletCash: 'wallet_cash',
  catFood: 'cat_food',
  catTransport: 'cat_transport',
  catShop: 'cat_shop',
  catBill: 'cat_bill',
  catFun: 'cat_fun',
  catOtherExp: 'cat_other_exp',
  catSalary: 'cat_salary',
  catOtherInc: 'cat_other_inc',
} as const;

const w = (id: string, name: string, type: WalletType, colorHex: string, isDefault: 0 | 1, sortOrder: number): Wallet => ({
  id, name, type, colorHex, isDefault, sortOrder,
  openingBalance: 0, excludeFromTotal: 0, updatedAt: 0, isDeleted: 0, dirty: 0,
});

const c = (id: string, name: string, type: CategoryType, colorHex: string, sortOrder: number): Category => ({
  id, name, type, colorHex, sortOrder, monthlyLimit: null, updatedAt: 0, isDeleted: 0, dirty: 0,
});

export async function seedIfEmpty(): Promise<void> {
  if ((await db.wallets.count()) > 0) return;
  await db.transaction('rw', db.wallets, db.categories, async () => {
    await db.wallets.bulkPut([
      w(SEED.walletMandiri, 'Livin Mandiri', 'bank', '#0EA5E9', 1, 0),
      w(SEED.walletGopay, 'GoPay', 'ewallet', '#10B981', 0, 1),
      w(SEED.walletCash, 'Cash', 'cash', '#F59E0B', 0, 2),
    ]);
    await db.categories.bulkPut([
      c(SEED.catFood, 'Makan & Minum', 'expense', '#F43F5E', 0),
      c(SEED.catTransport, 'Transportasi', 'expense', '#0EA5E9', 1),
      c(SEED.catShop, 'Belanja & Game', 'expense', '#A855F7', 2),
      c(SEED.catBill, 'Tagihan', 'expense', '#F59E0B', 3),
      c(SEED.catFun, 'Hiburan', 'expense', '#EC4899', 4),
      c(SEED.catOtherExp, 'Lainnya', 'expense', '#8E8E93', 5),
      c(SEED.catSalary, 'Gaji', 'income', '#10B981', 6),
      c(SEED.catOtherInc, 'Lainnya', 'income', '#6366F1', 7),
    ]);
  });
}

```

## Step 1.3 — Domain (`src/domain/`, tanpa React)

`balances.ts` (fungsi murni)

```ts
import type { Category, Tx, Wallet } from '../db/schema';
import { addDays, dateKey } from '../lib/dates';

export function computeBalances(wallets: Wallet[], txs: Tx[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of wallets) if (!w.isDeleted) m.set(w.id, w.openingBalance);
  const add = (id: string, d: number) => {
    const cur = m.get(id);
    if (cur !== undefined) m.set(id, cur + d);
  };
  for (const t of txs) {
    if (t.isDeleted) continue;
    if (t.type === 'expense') add(t.walletId, -t.amount);
    else if (t.type === 'income') add(t.walletId, t.amount);
    else {
      add(t.walletId, -(t.amount + t.adminFee));
      if (t.destinationWalletId) add(t.destinationWalletId, t.amount);
    }
  }
  return m;
}

export function totalBalance(wallets: Wallet[], balances: Map<string, number>): number {
  let s = 0;
  for (const w of wallets) if (!w.isDeleted && !w.excludeFromTotal) s += balances.get(w.id) ?? 0;
  return s;
}

/** Pengeluaran satu transaksi: expense = amount; transfer = hanya biaya admin; income = 0. */
export function spentOf(t: Tx): number {
  if (t.isDeleted) return 0;
  if (t.type === 'expense') return t.amount;
  if (t.type === 'transfer') return t.adminFee;
  return 0;
}

/** Rentang setengah-terbuka [from, to). */
export function spentInRange(txs: Tx[], from: number, to: number): number {
  let s = 0;
  for (const t of txs) if (t.occurredAt >= from && t.occurredAt < to) s += spentOf(t);
  return s;
}

export function dailySpend(txs: Tx[], fromDay: number, days: number): { day: number; total: number }[] {
  const byKey = new Map<string, number>();
  for (const t of txs) {
    const s = spentOf(t);
    if (s) byKey.set(t.dateKey, (byKey.get(t.dateKey) ?? 0) + s);
  }
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(fromDay, i);
    return { day, total: byKey.get(dateKey(day)) ?? 0 };
  });
}

export function categorySpend(
  txs: Tx[], cats: Category[], from: number, to: number,
): { category: Category; total: number }[] {
  const totals = new Map<string, number>();
  for (const t of txs) {
    if (t.isDeleted || t.type !== 'expense' || !t.categoryId) continue;
    if (t.occurredAt < from || t.occurredAt >= to) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  return cats
    .filter((c) => totals.has(c.id))
    .map((category) => ({ category, total: totals.get(category.id) ?? 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Kategori terurut berdasarkan frekuensi pemakaian (90 hari), lalu sortOrder. */
export function sortByUsage(cats: Category[], txs: Tx[], now: number, windowDays = 90): Category[] {
  const since = addDays(now, -windowDays);
  const counts = new Map<string, number>();
  for (const t of txs) {
    if (t.isDeleted || !t.categoryId || t.occurredAt < since) continue;
    counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
  }
  return [...cats].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.sortOrder - b.sortOrder,
  );
}

```

`ledger.ts` (satu-satunya pintu mutasi)

```ts
import { db } from '../db/db';
import type { Flag, Tx, TxType, Wallet, WalletType } from '../db/schema';
import { dateKey } from '../lib/dates';
import { emitLedgerChanged } from '../lib/events';
import { newId } from '../lib/id';
import { computeBalances } from './balances';

export class LedgerError extends Error {}

export interface TxInput {
  type: TxType;
  amount: number;
  walletId: string;
  destinationWalletId?: string | null;
  adminFee?: number;
  categoryId?: string | null;
  note?: string | null;
  occurredAt?: number;
}

async function validate(input: TxInput): Promise<void> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new LedgerError('Nominal harus bilangan bulat lebih dari 0');
  }
  const fee = input.adminFee ?? 0;
  if (!Number.isSafeInteger(fee) || fee < 0) throw new LedgerError('Biaya admin tidak valid');

  const src = await db.wallets.get(input.walletId);
  if (!src || src.isDeleted) throw new LedgerError('Dompet sumber tidak valid');

  if (input.type === 'transfer') {
    const dest = input.destinationWalletId ? await db.wallets.get(input.destinationWalletId) : undefined;
    if (!dest || dest.isDeleted) throw new LedgerError('Dompet tujuan tidak valid');
    if (dest.id === src.id) throw new LedgerError('Dompet tujuan harus berbeda dari sumber');
  } else {
    if (!input.categoryId) throw new LedgerError('Kategori wajib diisi');
    const cat = await db.categories.get(input.categoryId);
    if (!cat || cat.isDeleted) throw new LedgerError('Kategori tidak valid');
    if (cat.type !== input.type) throw new LedgerError('Tipe kategori tidak cocok');
  }
}

function fields(input: TxInput, occurredAt: number) {
  const isTransfer = input.type === 'transfer';
  return {
    type: input.type,
    amount: input.amount,
    walletId: input.walletId,
    destinationWalletId: isTransfer ? (input.destinationWalletId ?? null) : null,
    adminFee: isTransfer ? (input.adminFee ?? 0) : 0,
    categoryId: isTransfer ? null : (input.categoryId ?? null),
    note: input.note?.trim() ? input.note.trim() : null,
    occurredAt,
    dateKey: dateKey(occurredAt),
  };
}

/** Dipanggil DI DALAM transaksi Dexie (dipakai juga oleh recurring). */
export async function insertValidated(input: TxInput, id: string = newId()): Promise<string> {
  await validate(input);
  const now = Date.now();
  const row: Tx = {
    id,
    ...fields(input, input.occurredAt ?? now),
    createdAt: now,
    updatedAt: now,
    isDeleted: 0,
    dirty: 1,
  };
  await db.transactions.add(row);
  return id;
}

export async function saveTransaction(input: TxInput): Promise<string> {
  const id = await db.transaction('rw', db.transactions, db.wallets, db.categories, () => insertValidated(input));
  emitLedgerChanged();
  return id;
}

export async function updateTransaction(id: string, input: TxInput): Promise<void> {
  await db.transaction('rw', db.transactions, db.wallets, db.categories, async () => {
    const cur = await db.transactions.get(id);
    if (!cur || cur.isDeleted) throw new LedgerError('Transaksi tidak ditemukan');
    await validate(input);
    await db.transactions.put({
      ...cur,
      ...fields(input, input.occurredAt ?? cur.occurredAt),
      updatedAt: Date.now(),
      dirty: 1,
    });
  });
  emitLedgerChanged();
}

/** Idempoten: panggilan kedua tidak mengubah apa pun (termasuk updatedAt). */
export async function softDeleteTransaction(id: string): Promise<void> {
  let changed = false;
  await db.transaction('rw', db.transactions, async () => {
    const cur = await db.transactions.get(id);
    if (!cur || cur.isDeleted) return;
    await db.transactions.update(id, { isDeleted: 1, updatedAt: Date.now(), dirty: 1 });
    changed = true;
  });
  if (changed) emitLedgerChanged();
}

export async function undeleteTransaction(id: string): Promise<void> {
  let changed = false;
  await db.transaction('rw', db.transactions, async () => {
    const cur = await db.transactions.get(id);
    if (!cur || !cur.isDeleted) return;
    await db.transactions.update(id, { isDeleted: 0, updatedAt: Date.now(), dirty: 1 });
    changed = true;
  });
  if (changed) emitLedgerChanged();
}

// ───────────── Dompet ─────────────

export async function addWallet(input: { name: string; type: WalletType; currentBalance: number }): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new LedgerError('Nama dompet wajib diisi');
  if (!Number.isSafeInteger(input.currentBalance)) throw new LedgerError('Saldo tidak valid');
  const id = newId();
  const count = await db.wallets.count();
  const row: Wallet = {
    id, name, type: input.type, openingBalance: input.currentBalance,
    colorHex: '#6366F1', isDefault: 0, excludeFromTotal: 0, sortOrder: count,
    updatedAt: Date.now(), isDeleted: 0, dirty: 1,
  };
  await db.wallets.add(row);
  emitLedgerChanged();
  return id;
}

export async function updateWallet(
  id: string,
  patch: Partial<Pick<Wallet, 'name' | 'colorHex' | 'excludeFromTotal'>> & { isDefault?: Flag },
): Promise<void> {
  await db.transaction('rw', db.wallets, async () => {
    if (patch.isDefault === 1) {
      const all = await db.wallets.toArray();
      for (const w of all) {
        if (w.id !== id && w.isDefault === 1) {
          await db.wallets.update(w.id, { isDefault: 0, updatedAt: Date.now(), dirty: 1 });
        }
      }
    }
    await db.wallets.update(id, { ...patch, updatedAt: Date.now(), dirty: 1 });
  });
  emitLedgerChanged();
}

/** Pengguna berpikir dalam "saldo saat ini"; kita menyesuaikan openingBalance. */
export async function setCurrentBalance(walletId: string, desired: number): Promise<void> {
  if (!Number.isSafeInteger(desired)) throw new LedgerError('Saldo tidak valid');
  await db.transaction('rw', db.wallets, db.transactions, async () => {
    const wallets = await db.wallets.toArray();
    const txs = await db.transactions.where('isDeleted').equals(0).toArray();
    const cur = computeBalances(wallets, txs).get(walletId);
    const w = wallets.find((x) => x.id === walletId);
    if (!w || cur === undefined) throw new LedgerError('Dompet tidak ditemukan');
    await db.wallets.update(walletId, {
      openingBalance: w.openingBalance + (desired - cur),
      updatedAt: Date.now(),
      dirty: 1,
    });
  });
  emitLedgerChanged();
}

```

`settings.ts`

```ts
import { db } from '../db/db';
import { emitLedgerChanged } from '../lib/events';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const r = await db.settings.get(key);
  return r ? (r.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown, local = false): Promise<void> {
  await db.settings.put({ key, value, updatedAt: Date.now(), dirty: local ? 0 : 1, local: local ? 1 : 0 });
  if (!local) emitLedgerChanged();
}

```

`backup.ts`

```ts
import { db } from '../db/db';
import type { Bill, Category, Setting, Tx, Wallet } from '../db/schema';
import { formatDateTime } from '../lib/format';

export interface BackupFile {
  app: 'myfinance';
  version: 1;
  exportedAt: number;
  tables: { wallets: Wallet[]; categories: Category[]; transactions: Tx[]; bills: Bill[]; settings: Setting[] };
}

const TABLES = [
  ['wallets', 'id'], ['categories', 'id'], ['transactions', 'id'], ['bills', 'id'], ['settings', 'key'],
] as const;

export async function exportBackup(): Promise<BackupFile> {
  const [wallets, categories, transactions, bills, settings] = await Promise.all([
    db.wallets.toArray(), db.categories.toArray(), db.transactions.toArray(), db.bills.toArray(),
    db.settings.where('local').equals(0).toArray().catch(() => db.settings.toArray()),
  ]);
  return {
    app: 'myfinance', version: 1, exportedAt: Date.now(),
    tables: { wallets, categories, transactions, bills, settings: settings.filter((s) => s.local === 0) },
  };
}

export function assertBackup(x: unknown): asserts x is BackupFile {
  const f = x as Partial<BackupFile> | null;
  if (!f || f.app !== 'myfinance' || f.version !== 1 || !f.tables) throw new Error('Berkas cadangan tidak dikenali');
  for (const [name, pk] of TABLES) {
    const rows = (f.tables as Record<string, unknown>)[name];
    if (!Array.isArray(rows)) throw new Error(`Tabel ${name} hilang`);
    for (const r of rows as Record<string, unknown>[]) {
      if (typeof r[pk] !== 'string' || typeof r.updatedAt !== 'number') throw new Error(`Baris ${name} rusak`);
    }
  }
  for (const t of f.tables.transactions) {
    if (!Number.isSafeInteger(t.amount) || t.amount <= 0) throw new Error('Nominal transaksi tidak valid');
  }
}

/** merge = last-write-wins per baris; replace = hapus semua lalu isi dari berkas. Semua baris ditandai dirty. */
export async function importBackup(file: BackupFile, mode: 'merge' | 'replace'): Promise<number> {
  let count = 0;
  await db.transaction('rw', [db.wallets, db.categories, db.transactions, db.bills, db.settings], async () => {
    for (const [name, pk] of TABLES) {
      const table = db.table(name);
      const rows = file.tables[name] as unknown as Record<string, unknown>[];
      if (mode === 'replace') await table.clear();
      for (const r of rows) {
        const cur = (await table.get(r[pk] as string)) as { updatedAt: number } | undefined;
        if (mode === 'merge' && cur && cur.updatedAt >= (r.updatedAt as number)) continue;
        await table.put({ ...r, dirty: 1, ...(name === 'settings' ? { local: 0 } : {}) });
        count++;
      }
    }
  });
  return count;
}

export function buildCsv(txs: Tx[], wallets: Wallet[], cats: Category[]): string {
  const wn = new Map(wallets.map((w) => [w.id, w.name]));
  const cn = new Map(cats.map((c) => [c.id, c.name]));
  const esc = (v: unknown): string => {
    const s = String(v ?? '');
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['Tanggal', 'Tipe', 'Nominal', 'Admin', 'Kategori', 'Dompet', 'Tujuan', 'Catatan'];
  const rows = txs
    .filter((t) => !t.isDeleted)
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .map((t) => [
      formatDateTime(t.occurredAt), t.type, t.amount, t.adminFee,
      t.categoryId ? (cn.get(t.categoryId) ?? '') : '',
      wn.get(t.walletId) ?? '',
      t.destinationWalletId ? (wn.get(t.destinationWalletId) ?? '') : '',
      t.note ?? '',
    ]);
  // ';' + BOM: Excel dengan locale Indonesia umumnya memakai ';' (needs verification)
  return '\uFEFF' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
}

```

> Baris `settings` di `exportBackup` memakai `.catch` karena `local` tidak berindeks. Sederhanakan saja: ganti dengan `db.settings.toArray()` lalu filter `local === 0` (sudah dilakukan di bawahnya). Minta agen merapikan bila `lint` mengeluh.

## Step 1.4 — Tes Domain (`src/domain/ledger.test.ts`)

```ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { SEED, seedIfEmpty } from '../db/seed';
import { computeBalances, spentInRange } from './balances';
import { assertBackup, exportBackup, importBackup } from './backup';
import {
  LedgerError, saveTransaction, setCurrentBalance, softDeleteTransaction,
  undeleteTransaction, updateTransaction,
} from './ledger';

const M = SEED.walletMandiri;
const G = SEED.walletGopay;
const FOOD = SEED.catFood;

async function bal(id: string): Promise<number | undefined> {
  const w = await db.wallets.toArray();
  const t = await db.transactions.toArray();
  return computeBalances(w, t).get(id);
}
async function spent(from: number, to: number): Promise<number> {
  return spentInRange(await db.transactions.toArray(), from, to);
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedIfEmpty();
  await db.wallets.update(M, { openingBalance: 500_000 });
});

describe('ledger', () => {
  it('expense mengurangi saldo', async () => {
    await saveTransaction({ type: 'expense', amount: 25_000, walletId: M, categoryId: FOOD });
    expect(await bal(M)).toBe(475_000);
  });

  it('income menambah saldo', async () => {
    await saveTransaction({ type: 'income', amount: 1_000_000, walletId: SEED.walletCash, categoryId: SEED.catSalary });
    expect(await bal(SEED.walletCash)).toBe(1_000_000);
  });

  it('transfer + admin: saldo kedua dompet benar, hanya admin yang jadi pengeluaran', async () => {
    const t0 = Date.now() - 1000;
    await saveTransaction({ type: 'transfer', amount: 100_000, adminFee: 1_000, walletId: M, destinationWalletId: G });
    expect(await bal(M)).toBe(399_000);
    expect(await bal(G)).toBe(100_000);
    expect(await spent(t0, Date.now() + 1000)).toBe(1_000);
  });

  it('softDelete mengembalikan saldo dan idempoten (updatedAt tidak berubah)', async () => {
    const id = await saveTransaction({ type: 'expense', amount: 50_000, walletId: M, categoryId: FOOD });
    await softDeleteTransaction(id);
    const afterFirst = (await db.transactions.get(id))!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    await softDeleteTransaction(id);
    expect(await bal(M)).toBe(500_000);
    expect((await db.transactions.get(id))!.updatedAt).toBe(afterFirst);
  });

  it('softDelete transfer mengembalikan kedua saldo termasuk admin', async () => {
    const id = await saveTransaction({ type: 'transfer', amount: 100_000, adminFee: 1_000, walletId: M, destinationWalletId: G });
    await softDeleteTransaction(id);
    expect(await bal(M)).toBe(500_000);
    expect(await bal(G)).toBe(0);
  });

  it('undelete memulihkan efek saldo', async () => {
    const id = await saveTransaction({ type: 'expense', amount: 10_000, walletId: M, categoryId: FOOD });
    await softDeleteTransaction(id);
    await undeleteTransaction(id);
    expect(await bal(M)).toBe(490_000);
  });

  it('update mengubah saldo mengikuti nominal baru', async () => {
    const id = await saveTransaction({ type: 'expense', amount: 10_000, walletId: M, categoryId: FOOD });
    await updateTransaction(id, { type: 'expense', amount: 30_000, walletId: M, categoryId: FOOD });
    expect(await bal(M)).toBe(470_000);
  });

  it('setCurrentBalance membuat saldo sama dengan yang diinginkan', async () => {
    await saveTransaction({ type: 'expense', amount: 10_000, walletId: M, categoryId: FOOD });
    await setCurrentBalance(M, 1_234_567);
    expect(await bal(M)).toBe(1_234_567);
  });

  it('rentang tanggal setengah-terbuka [from, to)', async () => {
    const t = new Date(2026, 5, 10, 12).getTime();
    await saveTransaction({ type: 'expense', amount: 1000, walletId: M, categoryId: FOOD, occurredAt: t });
    expect(await spent(t, t + 1)).toBe(1000);
    expect(await spent(t - 1000, t)).toBe(0);
  });
});

describe('validasi (tidak ada baris tertulis setelah gagal)', () => {
  const cases: [string, Parameters<typeof saveTransaction>[0]][] = [
    ['nominal 0', { type: 'expense', amount: 0, walletId: M, categoryId: FOOD }],
    ['nominal negatif', { type: 'expense', amount: -5, walletId: M, categoryId: FOOD }],
    ['nominal desimal', { type: 'expense', amount: 25.5, walletId: M, categoryId: FOOD }],
    ['transfer ke dompet sama', { type: 'transfer', amount: 1000, walletId: M, destinationWalletId: M }],
    ['transfer tanpa tujuan', { type: 'transfer', amount: 1000, walletId: M }],
    ['expense tanpa kategori', { type: 'expense', amount: 1000, walletId: M }],
    ['kategori beda tipe', { type: 'expense', amount: 1000, walletId: M, categoryId: SEED.catSalary }],
    ['dompet tidak ada', { type: 'expense', amount: 1000, walletId: 'nope', categoryId: FOOD }],
  ];
  for (const [name, input] of cases) {
    it(name, async () => {
      await expect(saveTransaction(input)).rejects.toBeInstanceOf(LedgerError);
      expect(await db.transactions.count()).toBe(0);
      expect(await bal(M)).toBe(500_000);
    });
  }
});

describe('backup', () => {
  it('ekspor lalu impor (replace) mengembalikan saldo identik', async () => {
    await saveTransaction({ type: 'expense', amount: 25_000, walletId: M, categoryId: FOOD });
    const file = await exportBackup();
    const json = JSON.parse(JSON.stringify(file)) as unknown;
    assertBackup(json);
    await db.delete();
    await db.open();
    await importBackup(json, 'replace');
    expect(await bal(M)).toBe(475_000);
  });

  it('assertBackup menolak berkas rusak', () => {
    expect(() => assertBackup({ app: 'lain' })).toThrow();
  });
});

describe('benchmark', () => {
  it('hitung saldo 20.000 transaksi', () => {
    const wallets = [{ id: 'w', openingBalance: 0, isDeleted: 0, excludeFromTotal: 0 }] as never[];
    const txs = Array.from({ length: 20_000 }, (_, i) => ({
      id: String(i), type: 'expense', amount: 1000, walletId: 'w', adminFee: 0, isDeleted: 0,
    })) as never[];
    const t0 = performance.now();
    computeBalances(wallets, txs);
    const ms = performance.now() - t0;
    console.log(`computeBalances(20k) = ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(1000);
  });
});

```

## Step 1.5 — Bootstrap minimal & CI

`src/main.tsx` (ganti spike; spike tetap bisa dipakai di route `/spike` pada Fase 2)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import { db } from './db/db';
import { seedIfEmpty } from './db/seed';
import { computeBalances, totalBalance } from './domain/balances';
import { requestPersist } from './lib/storage';
import { rp } from './lib/format';

function Boot() {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    void seedIfEmpty();
    void requestPersist();
    const sub = liveQuery(async () => {
      const w = await db.wallets.toArray();
      const t = await db.transactions.toArray();
      return totalBalance(w, computeBalances(w, t));
    }).subscribe({ next: setTotal });
    return () => sub.unsubscribe();
  }, []);
  return (
    <div className="h-full grid place-items-center">
      <div className="text-2xl">Total saldo: {total === null ? '…' : rp(total)}</div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><Boot /></StrictMode>);

```

`.github/workflows/ci.yml`

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npx tsc -b
      - run: npm run lint
      - run: npx vitest run
      - run: npm run build

```

### ✅ Checkpoint Fase 1

- [ ] `npx tsc -b`, `npm run lint`, `npx vitest run`, `npm run build` bersih
- [ ] Semua tes lulus (termasuk benchmark; catat milidetiknya)
- [ ] Preview Vercel di iPhone (PWA terpasang) menampilkan "Total saldo: Rp 0"
- [ ] Ekspor lalu impor JSON mengembalikan data identik (sudah dites otomatis)
- [ ] `git commit -m "fase1"`

---

# FASE 2 — Quick Add, Dashboard & Riwayat

## Step 2.1 — Hooks (`src/hooks/`)

`useLedger.ts`

```ts
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { computeBalances } from '../domain/balances';

export function useLedger() {
  const w = useLiveQuery(() => db.wallets.where('isDeleted').equals(0).sortBy('sortOrder'), []);
  const c = useLiveQuery(() => db.categories.where('isDeleted').equals(0).sortBy('sortOrder'), []);
  const t = useLiveQuery(() => db.transactions.where('isDeleted').equals(0).reverse().sortBy('occurredAt'), []);
  return useMemo(() => {
    const wallets = w ?? [];
    const categories = c ?? [];
    const txs = t ?? [];
    return {
      ready: Boolean(w && c && t),
      wallets,
      categories,
      txs,
      balances: computeBalances(wallets, txs),
      walletsById: new Map(wallets.map((x) => [x.id, x])),
      catsById: new Map(categories.map((x) => [x.id, x])),
    };
  }, [w, c, t]);
}

```

`useSetting.ts`

```ts
import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { setSetting } from '../domain/settings';

/** Mengembalikan [nilai, setNilai, siap]. `local = true` untuk setting yang tidak disinkronkan. */
export function useSetting<T>(key: string, fallback: T, local = false) {
  const box = useLiveQuery(async () => ({ row: await db.settings.get(key) }), [key]);
  const value = (box ? (box.row ? (box.row.value as T) : fallback) : fallback) as T;
  const set = useCallback((v: T) => setSetting(key, v, local), [key, local]);
  return [value, set, box !== undefined] as const;
}

```

## Step 2.2 — Komponen UI (`src/ui/`)

`Chip.tsx`

```tsx
import type { ReactNode } from 'react';

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-10 px-4 rounded-full text-sm border active:scale-95 transition ${
        active ? 'bg-primary/25 border-primary' : 'bg-surface border-border'
      }`}
    >
      {children}
    </button>
  );
}

```

`BudgetBar.tsx`

```tsx
export function BudgetBar({ ratio, label, trailing }: { ratio: number; label: string; trailing: string }) {
  const over = ratio > 1;
  const warn = ratio > 0.75;
  const bar = over ? 'bg-danger' : warn ? 'bg-warning' : 'bg-success';
  const txt = over ? 'text-danger' : warn ? 'text-warning' : 'text-success';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-dim">{label}</span>
        <span className={`font-semibold ${txt}`}>{trailing}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className={`h-full ${bar} transition-all`} style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }} />
      </div>
    </div>
  );
}

```

`ActionSheet.tsx`

```tsx
import type { ReactNode } from 'react';

export function ActionSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-4 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

```

`Numpad.tsx`

```tsx
import type { ReactNode } from 'react';

function Key({ onPress, children, op }: { onPress: () => void; children: ReactNode; op?: boolean }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`h-14 rounded-2xl text-2xl font-medium select-none active:scale-95 active:bg-primary/30 transition ${
        op ? 'bg-primary/20 text-primary' : 'bg-bg border border-border'
      }`}
    >
      {children}
    </button>
  );
}

export function Numpad(p: {
  onDigit: (d: string) => void;
  onOp: (o: '+' | '-') => void;
  onBack: () => void;
  onClear: () => void;
}) {
  const d = (x: string) => () => p.onDigit(x);
  return (
    <div className="grid grid-cols-4 gap-2">
      <Key onPress={d('7')}>7</Key><Key onPress={d('8')}>8</Key><Key onPress={d('9')}>9</Key>
      <Key op onPress={p.onBack}>⌫</Key>
      <Key onPress={d('4')}>4</Key><Key onPress={d('5')}>5</Key><Key onPress={d('6')}>6</Key>
      <Key op onPress={() => p.onOp('+')}>+</Key>
      <Key onPress={d('1')}>1</Key><Key onPress={d('2')}>2</Key><Key onPress={d('3')}>3</Key>
      <Key op onPress={() => p.onOp('-')}>−</Key>
      <Key op onPress={d('000')}>000</Key><Key onPress={d('0')}>0</Key>
      <Key op onPress={p.onClear}>C</Key><div />
    </div>
  );
}

```

`TxList.tsx` (daftar + aksi tap + urungkan)

```tsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tx } from '../db/schema';
import { softDeleteTransaction, undeleteTransaction } from '../domain/ledger';
import { useLedger } from '../hooks/useLedger';
import { formatDay, rp } from '../lib/format';
import { ActionSheet } from './ActionSheet';

export function TxList({ txs, grouped = false }: { txs: Tx[]; grouped?: boolean }) {
  const { walletsById, catsById } = useLedger();
  const nav = useNavigate();
  const [sel, setSel] = useState<Tx | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  async function remove(t: Tx) {
    setSel(null);
    await softDeleteTransaction(t.id);
    setUndoId(t.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setUndoId(null), 5000);
  }

  if (txs.length === 0) return <p className="text-dim text-center py-10">Belum ada transaksi</p>;

  return (
    <>
      <ul>
        {txs.map((t, i) => {
          const isTransfer = t.type === 'transfer';
          const color = isTransfer ? 'text-primary' : t.type === 'income' ? 'text-success' : 'text-danger';
          const sign = isTransfer ? '' : t.type === 'income' ? '+' : '-';
          const cat = t.categoryId ? catsById.get(t.categoryId)?.name : undefined;
          const src = walletsById.get(t.walletId)?.name ?? '?';
          const dest = t.destinationWalletId ? walletsById.get(t.destinationWalletId)?.name : undefined;
          const title = isTransfer ? `${src} → ${dest ?? '?'}` : (t.note ?? cat ?? '-');
          const sub = isTransfer ? `Transfer${t.adminFee ? ` • admin ${rp(t.adminFee)}` : ''}` : `${cat ?? '-'} • ${src}`;
          const showHeader = grouped && (i === 0 || txs[i - 1].dateKey !== t.dateKey);
          return (
            <li key={t.id}>
              {showHeader && <div className="pt-4 pb-1 text-xs text-dim">{formatDay(t.occurredAt)}</div>}
              <button type="button" onClick={() => setSel(t)} className="w-full flex items-center gap-3 py-2.5 text-left active:opacity-60">
                <div className="min-w-0 flex-1">
                  <div className="truncate">{title}</div>
                  <div className="truncate text-xs text-dim">{sub}</div>
                </div>
                <div className={`font-semibold ${color}`}>{sign}{rp(t.amount)}</div>
              </button>
            </li>
          );
        })}
      </ul>

      <ActionSheet open={sel !== null} onClose={() => setSel(null)}>
        {sel && (
          <>
            <div className="text-center text-dim text-sm pb-1">{rp(sel.amount)}</div>
            {sel.type !== 'transfer' && (
              <button className="w-full h-12 rounded-xl border border-border" onClick={() => nav(`/add?edit=${sel.id}`)}>
                Edit
              </button>
            )}
            <button className="w-full h-12 rounded-xl border border-danger text-danger" onClick={() => void remove(sel)}>
              Hapus
            </button>
            <button className="w-full h-12 rounded-xl text-dim" onClick={() => setSel(null)}>Batal</button>
          </>
        )}
      </ActionSheet>

      {undoId && (
        <div className="fixed left-4 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between rounded-xl bg-surface border border-border px-4 h-12">
          <span className="text-sm">Transaksi dihapus</span>
          <button className="text-primary font-semibold" onClick={() => { void undeleteTransaction(undoId); setUndoId(null); }}>
            Urungkan
          </button>
        </div>
      )}
    </>
  );
}

```

## Step 2.3 — Layar Catat

`src/features/quick-add/QuickAdd.tsx`

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveTransaction, updateTransaction } from '../../domain/ledger';
import { sortByUsage, spentInRange } from '../../domain/balances';
import { useLedger } from '../../hooks/useLedger';
import { useSetting } from '../../hooks/useSetting';
import { addDays, daysInMonth, startOfDay } from '../../lib/dates';
import { evalExpr, pressBack, pressDigit, pressOp, prettyExpr } from '../../lib/expr';
import { rp } from '../../lib/format';
import { haptic } from '../../lib/haptic';
import { BudgetBar } from '../../ui/BudgetBar';
import { Chip } from '../../ui/Chip';
import { Numpad } from '../../ui/Numpad';

export default function QuickAdd() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const { ready, wallets, categories, txs, balances } = useLedger();
  const [monthly] = useSetting<number>('monthlyBudget', 0);

  const [expr, setExpr] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [walletId, setWalletId] = useState<string>();
  const [categoryId, setCategoryId] = useState<string>();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!ready || initialized || wallets.length === 0) return;
    if (editId) {
      const t = txs.find((x) => x.id === editId);
      if (t && t.type !== 'transfer') {
        setType(t.type);
        setExpr(String(t.amount));
        setWalletId(t.walletId);
        setCategoryId(t.categoryId ?? undefined);
        setNote(t.note ?? '');
      }
    } else {
      setWalletId((wallets.find((w) => w.isDefault) ?? wallets[0]).id);
    }
    setInitialized(true);
  }, [ready, initialized, wallets, txs, editId]);

  const now = Date.now();
  const amount = evalExpr(expr);
  const wallet = wallets.find((w) => w.id === walletId);
  const balance = wallet ? (balances.get(wallet.id) ?? 0) : 0;
  const insufficient = !editId && type === 'expense' && amount > balance;

  const cats = useMemo(
    () => sortByUsage(categories.filter((c) => c.type === type), txs, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, txs, type],
  );

  const dailyBudget = monthly > 0 ? Math.round(monthly / daysInMonth(now)) : 0;
  const today = startOfDay(now);
  const spentToday = spentInRange(txs, today, addDays(today, 1));
  const projected = spentToday + (type === 'expense' ? amount : 0);

  const canSave = amount > 0 && !!walletId && !!categoryId && !busy;

  async function save() {
    if (!canSave || !walletId || !categoryId) return;
    setBusy(true);
    setError(null);
    try {
      const input = { type, amount, walletId, categoryId, note: note.trim() || null } as const;
      if (editId) await updateTransaction(editId, input);
      else await saveTransaction(input);
      haptic('success');
      nav('/', { replace: true });
    } catch (e) {
      haptic('error');
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full flex flex-col px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        <button className="h-10 w-10 rounded-full border border-border" onClick={() => nav(-1)} aria-label="Tutup">✕</button>
        <Chip active={type === 'expense'} onClick={() => { setType('expense'); setCategoryId(undefined); }}>Pengeluaran</Chip>
        <Chip active={type === 'income'} onClick={() => { setType('income'); setCategoryId(undefined); }}>Pemasukan</Chip>
      </div>

      <div className="py-4 text-center">
        <div className={`font-bold truncate ${expr ? 'text-4xl' : 'text-4xl text-dim'}`}>
          Rp {expr ? prettyExpr(expr) : '0'}
        </div>
        <div className="h-5 text-sm text-dim">{/[+-]/.test(expr) ? `= ${rp(amount)}` : ''}</div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {wallets.map((w) => (
          <Chip key={w.id} active={walletId === w.id} onClick={() => setWalletId(w.id)}>
            {w.name} • {rp(balances.get(w.id) ?? 0)}
          </Chip>
        ))}
      </div>
      {insufficient && <p className="text-xs text-danger pb-1">Saldo dompet ini tidak cukup (tetap bisa disimpan).</p>}

      {!editId && type === 'expense' && dailyBudget > 0 && (
        <div className="py-1.5">
          <BudgetBar
            ratio={projected / dailyBudget}
            label={`Jatah harian ${rp(dailyBudget)}`}
            trailing={projected > dailyBudget ? `Lebih ${rp(projected - dailyBudget)}` : `Sisa ${rp(dailyBudget - projected)}`}
          />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto py-2">
        {cats.map((c) => (
          <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>{c.name}</Chip>
        ))}
      </div>

      <input
        className="h-11 rounded-xl border border-border bg-surface px-3 mb-2"
        placeholder="Catatan (opsional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="mt-auto space-y-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        <Numpad
          onDigit={(d) => { haptic('light'); setExpr((e) => pressDigit(e, d)); }}
          onOp={(o) => setExpr((e) => pressOp(e, o))}
          onBack={() => setExpr(pressBack)}
          onClear={() => setExpr('')}
        />
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void save()}
          className="w-full h-14 rounded-2xl bg-primary text-lg font-semibold disabled:opacity-40 active:scale-[0.98] transition"
        >
          {busy ? 'Menyimpan…' : editId ? 'Simpan perubahan' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

```

## Step 2.4 — Dashboard, Riwayat, Dompet

`src/features/dashboard/Dashboard.tsx`

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { spentInRange, totalBalance } from '../../domain/balances';
import { useLedger } from '../../hooks/useLedger';
import { useSetting } from '../../hooks/useSetting';
import { addDays, daysInMonth, startOfDay } from '../../lib/dates';
import { rp } from '../../lib/format';
import { BudgetBar } from '../../ui/BudgetBar';
import { TxList } from '../../ui/TxList';

export default function Dashboard() {
  const { wallets, txs, balances } = useLedger();
  const [monthly] = useSetting<number>('monthlyBudget', 0);
  const [hidden, setHidden] = useState(false);

  const now = Date.now();
  const today = startOfDay(now);
  const spentToday = spentInRange(txs, today, addDays(today, 1));
  const dailyBudget = monthly > 0 ? Math.round(monthly / daysInMonth(now)) : 0;

  return (
    <div className="h-full flex flex-col">
      <section className="px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 space-y-4">
        <div>
          <div className="text-sm text-dim">Total Saldo</div>
          <button className="text-4xl font-bold" onClick={() => setHidden((h) => !h)}>
            {hidden ? 'Rp ••••••' : rp(totalBalance(wallets, balances))}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto">
          {wallets.map((w) => (
            <div key={w.id} className="shrink-0 w-40 rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2 text-xs text-dim">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: w.colorHex }} />
                <span className="truncate">{w.name}</span>
              </div>
              <div className="mt-3 font-semibold">{hidden ? '••••' : rp(balances.get(w.id) ?? 0)}</div>
            </div>
          ))}
        </div>

        {dailyBudget > 0 ? (
          <BudgetBar
            ratio={spentToday / dailyBudget}
            label={`Hari ini ${rp(spentToday)} / ${rp(dailyBudget)}`}
            trailing={spentToday > dailyBudget ? 'Over' : `Sisa ${rp(dailyBudget - spentToday)}`}
          />
        ) : (
          <Link to="/settings" className="block text-sm text-primary">Atur budget bulanan untuk melihat jatah harian →</Link>
        )}
      </section>

      <section className="flex-1 min-h-0 overflow-y-auto rounded-t-3xl bg-surface px-5 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Transaksi Terbaru</h2>
          <Link to="/wallets" className="text-sm text-primary">Dompet</Link>
        </div>
        <TxList txs={txs.slice(0, 30)} />
      </section>
    </div>
  );
}

```

`src/features/history/History.tsx`

```tsx
import { useState } from 'react';
import { useLedger } from '../../hooks/useLedger';
import { TxList } from '../../ui/TxList';

export default function History() {
  const { txs, walletsById, catsById } = useLedger();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const list = needle
    ? txs.filter((t) =>
        (t.note ?? '').toLowerCase().includes(needle) ||
        (t.categoryId ? (catsById.get(t.categoryId)?.name ?? '') : '').toLowerCase().includes(needle) ||
        (walletsById.get(t.walletId)?.name ?? '').toLowerCase().includes(needle))
    : txs;
  return (
    <div className="h-full overflow-y-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4">
      <input
        className="w-full h-11 rounded-xl border border-border bg-surface px-3"
        placeholder="Cari catatan, kategori, dompet…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <TxList txs={list} grouped />
    </div>
  );
}

```

`src/features/wallets/Wallets.tsx`

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WalletType } from '../../db/schema';
import { addWallet, saveTransaction, setCurrentBalance, updateWallet } from '../../domain/ledger';
import { useLedger } from '../../hooks/useLedger';
import { rp } from '../../lib/format';
import { ActionSheet } from '../../ui/ActionSheet';

const field = 'w-full h-11 rounded-xl border border-border bg-bg px-3';

export default function Wallets() {
  const { wallets, balances } = useLedger();
  const [mode, setMode] = useState<'none' | 'add' | 'edit' | 'transfer'>('none');
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [bal, setBal] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [err, setErr] = useState('');

  const close = () => { setMode('none'); setErr(''); };
  const run = async (fn: () => Promise<unknown>) => {
    try { await fn(); close(); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-28">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Dompet</h1>
        <Link to="/" className="text-primary text-sm">Selesai</Link>
      </div>

      <ul className="space-y-2">
        {wallets.map((w) => (
          <li key={w.id}>
            <button
              className="w-full flex items-center justify-between rounded-2xl border border-border bg-surface p-4 active:opacity-60"
              onClick={() => { setEditId(w.id); setName(w.name); setBal(String(balances.get(w.id) ?? 0)); setMode('edit'); }}
            >
              <span>{w.name}{w.isDefault ? ' ★' : ''}</span>
              <span className="font-semibold">{rp(balances.get(w.id) ?? 0)}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] flex gap-2">
        <button className="flex-1 h-12 rounded-2xl bg-primary font-semibold"
          onClick={() => { setFrom(wallets[0]?.id ?? ''); setTo(wallets[1]?.id ?? ''); setAmount(''); setFee('0'); setMode('transfer'); }}>
          Transfer / Top-up
        </button>
        <button className="h-12 px-5 rounded-2xl border border-border"
          onClick={() => { setName(''); setBal('0'); setType('bank'); setMode('add'); }}>
          + Dompet
        </button>
      </div>

      <ActionSheet open={mode === 'add'} onClose={close}>
        <h2 className="font-semibold">Dompet baru</h2>
        <input className={field} placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={field} value={type} onChange={(e) => setType(e.target.value as WalletType)}>
          <option value="bank">Bank</option><option value="ewallet">E-Wallet</option><option value="cash">Cash</option>
        </select>
        <input className={field} inputMode="numeric" placeholder="Saldo saat ini" value={bal} onChange={(e) => setBal(e.target.value)} />
        {err && <p className="text-danger text-sm">{err}</p>}
        <button className="w-full h-12 rounded-xl bg-primary font-semibold"
          onClick={() => void run(() => addWallet({ name, type, currentBalance: Number(bal) }))}>Simpan</button>
      </ActionSheet>

      <ActionSheet open={mode === 'edit'} onClose={close}>
        <h2 className="font-semibold">Ubah dompet</h2>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-xs text-dim">Saldo saat ini</label>
        <input className={field} inputMode="numeric" value={bal} onChange={(e) => setBal(e.target.value)} />
        {err && <p className="text-danger text-sm">{err}</p>}
        <button className="w-full h-12 rounded-xl bg-primary font-semibold"
          onClick={() => void run(async () => { await updateWallet(editId, { name: name.trim() }); await setCurrentBalance(editId, Number(bal)); })}>
          Simpan
        </button>
        <button className="w-full h-12 rounded-xl border border-border"
          onClick={() => void run(() => updateWallet(editId, { isDefault: 1 }))}>Jadikan dompet utama</button>
      </ActionSheet>

      <ActionSheet open={mode === 'transfer'} onClose={close}>
        <h2 className="font-semibold">Transfer antar-dompet</h2>
        <select className={field} value={from} onChange={(e) => setFrom(e.target.value)}>
          {wallets.map((w) => <option key={w.id} value={w.id}>Dari: {w.name}</option>)}
        </select>
        <select className={field} value={to} onChange={(e) => setTo(e.target.value)}>
          {wallets.map((w) => <option key={w.id} value={w.id}>Ke: {w.name}</option>)}
        </select>
        <input className={field} inputMode="numeric" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className={field} inputMode="numeric" placeholder="Biaya admin" value={fee} onChange={(e) => setFee(e.target.value)} />
        {err && <p className="text-danger text-sm">{err}</p>}
        <button className="w-full h-12 rounded-xl bg-primary font-semibold"
          onClick={() => void run(() => saveTransaction({ type: 'transfer', amount: Number(amount), adminFee: Number(fee || 0), walletId: from, destinationWalletId: to }))}>
          Transfer
        </button>
      </ActionSheet>
    </div>
  );
}

```

## Step 2.5 — Pengaturan awal, banner instal, App shell

`src/features/settings/InstallBanner.tsx`

```tsx
import { useState } from 'react';

export function InstallBanner() {
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  const [dismissed, setDismissed] = useState(false);
  if (standalone || dismissed) return null;
  return (
    <div className="mx-4 mt-3 rounded-xl border border-warning/50 bg-warning/10 p-3 text-sm">
      <p>Pasang ke Home Screen dulu (Bagikan → Tambah ke Layar Utama) <b>sebelum</b> memasukkan data. Penyimpanan Safari dan aplikasi terpasang terpisah.</p>
      <button className="mt-2 text-primary" onClick={() => setDismissed(true)}>Tutup</button>
    </div>
  );
}

```

`src/features/settings/Settings.tsx` (versi Fase 2; Fase 3–4 menambah bagian)

```tsx
import { useEffect, useState } from 'react';
import { buildCsv, assertBackup, exportBackup, importBackup } from '../../domain/backup';
import { useLedger } from '../../hooks/useLedger';
import { useSetting } from '../../hooks/useSetting';
import { shareOrDownload } from '../../lib/share';
import { storageInfo } from '../../lib/storage';

const row = 'w-full h-12 rounded-xl border border-border bg-surface px-4 text-left';

export default function Settings() {
  const { txs, wallets, categories } = useLedger();
  const [monthly, setMonthly] = useSetting<number>('monthlyBudget', 0);
  const [startScreen, setStartScreen] = useSetting<'home' | 'add'>('startScreen', 'home', true);
  const [budgetText, setBudgetText] = useState('');
  const [info, setInfo] = useState<{ persisted: boolean; usage: number; quota: number } | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { void storageInfo().then(setInfo); }, []);
  useEffect(() => setBudgetText(monthly ? String(monthly) : ''), [monthly]);

  async function doExport() {
    const file = await exportBackup();
    const d = new Date().toISOString().slice(0, 10);
    await shareOrDownload(JSON.stringify(file), `myfinance-backup-${d}.json`, 'application/json');
  }

  async function doImport(f: File, mode: 'merge' | 'replace') {
    try {
      const json = JSON.parse(await f.text()) as unknown;
      assertBackup(json);
      if (mode === 'replace' && !window.confirm('Ganti SEMUA data lokal dengan isi berkas ini?')) return;
      const n = await importBackup(json, mode);
      setMsg(`Berhasil mengimpor ${n} baris.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-6 space-y-4">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      <section className="space-y-2">
        <label className="text-sm text-dim">Budget bulanan (Rp)</label>
        <div className="flex gap-2">
          <input className="flex-1 h-12 rounded-xl border border-border bg-surface px-3" inputMode="numeric" value={budgetText} onChange={(e) => setBudgetText(e.target.value)} />
          <button className="h-12 px-5 rounded-xl bg-primary font-semibold" onClick={() => void setMonthly(Number(budgetText) || 0)}>Simpan</button>
        </div>
        <button className={row} onClick={() => void setStartScreen(startScreen === 'add' ? 'home' : 'add')}>
          Buka langsung ke layar Catat: <b>{startScreen === 'add' ? 'Ya' : 'Tidak'}</b>
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-dim">Cadangan & data</h2>
        <button className={row} onClick={() => void doExport()}>Ekspor cadangan JSON</button>
        <label className={`${row} flex items-center`}>
          Impor (gabung)
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && void doImport(e.target.files[0], 'merge')} />
        </label>
        <label className={`${row} flex items-center`}>
          Impor (ganti semua)
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && void doImport(e.target.files[0], 'replace')} />
        </label>
        <button className={row} onClick={() => void shareOrDownload(buildCsv(txs, wallets, categories), 'myfinance.csv', 'text/csv')}>Ekspor CSV</button>
        {msg && <p className="text-sm text-dim">{msg}</p>}
      </section>

      <section className="text-xs text-dim space-y-1">
        <div>Penyimpanan persisten: {info ? String(info.persisted) : '…'}</div>
        <div>Terpakai: {info ? `${(info.usage / 1024).toFixed(0)} KB dari ${(info.quota / 1048576).toFixed(0)} MB` : '…'}</div>
        <div>Jika "persisten" = false, buat cadangan JSON secara berkala.</div>
      </section>
    </div>
  );
}

```

`src/App.tsx` (versi Fase 2)

```tsx
import { useEffect, useRef } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { seedIfEmpty } from './db/seed';
import Dashboard from './features/dashboard/Dashboard';
import History from './features/history/History';
import QuickAdd from './features/quick-add/QuickAdd';
import { InstallBanner } from './features/settings/InstallBanner';
import Settings from './features/settings/Settings';
import Spike from './features/spike/Spike';
import Wallets from './features/wallets/Wallets';
import { useSetting } from './hooks/useSetting';
import { requestPersist } from './lib/storage';

function Shell() {
  const loc = useLocation();
  const nav = useNavigate();
  const [startScreen, , ready] = useSetting<'home' | 'add'>('startScreen', 'home', true);
  const did = useRef(false);

  useEffect(() => {
    if (ready && !did.current) {
      did.current = true;
      if (startScreen === 'add' && loc.pathname === '/') nav('/add', { replace: true });
    }
  }, [ready, startScreen, loc.pathname, nav]);

  const hideNav = loc.pathname === '/add' || loc.pathname === '/spike';
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex-1 grid place-items-center text-xs ${isActive ? 'text-primary' : 'text-dim'}`;

  return (
    <div className="h-full flex flex-col">
      {loc.pathname === '/' && <InstallBanner />}
      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<QuickAdd />} />
          <Route path="/history" element={<History />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/spike" element={<Spike />} />
        </Routes>
      </main>
      {!hideNav && (
        <nav className="h-16 shrink-0 flex items-center border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] box-content">
          <NavLink to="/" end className={tab}>Home</NavLink>
          <NavLink to="/history" className={tab}>Riwayat</NavLink>
          <NavLink to="/add" className="mx-2 h-12 px-6 rounded-full bg-primary grid place-items-center font-semibold active:scale-95 transition">
            + Catat
          </NavLink>
          <NavLink to="/wallets" className={tab}>Dompet</NavLink>
          <NavLink to="/settings" className={tab}>Setelan</NavLink>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    void seedIfEmpty();
    void requestPersist();
  }, []);
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

```

`src/main.tsx` (final)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

```

### ✅ Checkpoint Fase 2

- [ ] Pemeriksaan otomatis bersih (tsc, lint, vitest, build)
- [ ] Di iPhone (PWA terpasang): atur "Saldo saat ini" tiap dompet → total saldo benar
- [ ] Catat expense: saldo turun; edit nominal: saldo menyesuaikan; hapus: saldo kembali; Urungkan: pulih
- [ ] Transfer Rp 100.000 + admin Rp 1.000: sumber −101.000, tujuan +100.000, pengeluaran hari ini +1.000
- [ ] **Ukur** 10 percobaan "buka app → tersimpan" dengan stopwatch; catat rata-ratanya (target ≤ 5 ketukan)
- [ ] Mode pesawat: semua alur di atas tetap jalan
- [ ] Tidak ada zoom otomatis saat mengetuk input; tidak ada konten tertutup notch/home bar
- [ ] `git commit -m "fase2"`

---

# FASE 3 — Cloud Sync (Supabase)

## Step 3.1 — SQL (`supabase/schema.sql`, jalankan di SQL Editor Supabase)

```sql
-- Semua tabel: PK (user_id, id). TANPA foreign key antar tabel (urutan push tidak penting).
create table public.wallets (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  type text not null,
  opening_balance bigint not null default 0,
  color_hex text not null default '#6366F1',
  is_default smallint not null default 0,
  exclude_from_total smallint not null default 0,
  sort_order int not null default 0,
  updated_at bigint not null,
  is_deleted smallint not null default 0,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.categories (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  type text not null,
  color_hex text not null default '#6366F1',
  monthly_limit bigint,
  sort_order int not null default 0,
  updated_at bigint not null,
  is_deleted smallint not null default 0,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.transactions (
  user_id uuid not null default auth.uid(),
  id text not null,
  type text not null,
  amount bigint not null check (amount > 0),
  wallet_id text not null,
  destination_wallet_id text,
  admin_fee bigint not null default 0,
  category_id text,
  note text,
  occurred_at bigint not null,
  date_key text not null,
  created_at bigint not null,
  updated_at bigint not null,
  is_deleted smallint not null default 0,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.bills (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  amount bigint not null,
  wallet_id text not null,
  category_id text not null,
  frequency text not null,
  next_due_at bigint not null,
  auto_record smallint not null default 1,
  is_active smallint not null default 1,
  updated_at bigint not null,
  is_deleted smallint not null default 0,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.settings (
  user_id uuid not null default auth.uid(),
  key text not null,
  value jsonb,
  updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Penjaga: tolak update yang lebih lama dari yang tersimpan; set server_updated_at.
create or replace function public.myfinance_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null; -- lewati update usang
  end if;
  new.server_updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['wallets','categories','transactions','bills','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger guard before insert or update on public.%I for each row execute function public.myfinance_guard()', t);
    execute format('create index on public.%I (user_id, server_updated_at)', t);
  end loop;
end $$;

```

> Peringatan: `now()` bernilai sama untuk semua baris dalam satu pernyataan. Karena itu pull memakai `>=` pada kursor (baris batas diambil ulang, aman karena penerapan idempoten) dan push dibatasi 200 baris per permintaan.

## Step 3.2 — Klien & Sesi

`.env.local` (jangan di-commit):

```text
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # anon key, BUKAN service-role key

```

`src/sync/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null;

```

`src/hooks/useSession.ts`

```ts
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../sync/supabase';
import { requestSync } from '../sync/engine';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) requestSync();
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready, enabled: supabase !== null };
}

```

## Step 3.3 — Sync Engine

`src/sync/engine.ts`

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { db } from '../db/db';
import { getSetting, setSetting } from '../domain/settings';
import { onLedgerChanged } from '../lib/events';
import { supabase } from './supabase';

type TableName = 'wallets' | 'categories' | 'transactions' | 'bills' | 'settings';
type Row = Record<string, unknown>;
const SPECS: { name: TableName; pk: 'id' | 'key' }[] = [
  { name: 'wallets', pk: 'id' },
  { name: 'categories', pk: 'id' },
  { name: 'transactions', pk: 'id' },
  { name: 'bills', pk: 'id' },
  { name: 'settings', pk: 'key' },
];
const CHUNK = 200;
const PAGE = 1000;

// ───────── status (untuk UI) ─────────
export interface SyncStatus { state: 'disabled' | 'idle' | 'syncing' | 'ok' | 'offline' | 'error'; lastSyncAt: number | null; message?: string }
let status: SyncStatus = { state: supabase ? 'idle' : 'disabled', lastSyncAt: null };
const subs = new Set<() => void>();
const setStatus = (s: Partial<SyncStatus>) => { status = { ...status, ...s }; subs.forEach((f) => f()); };
export const useSyncStatus = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => status);

// ───────── util ─────────
const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function toRemote(row: Row, userId: string): Row {
  const o: Row = { user_id: userId };
  for (const [k, v] of Object.entries(row)) {
    if (k === 'dirty' || k === 'local') continue;
    o[camelToSnake(k)] = v;
  }
  return o;
}

function fromRemote(r: Row, name: TableName): Row {
  const o: Row = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === 'user_id' || k === 'server_updated_at') continue;
    o[snakeToCamel(k)] = v;
  }
  o.dirty = 0;
  if (name === 'settings') o.local = 0;
  return o;
}

function withTimeout<T>(p: PromiseLike<T>, ms = 20_000): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

// ───────── push ─────────
async function push(spec: (typeof SPECS)[number], sb: SupabaseClient, userId: string): Promise<void> {
  const table = db.table(spec.name);
  let rows = (await table.where('dirty').equals(1).toArray()) as Row[];
  if (spec.name === 'settings') rows = rows.filter((r) => r.local === 0);
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await withTimeout(
      sb.from(spec.name).upsert(chunk.map((r) => toRemote(r, userId)), {
        onConflict: spec.pk === 'id' ? 'user_id,id' : 'user_id,key',
      }),
    );
    if (error) throw new Error(`${spec.name}: ${error.message}`);
    // Tandai bersih HANYA jika baris tidak berubah selama upload.
    await db.transaction('rw', table, async () => {
      for (const r of chunk) {
        const key = r[spec.pk] as string;
        const cur = (await table.get(key)) as Row | undefined;
        if (cur && cur.updatedAt === r.updatedAt) await table.update(key, { dirty: 0 });
      }
    });
  }
}

// ───────── pull ─────────
async function applyRemote(spec: (typeof SPECS)[number], rows: Row[]): Promise<void> {
  const table = db.table(spec.name);
  await db.transaction('rw', table, async () => {
    for (const raw of rows) {
      const r = fromRemote(raw, spec.name);
      const key = r[spec.pk] as string;
      const cur = (await table.get(key)) as Row | undefined;
      if (!cur || (r.updatedAt as number) > (cur.updatedAt as number)) await table.put(r);
    }
  });
}

async function pull(spec: (typeof SPECS)[number], sb: SupabaseClient): Promise<void> {
  const cursorKey = `cursor:${spec.name}`;
  let cursor = await getSetting<string>(cursorKey, '1970-01-01T00:00:00Z');
  for (;;) {
    const { data, error } = await withTimeout(
      sb.from(spec.name).select('*').gte('server_updated_at', cursor)
        .order('server_updated_at', { ascending: true }).limit(PAGE),
    );
    if (error) throw new Error(`${spec.name}: ${error.message}`);
    const rows = (data ?? []) as Row[];
    if (rows.length === 0) break;
    await applyRemote(spec, rows);
    const last = rows[rows.length - 1].server_updated_at as string;
    const stuck = last === cursor && rows.length >= PAGE; // semua baris bertimestamp sama
    cursor = last;
    await setSetting(cursorKey, cursor, true);
    if (rows.length < PAGE || stuck) break;
  }
}

// ───────── orkestrasi ─────────
let running = false;

export async function syncNow(): Promise<void> {
  if (!supabase) return setStatus({ state: 'disabled' });
  if (running) return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return setStatus({ state: 'idle', message: 'Belum masuk' });
  if (!navigator.onLine) return setStatus({ state: 'offline' });

  running = true;
  setStatus({ state: 'syncing', message: undefined });
  try {
    for (const s of SPECS) await push(s, supabase, session.user.id);
    for (const s of SPECS) await pull(s, supabase);
    const now = Date.now();
    await setSetting('lastSyncAt', now, true);
    setStatus({ state: 'ok', lastSyncAt: now });
  } catch (e) {
    // Offline/gagal: data lokal tetap aman. Jangan ganggu pengguna.
    setStatus({ state: 'error', message: e instanceof Error ? e.message : String(e) });
  } finally {
    running = false;
  }
}

let timer: number | undefined;
export function requestSync(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), 2000);
}

export function startSyncAutoTrigger(): () => void {
  const off = onLedgerChanged(requestSync);
  const onOnline = () => requestSync();
  const onVis = () => { if (document.visibilityState === 'visible') requestSync(); };
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVis);
  void getSetting<number | null>('lastSyncAt', null).then((t) => t && setStatus({ lastSyncAt: t }));
  requestSync();
  return () => {
    off();
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVis);
  };
}

```

## Step 3.4 — UI Cloud di Pengaturan

`src/features/settings/CloudSection.tsx`

```tsx
import { useState } from 'react';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../sync/supabase';
import { syncNow, useSyncStatus } from '../../sync/engine';
import { formatDateTime } from '../../lib/format';

const btn = 'w-full h-12 rounded-xl border border-border bg-surface px-4 text-left';

export function CloudSection() {
  const { session, enabled } = useSession();
  const st = useSyncStatus();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');

  if (!enabled || !supabase) {
    return <p className="text-sm text-dim">Cloud belum dikonfigurasi (env Supabase kosong). App tetap berfungsi lokal.</p>;
  }
  const sb = supabase;

  return (
    <section className="space-y-2">
      <h2 className="text-sm text-dim">Cloud (cadangan & sinkronisasi)</h2>
      {session ? (
        <>
          <div className="text-sm">Masuk sebagai <b>{session.user.email}</b></div>
          <div className="text-xs text-dim">
            Status: {st.state}
            {st.lastSyncAt ? ` • terakhir ${formatDateTime(st.lastSyncAt)}` : ''}
            {st.message ? ` • ${st.message}` : ''}
          </div>
          <button className={btn} onClick={() => void syncNow()}>Sinkronkan sekarang</button>
          <button className={btn} onClick={() => void sb.auth.signOut()}>Keluar</button>
          <p className="text-xs text-dim">Pulihkan di perangkat baru: cukup masuk dengan akun yang sama.</p>
        </>
      ) : (
        <>
          <button className={btn} onClick={() => void sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/settings' } })}>
            Masuk dengan Google
          </button>
          {!sent ? (
            <>
              <input className="w-full h-12 rounded-xl border border-border bg-surface px-3" placeholder="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className={btn} onClick={async () => {
                const { error } = await sb.auth.signInWithOtp({ email });
                if (error) setMsg(error.message); else { setSent(true); setMsg('Kode dikirim ke email.'); }
              }}>Kirim kode OTP</button>
            </>
          ) : (
            <>
              <input className="w-full h-12 rounded-xl border border-border bg-surface px-3" placeholder="kode dari email" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
              <button className={btn} onClick={async () => {
                const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
                setMsg(error ? error.message : 'Berhasil masuk.');
              }}>Verifikasi</button>
            </>
          )}
          {msg && <p className="text-sm text-dim">{msg}</p>}
          <p className="text-xs text-dim">Catatan: data di cloud tidak dienkripsi end-to-end (terbaca oleh pemilik proyek Supabase).</p>
        </>
      )}
    </section>
  );
}

```

Tambahkan `<CloudSection />` di akhir `Settings.tsx`, dan di `App.tsx` panggil auto-trigger:

```tsx
// App.tsx — di dalam useEffect bootstrap
import { startSyncAutoTrigger } from './sync/engine';
// ...
useEffect(() => {
  void seedIfEmpty();
  void requestPersist();
  return startSyncAutoTrigger();
}, []);

```

### ✅ Checkpoint Fase 3

- [ ] Skema SQL berjalan tanpa error; RLS aktif di 5 tabel
- [ ] Login (Google atau OTP, sesuai hasil Fase 0) berhasil di PWA terpasang
- [ ] Mode pesawat → catat 3 transaksi → **tidak ada error di UI** → matikan mode pesawat → baris muncul di Supabase (cek Table Editor)
- [ ] `dirty` kembali 0 setelah push (cek lewat konsol eruda atau fitur ekspor)
- [ ] **Uji RLS:** buat akun kedua, pastikan tidak bisa membaca baris akun pertama
- [ ] **Uji pulihkan:** hapus PWA dari Home Screen, pasang ulang, login → saldo dan transaksi kembali, **tidak ada dompet ganda**
- [ ] **Uji dua perangkat (opsional):** edit di satu perangkat muncul di perangkat lain setelah sync
- [ ] `git commit -m "fase3"`

---

# FASE 4 — Analitik, Tagihan, Kunci Aplikasi, Ekspor

## Step 4.1 — Analitik

`src/features/analytics/Analytics.tsx`

```tsx
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis } from 'recharts';
import { categorySpend, dailySpend } from '../../domain/balances';
import { useLedger } from '../../hooks/useLedger';
import { addDays, startOfDay, startOfMonth, startOfNextMonth } from '../../lib/dates';
import { rp } from '../../lib/format';
import { BudgetBar } from '../../ui/BudgetBar';

const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });

export default function Analytics() {
  const { txs, categories } = useLedger();
  const now = Date.now();
  const cats = categorySpend(txs, categories, startOfMonth(now), startOfNextMonth(now));
  const monthTotal = cats.reduce((s, c) => s + c.total, 0);
  const daily = dailySpend(txs, addDays(startOfDay(now), -6), 7).map((d) => ({ name: dayName.format(d.day), total: d.total }));

  return (
    <div className="h-full overflow-y-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analitik bulan ini</h1>
        <p className="text-dim text-sm">Pengeluaran {rp(monthTotal)}</p>
      </div>

      <section>
        <h2 className="font-semibold mb-2">7 hari terakhir</h2>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={daily}>
              <XAxis dataKey="name" tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Per kategori</h2>
        {cats.length === 0 ? (
          <p className="text-dim text-sm">Belum ada pengeluaran bulan ini.</p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cats.map((c) => ({ name: c.category.name, value: c.total }))} dataKey="value" innerRadius={50} outerRadius={80} stroke="none">
                    {cats.map((c) => <Cell key={c.category.id} fill={c.category.colorHex} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 mt-3">
              {cats.map(({ category, total }) => (
                <li key={category.id}>
                  {category.monthlyLimit ? (
                    <BudgetBar ratio={total / category.monthlyLimit} label={category.name} trailing={`${rp(total)} / ${rp(category.monthlyLimit)}`} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: category.colorHex }} />
                      <span className="flex-1">{category.name}</span>
                      <span className="font-semibold">{rp(total)}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

```

## Step 4.2 — Tagihan Berulang

`src/domain/recurring.ts`

```ts
import { db } from '../db/db';
import type { Frequency } from '../db/schema';
import { addDays, addMonthsClamped } from '../lib/dates';
import { emitLedgerChanged } from '../lib/events';
import { newId } from '../lib/id';
import { insertValidated } from './ledger';

export function advance(ms: number, f: Frequency): number {
  if (f === 'weekly') return addDays(ms, 7);
  if (f === 'yearly') return addMonthsClamped(ms, 12);
  return addMonthsClamped(ms, 1);
}

/**
 * Mengejar semua periode terlewat. ID transaksi deterministik => aman dijalankan berulang
 * (dan di beberapa perangkat). Transaksi yang sudah dihapus pengguna TIDAK dibuat ulang.
 * Catatan: tanggal 31 yang dijepit ke 28/30 tidak kembali ke 31 pada bulan berikutnya.
 */
export async function processDueBills(now: number = Date.now()): Promise<number> {
  const due = await db.bills.where('nextDueAt').belowOrEqual(now)
    .filter((b) => b.isActive === 1 && b.autoRecord === 1 && b.isDeleted === 0).toArray();
  let created = 0;
  for (const b of due) {
    try {
      await db.transaction('rw', db.bills, db.transactions, db.wallets, db.categories, async () => {
        const fresh = await db.bills.get(b.id);
        if (!fresh || fresh.isDeleted || !fresh.isActive || !fresh.autoRecord) return;
        let next = fresh.nextDueAt;
        let guard = 0;
        while (next <= now && guard++ < 400) {
          const id = `bill:${fresh.id}:${next}`;
          if (!(await db.transactions.get(id))) {
            await insertValidated(
              { type: 'expense', amount: fresh.amount, walletId: fresh.walletId, categoryId: fresh.categoryId, note: fresh.name, occurredAt: next },
              id,
            );
            created++;
          }
          next = advance(next, fresh.frequency);
        }
        await db.bills.update(fresh.id, { nextDueAt: next, updatedAt: Date.now(), dirty: 1 });
      });
    } catch {
      /* satu tagihan gagal tidak menghentikan yang lain */
    }
  }
  if (created) emitLedgerChanged();
  return created;
}

export async function addBill(input: {
  name: string; amount: number; walletId: string; categoryId: string; frequency: Frequency; nextDueAt: number;
}): Promise<void> {
  if (!input.name.trim() || !Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error('Data tagihan tidak valid');
  await db.bills.add({
    id: newId(), ...input, name: input.name.trim(), autoRecord: 1, isActive: 1,
    updatedAt: Date.now(), isDeleted: 0, dirty: 1,
  });
  emitLedgerChanged();
}

export async function setBillActive(id: string, active: boolean): Promise<void> {
  await db.bills.update(id, { isActive: active ? 1 : 0, updatedAt: Date.now(), dirty: 1 });
  emitLedgerChanged();
}

export async function deleteBill(id: string): Promise<void> {
  await db.bills.update(id, { isDeleted: 1, updatedAt: Date.now(), dirty: 1 });
  emitLedgerChanged();
}

```

`src/domain/recurring.test.ts`

```ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { SEED, seedIfEmpty } from '../db/seed';
import { computeBalances } from './balances';
import { addBill, processDueBills } from './recurring';
import { softDeleteTransaction } from './ledger';

beforeEach(async () => {
  await db.delete(); await db.open(); await seedIfEmpty();
  await db.wallets.update(SEED.walletMandiri, { openingBalance: 1_000_000 });
});

describe('recurring', () => {
  const jan15 = new Date(2026, 0, 15, 9).getTime();
  const apr20 = new Date(2026, 3, 20, 9).getTime();
  const input = { name: 'Spotify', amount: 20_000, walletId: SEED.walletMandiri, categoryId: SEED.catBill, frequency: 'monthly' as const, nextDueAt: jan15 };

  it('mengejar 4 periode (Jan–Apr) dan memajukan jatuh tempo ke Mei', async () => {
    await addBill(input);
    expect(await processDueBills(apr20)).toBe(4);
    const bill = (await db.bills.toArray())[0];
    expect(bill.nextDueAt).toBe(new Date(2026, 4, 15, 9).getTime());
    const bal = computeBalances(await db.wallets.toArray(), await db.transactions.toArray());
    expect(bal.get(SEED.walletMandiri)).toBe(1_000_000 - 4 * 20_000);
  });

  it('dijalankan dua kali tidak menggandakan', async () => {
    await addBill(input);
    await processDueBills(apr20);
    expect(await processDueBills(apr20)).toBe(0);
    expect(await db.transactions.count()).toBe(4);
  });

  it('transaksi yang dihapus pengguna tidak dibuat ulang', async () => {
    await addBill(input);
    await processDueBills(apr20);
    const first = (await db.transactions.orderBy('occurredAt').first())!;
    await softDeleteTransaction(first.id);
    await db.bills.update((await db.bills.toArray())[0].id, { nextDueAt: jan15 }); // paksa ulang
    await processDueBills(apr20);
    expect((await db.transactions.get(first.id))!.isDeleted).toBe(1);
  });
});

```

`src/features/bills/Bills.tsx`

```tsx
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Frequency } from '../../db/schema';
import { addBill, deleteBill, setBillActive } from '../../domain/recurring';
import { useLedger } from '../../hooks/useLedger';
import { rp } from '../../lib/format';
import { ActionSheet } from '../../ui/ActionSheet';

const field = 'w-full h-11 rounded-xl border border-border bg-bg px-3';
const dfmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

export default function Bills() {
  const bills = useLiveQuery(() => db.bills.where('isDeleted').equals(0).sortBy('nextDueAt'), []) ?? [];
  const { wallets, categories } = useLedger();
  const expCats = categories.filter((c) => c.type === 'expense');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [freq, setFreq] = useState<Frequency>('monthly');
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState('');

  async function save() {
    try {
      const [y, m, d] = due.split('-').map(Number);
      await addBill({ name, amount: Number(amount), walletId: walletId || wallets[0].id, categoryId: categoryId || expCats[0].id, frequency: freq, nextDueAt: new Date(y, m - 1, d, 9).getTime() });
      setOpen(false); setName(''); setAmount(''); setErr('');
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-24">
      <h1 className="text-xl font-bold mb-3">Tagihan & Langganan</h1>
      {bills.length === 0 && <p className="text-dim">Belum ada tagihan berulang.</p>}
      <ul className="space-y-2">
        {bills.map((b) => (
          <li key={b.id} className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="truncate">{b.name}</div>
              <div className="text-xs text-dim">{b.frequency} • berikutnya {dfmt.format(b.nextDueAt)}</div>
            </div>
            <div className="font-semibold">{rp(b.amount)}</div>
            <button className="text-xs px-2 h-8 rounded-lg border border-border" onClick={() => void setBillActive(b.id, !b.isActive)}>{b.isActive ? 'Aktif' : 'Jeda'}</button>
            <button className="text-xs px-2 h-8 rounded-lg border border-danger text-danger" onClick={() => void deleteBill(b.id)}>Hapus</button>
          </li>
        ))}
      </ul>
      <button className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full bg-primary text-2xl" onClick={() => setOpen(true)} aria-label="Tambah">+</button>

      <ActionSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="font-semibold">Tagihan baru</h2>
        <input className={field} placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} inputMode="numeric" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className={field} value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {expCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={field} value={freq} onChange={(e) => setFreq(e.target.value as Frequency)}>
          <option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
        </select>
        <input className={field} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        {err && <p className="text-danger text-sm">{err}</p>}
        <button className="w-full h-12 rounded-xl bg-primary font-semibold" onClick={() => void save()}>Simpan</button>
      </ActionSheet>
    </div>
  );
}

```

## Step 4.3 — Kunci Aplikasi (PIN)

> **Batas yang harus dipahami:** ini kunci **tampilan**. Data di IndexedDB tidak terenkripsi; orang dengan akses teknis ke perangkat yang sudah terbuka bisa membacanya. Face ID tidak tersedia langsung di web.

`src/features/lock/pin.ts`

```ts
export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 150_000, hash: 'SHA-256' }, key, 256,
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

```

`src/features/lock/PinPad.tsx`

```tsx
export function PinPad({ value, onChange, length = 6 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const press = (d: string) => value.length < length && onChange(value + d);
  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={`h-3.5 w-3.5 rounded-full border ${i < value.length ? 'bg-white border-white' : 'border-dim'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
        {['1','2','3','4','5','6','7','8','9'].map((d) => (
          <button key={d} className="h-14 rounded-full border border-border text-2xl active:bg-primary/30" onClick={() => press(d)}>{d}</button>
        ))}
        <span />
        <button className="h-14 rounded-full border border-border text-2xl active:bg-primary/30" onClick={() => press('0')}>0</button>
        <button className="h-14 rounded-full text-xl text-dim" onClick={() => onChange(value.slice(0, -1))}>⌫</button>
      </div>
    </div>
  );
}

```

`src/features/lock/LockGate.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSetting } from '../../hooks/useSetting';
import { hashPin } from './pin';
import { PinPad } from './PinPad';

export function LockGate({ children }: { children: ReactNode }) {
  const [enabled, , ready] = useSetting<boolean>('lockEnabled', false, true);
  const [pinHash] = useSetting<string>('pinHash', '', true);
  const [salt] = useSetting<string>('pinSalt', '', true);
  const [locked, setLocked] = useState(true); // kunci saat cold start
  const [hidden, setHidden] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [fails, setFails] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const enabledRef = useRef(false);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        setHidden(true);
        if (enabledRef.current) setLocked(true);
      } else {
        setHidden(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (pin.length !== 6) return;
    void (async () => {
      if (Date.now() < waitUntil) { setErr('Terlalu banyak percobaan. Tunggu sebentar.'); setPin(''); return; }
      const ok = (await hashPin(pin, salt)) === pinHash;
      if (ok) { setLocked(false); setFails(0); setErr(''); }
      else {
        const n = fails + 1;
        setFails(n);
        if (n >= 5) setWaitUntil(Date.now() + 30_000 * (n - 4));
        setErr('PIN salah');
      }
      setPin('');
    })();
  }, [pin, salt, pinHash, fails, waitUntil]);

  const covered = !ready || (enabled && (locked || hidden));
  return (
    <>
      {children}
      {covered && (
        <div className="fixed inset-0 z-[100] bg-black grid place-items-center">
          {ready && enabled && locked && !hidden && (
            <div className="text-center space-y-6">
              <div className="text-lg">Masukkan PIN</div>
              <PinPad value={pin} onChange={setPin} />
              <div className="h-5 text-sm text-danger">{err}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

```

`src/features/lock/PinSetup.tsx` (dipakai di Pengaturan)

```tsx
import { useState } from 'react';
import { setSetting } from '../../domain/settings';
import { useSetting } from '../../hooks/useSetting';
import { hashPin } from './pin';
import { PinPad } from './PinPad';

export function LockSettings() {
  const [enabled] = useSetting<boolean>('lockEnabled', false, true);
  const [step, setStep] = useState<'idle' | 'first' | 'confirm'>('idle');
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');

  async function onChange(v: string) {
    setPin(v);
    if (v.length !== 6) return;
    if (step === 'first') { setFirst(v); setPin(''); setStep('confirm'); return; }
    if (v !== first) { setMsg('PIN tidak sama. Ulangi.'); setPin(''); setStep('first'); return; }
    const salt = crypto.randomUUID();
    await setSetting('pinSalt', salt, true);
    await setSetting('pinHash', await hashPin(v, salt), true);
    await setSetting('lockEnabled', true, true);
    setStep('idle'); setPin(''); setMsg('Kunci aplikasi aktif.');
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm text-dim">Kunci aplikasi (PIN)</h2>
      {step === 'idle' ? (
        <>
          <button className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-left" onClick={() => { setMsg(''); setStep('first'); }}>
            {enabled ? 'Ganti PIN' : 'Aktifkan PIN 6 digit'}
          </button>
          {enabled && (
            <button className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-left" onClick={() => void setSetting('lockEnabled', false, true)}>
              Matikan kunci
            </button>
          )}
        </>
      ) : (
        <div className="py-4 text-center space-y-4">
          <div>{step === 'first' ? 'Buat PIN baru' : 'Ulangi PIN'}</div>
          <PinPad value={pin} onChange={(v) => void onChange(v)} />
          <button className="text-dim" onClick={() => { setStep('idle'); setPin(''); }}>Batal</button>
        </div>
      )}
      {msg && <p className="text-sm text-dim">{msg}</p>}
      <p className="text-xs text-dim">Ini kunci tampilan, bukan enkripsi data. Lupa PIN: hapus & pasang ulang PWA lalu pulihkan dari cloud/JSON.</p>
    </section>
  );
}

```

Tambahkan `<LockSettings />` di `Settings.tsx` (di atas atau di bawah bagian Cadangan).

## Step 4.4 — App final

`src/App.tsx` (versi final Fase 4)

```tsx
import { useEffect, useRef } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { seedIfEmpty } from './db/seed';
import { processDueBills } from './domain/recurring';
import Analytics from './features/analytics/Analytics';
import Bills from './features/bills/Bills';
import Dashboard from './features/dashboard/Dashboard';
import History from './features/history/History';
import { LockGate } from './features/lock/LockGate';
import QuickAdd from './features/quick-add/QuickAdd';
import { InstallBanner } from './features/settings/InstallBanner';
import Settings from './features/settings/Settings';
import Spike from './features/spike/Spike';
import Wallets from './features/wallets/Wallets';
import { useSetting } from './hooks/useSetting';
import { requestPersist } from './lib/storage';
import { startSyncAutoTrigger } from './sync/engine';

function Shell() {
  const loc = useLocation();
  const nav = useNavigate();
  const [startScreen, , ready] = useSetting<'home' | 'add'>('startScreen', 'home', true);
  const did = useRef(false);

  useEffect(() => {
    if (ready && !did.current) {
      did.current = true;
      if (startScreen === 'add' && loc.pathname === '/') nav('/add', { replace: true });
    }
  }, [ready, startScreen, loc.pathname, nav]);

  const hideNav = loc.pathname === '/add' || loc.pathname === '/spike';
  const tab = ({ isActive }: { isActive: boolean }) => `flex-1 grid place-items-center text-xs ${isActive ? 'text-primary' : 'text-dim'}`;

  return (
    <div className="h-full flex flex-col">
      {loc.pathname === '/' && <InstallBanner />}
      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<QuickAdd />} />
          <Route path="/history" element={<History />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/spike" element={<Spike />} />
        </Routes>
      </main>
      {!hideNav && (
        <nav className="h-16 shrink-0 flex items-center border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] box-content">
          <NavLink to="/" end className={tab}>Home</NavLink>
          <NavLink to="/history" className={tab}>Riwayat</NavLink>
          <NavLink to="/add" className="mx-1 h-12 px-5 rounded-full bg-primary grid place-items-center font-semibold active:scale-95 transition">+ Catat</NavLink>
          <NavLink to="/analytics" className={tab}>Analitik</NavLink>
          <NavLink to="/bills" className={tab}>Tagihan</NavLink>
          <NavLink to="/settings" className={tab}>Setelan</NavLink>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    void (async () => {
      await seedIfEmpty();
      await requestPersist();
      await processDueBills();
    })();
    const onVis = () => { if (document.visibilityState === 'visible') void processDueBills(); };
    document.addEventListener('visibilitychange', onVis);
    const stopSync = startSyncAutoTrigger();
    return () => { document.removeEventListener('visibilitychange', onVis); stopSync(); };
  }, []);

  return (
    <LockGate>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </LockGate>
  );
}

```

> Dompet tetap dapat diakses dari Dashboard (tautan "Dompet"); tab bawah memuat Analitik/Tagihan.

### ✅ Checkpoint Fase 4

- [ ] Tes `recurring.test.ts` lulus (4 periode, tidak menggandakan, menghormati transaksi yang dihapus)
- [ ] Analitik menampilkan bar 7 hari dan donut kategori dengan angka yang cocok dengan Riwayat
- [ ] PIN: aktifkan → tutup app → buka → diminta PIN; 5 kali salah → ada jeda
- [ ] **Verifikasi manual App Switcher di iPhone:** pindah ke app lain, buka tampilan multitasking; nominal TIDAK boleh terlihat. Catat hasilnya apa adanya (lolos/gagal)
- [ ] CSV terbuka rapi di aplikasi spreadsheet Anda (kolom terpisah, huruf benar)
- [ ] `git commit -m "fase4"`

---

# FASE 5 — Input Cerdas & Poles

## Step 5.1 — Parser Teks Struk/QRIS (`src/domain/parser.ts`)

```ts
export interface ParsedReceipt {
  amount: number | null;
  merchant: string | null;
}

const MONEY = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,})(?:[.,]\d{1,2})?/gi;
const TOTAL_KEYS = ['total', 'jumlah', 'nominal', 'bayar', 'amount', 'tagihan'];

function toInt(raw: string): number | null {
  const v = Number.parseInt(raw.replace(/[.,]/g, ''), 10);
  if (!Number.isFinite(v) || v <= 0 || v >= 100_000_000_000) return null; // buang no. rekening/referensi
  return v;
}

const maxOf = (l: number[]): number | null => (l.length ? Math.max(...l) : null);

/** Heuristik: kata kunci total > angka berawalan "Rp" > angka terbesar. Hasil harus bisa diedit pengguna. */
export function parseReceipt(text: string): ParsedReceipt {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const keyed: number[] = [];
  const prefixed: number[] = [];
  const all: number[] = [];

  for (const l of lines) {
    const low = l.toLowerCase();
    for (const m of l.matchAll(MONEY)) {
      const v = toInt(m[1]);
      if (v === null) continue;
      all.push(v);
      if (low.includes('rp')) prefixed.push(v);
      if (TOTAL_KEYS.some((k) => low.includes(k))) keyed.push(v);
    }
  }
  const amount = maxOf(keyed) ?? maxOf(prefixed) ?? maxOf(all);

  let merchant: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const low = lines[i].toLowerCase();
    if (low.includes('merchant') || low.includes('penerima') || low.includes('kepada')) {
      const after = lines[i].split(/[:：]/);
      if (after.length > 1 && after[1].trim().length > 2) merchant = after[1].trim();
      else if (i + 1 < lines.length) merchant = lines[i + 1];
      break;
    }
  }
  if (!merchant) {
    merchant = lines.find((l) => /[A-Za-z]{3,}/.test(l) && !/\d{4,}|\d[.,]\d{3}/.test(l)) ?? null;
  }
  return { amount, merchant };
}

```

`src/domain/parser.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { parseReceipt } from './parser';

describe('parseReceipt', () => {
  it('memprioritaskan baris total dan membuang nomor panjang', () => {
    const r = parseReceipt('KOPI KENANGAN\nNo. 123456789012\nSubtotal Rp 22.000\nTotal Rp 25.000\nTerima kasih');
    expect(r.amount).toBe(25_000);
    expect(r.merchant).toBe('KOPI KENANGAN');
  });
  it('membaca desimal dan label merchant', () => {
    const r = parseReceipt('Nama Merchant: Toko Maju\nNominal Rp 150.000,00');
    expect(r.amount).toBe(150_000);
    expect(r.merchant).toBe('Toko Maju');
  });
  it('tanpa angka → null', () => expect(parseReceipt('halo dunia').amount).toBeNull());
});

```

> **Wajib:** kumpulkan 10–20 teks dari struk/QRIS nyata Anda (hasil Live Text iOS) sebagai kasus uji tambahan, lalu minta agen menyempurnakan `parseReceipt` sampai lolos. Akurasi tanpa data nyata tidak boleh diklaim.

## Step 5.2 — Tombol "Tempel teks" di layar Catat

Di `QuickAdd.tsx`, tambahkan di bawah input catatan:

```tsx
// import { parseReceipt } from '../../domain/parser';
<button
  type="button"
  className="h-10 rounded-xl border border-border text-sm text-dim mb-2"
  onClick={async () => {
    try {
      const text = await navigator.clipboard.readText();
      const r = parseReceipt(text);
      if (r.amount) setExpr(String(r.amount));
      if (r.merchant) setNote(r.merchant);
    } catch {
      setError('Tidak bisa membaca clipboard. Izinkan tempel, atau ketik manual.');
    }
  }}
>
  Tempel teks struk/QRIS
</button>

```

Cara pakai di iPhone: buka foto struk di Foto → tahan teks (Live Text) → Salin → buka MyFinance → "Tempel teks".

> `navigator.clipboard.readText()` di Safari iOS biasanya memunculkan pop-up "Tempel" yang harus disetujui; perilaku di PWA standalone **perlu diverifikasi**.

## Step 5.3 — Eksperimen OCR Tesseract.js (opsional, berbatas)

```bash
npm install tesseract.js

```

`src/features/spike/OcrSpike.tsx` (rute `/ocr-spike`, hanya untuk eksperimen)

```tsx
import { useState } from 'react';
import { parseReceipt } from '../../domain/parser';

export default function OcrSpike() {
  const [out, setOut] = useState('');
  const [ms, setMs] = useState(0);
  async function run(file: File) {
    const t0 = performance.now();
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng'); // bahasa 'ind' perlu diunduh; caching offline = pekerjaan tambahan
    const { data } = await worker.recognize(file);
    await worker.terminate();
    setMs(Math.round(performance.now() - t0));
    setOut(`${data.text}\n---\n${JSON.stringify(parseReceipt(data.text))}`);
  }
  return (
    <div className="p-4 space-y-3">
      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void run(e.target.files[0])} />
      <div className="text-sm text-dim">Waktu: {ms} ms</div>
      <pre className="whitespace-pre-wrap text-xs">{out}</pre>
    </div>
  );
}

```

Uji dengan 10–20 gambar nyata. Catat: berapa nominal yang benar, berapa detik per gambar, dan ukuran data yang diunduh. **Putuskan** apakah layak dimasukkan; jika akurasi rendah, jalur "Tempel teks" sudah cukup untuk v1.

## Step 5.4 — Poles & Pengukuran

- [ ] Ikon, splash, nama app terlihat benar di Home Screen
- [ ] Safe area benar di semua layar; keyboard tidak menutupi tombol Simpan
- [ ] Indikator versi build di Pengaturan (untuk mendeteksi service worker usang): tampilkan `import.meta.env.MODE` + tanggal build, atau hash commit lewat env Vercel
- [ ] Ukur: waktu buka dingin dan hangat (stopwatch), scroll Riwayat dengan 1.000+ transaksi (impor JSON uji), ukuran bundel (`npm run build` menampilkan ukuran)
- [ ] Eksperimen opsional: WebAuthn (passkey) sebagai pengganti PIN

### ✅ Checkpoint Fase 5

- [ ] Tes parser (termasuk data nyata Anda) lulus; akurasi tercatat, mis. "nominal benar 14 dari 20"
- [ ] Keputusan OCR Tesseract: dipakai / ditunda, dengan angka pendukung
- [ ] Hasil ukur performa tercatat
- [ ] `git commit -m "fase5"`

---

# Checklist Regresi Akhir (iPhone, PWA terpasang)


| Skenario                       | Hasil yang benar                                          |
| ------------------------------ | --------------------------------------------------------- |
| Expense Rp 25.000 dari GoPay   | Saldo GoPay −25.000; pengeluaran hari ini +25.000         |
| Transfer 100.000 + admin 1.000 | Sumber −101.000, tujuan +100.000, pengeluaran +1.000 saja |
| Edit nominal expense           | Saldo mengikuti nominal baru                              |
| Hapus lalu Urungkan            | Saldo kembali ke nilai sebelum hapus                      |
| Saldo tidak cukup              | Peringatan merah halus; tetap bisa disimpan               |
| Tagihan terlewat 3 bulan       | Transaksi tercatat per periode; tidak menggandakan        |
| Mode pesawat                   | Semua alur inti jalan; tidak ada pesan error              |
| Offline → online               | Data masuk Supabase otomatis                              |
| Instalasi baru + login         | Data pulih, tanpa dompet ganda                            |
| PIN aktif, app ke background   | Overlay hitam; PIN diminta saat kembali                   |
| Ekspor JSON → impor (ganti)    | Saldo dan transaksi identik                               |
| Buka app 7 hari kemudian       | Data masih ada                                            |


# Troubleshooting Cepat


| Gejala                                            | Tindakan                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Tailwind tidak menerapkan kelas                   | Cek versi Tailwind (v4 memakai `@import "tailwindcss"` dan plugin Vite); minta agen menyesuaikan |
| `crypto.randomUUID is not a function`             | Akses lewat HTTP non-localhost; gunakan HTTPS (URL Vercel)                                       |
| Service worker menyajikan versi lama              | Tutup total PWA lalu buka lagi; periksa indikator versi; pertimbangkan `registerType: 'prompt'`  |
| Data tidak muncul setelah menambah ke Home Screen | Normal: penyimpanan Safari dan PWA terpisah. Pulihkan via cloud atau impor JSON                  |
| OAuth Google kembali ke Safari, bukan PWA         | Gunakan email OTP; catat sebagai batasan                                                         |
| Email OTP berisi tautan, bukan kode               | Ubah template email Supabase agar memakai `{{ .Token }}`                                         |
| `useLiveQuery` mengembalikan `undefined` terus    | Normal saat memuat; gunakan `ready` dari `useLedger`                                             |
| Push gagal `violates row-level security`          | `user_id` tidak sama dengan `auth.uid()`; pastikan `toRemote` mengisi `user_id` dari sesi        |
| Indeks Dexie error pada boolean/null              | Gunakan flag `0/1` dan jangan indeks kolom nullable                                              |
| Preview Vercel tidak memuat env                   | Tambahkan env di Vercel untuk environment Preview juga, lalu redeploy                            |


 