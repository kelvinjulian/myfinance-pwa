import { useEffect, useState } from 'react';
import Dexie from 'dexie';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

interface MetaRecord {
  key: string;
  value: number;
}

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

      const meta = sdb.table<MetaRecord>('meta');
      const first = await meta.get('firstSeen');
      if (!first) {
        await meta.put({ key: 'firstSeen', value: Date.now() });
        out.firstSeen = 'BARU dibuat sekarang';
      } else {
        out.firstSeen = new Date(first.value).toLocaleString('id-ID');
      }
      const opens = (((await meta.get('opens'))?.value) ?? 0) + 1;
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
