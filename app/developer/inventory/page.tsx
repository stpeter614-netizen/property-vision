'use client';

import { useEffect, useMemo, useState } from 'react';

type Unit = { id: string; unit_number: string; status: string; floor_number: number | null; bedrooms: number | null; bathrooms: number | null; area_sqm: number | null; price_cents: number | null };

export default function Inventory() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/developer/inventory?page=' + page + '&pageSize=50')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Unable to load inventory');
        setUnits(d.units || []);
        setConnected(d.connected !== false);
        setHasMore(d.hasMore === true);
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, [page]);

  const visible = useMemo(() => filter === 'all' ? units : units.filter((u) => u.status === filter), [units, filter]);
  const counts = useMemo(() => Object.fromEntries(['available', 'reserved', 'sold'].map((s) => [s, units.filter((u) => u.status === s).length])), [units]);

  return (
    <main className="shell">
      <nav className="nav"><a href="/developer">← Developer</a><span>Inventory</span></nav>
      <section>
        <p className="eyebrow">INVENTORY CONTROL</p><h1>Apartment inventory</h1><p>See unit availability before responding to buyers.</p>
        {!connected && <div className="notice">Database connection is not configured yet.</div>}
        <div className="actions">
          {['all', 'available', 'reserved', 'sold'].map((s) => <button type="button" className={filter === s ? 'button' : 'button secondary'} key={s} onClick={() => { setFilter(s); setPage(1); }}>{s} · {s === 'all' ? units.length : counts[s]}</button>)}
        </div>
        {loading ? <p className="notice">Loading inventory…</p> : visible.length ? <div className="grid">{visible.map((u) => <article className="card" key={u.id}><p className="eyebrow">{u.status.toUpperCase()}</p><h2>Unit {u.unit_number}</h2><p>Floor {u.floor_number ?? '—'} · {u.bedrooms ?? '—'} bedrooms · {u.bathrooms ?? '—'} bathrooms</p><p>{u.area_sqm ?? '—'} m² · {u.price_cents ? ('$' + (u.price_cents / 100).toLocaleString()) : 'Price not supplied'}</p></article>)}</div> : <div className="panel"><h2>No units to display</h2></div>}
        <div className="actions" aria-label="Inventory pages">
          <button type="button" className="button secondary" disabled={loading || page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span>Page {page}</span>
          <button type="button" className="button secondary" disabled={loading || !hasMore} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </section>
    </main>
  );
}