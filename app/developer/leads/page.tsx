'use client';

import { useEffect, useMemo, useState } from 'react';

type Enquiry = {
  id: string;
  unit_id: string | null;
  configuration_id: string | null;
  buyer_name: string;
  buyer_contact: string;
  message: string | null;
  status: string;
  created_at: string;
};

const statuses = ['new', 'contacted', 'qualified', 'reserved', 'closed', 'lost'];

export default function DeveloperLeads() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [connected, setConnected] = useState(true);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/developer/enquiries')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load enquiries');
        setItems(data.enquiries || []);
        setConnected(data.connected !== false);
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => filter === 'all' ? items : items.filter((item) => item.status === filter),
    [items, filter],
  );

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    try {
      const response = await fetch('/api/developer/enquiries/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update');
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Unable to update lead'); }
    finally { setBusy(null); }
  }

  return (
    <main className="shell">
      <nav className="nav"><a href="/developer">← Developer</a><span>Lead Inbox</span></nav>
      <section>
        <p className="eyebrow">SALES WORKSPACE</p>
        <h1>Lead Inbox</h1>
        <p>Buyer enquiries arrive with the exact apartment and configuration they selected.</p>
        {!connected && <div className="notice">Database connection is not configured yet. The workspace is ready for live enquiries.</div>}
        <div className="actions">
          {['all', ...statuses].map((status) => (
            <button key={status} type="button" className={filter === status ? 'button' : 'button secondary'} onClick={() => setFilter(status)}>
              {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <p className="notice">Loading enquiries…</p> : visible.length === 0 ? <div className="panel"><h2>No enquiries yet</h2><p>New buyer enquiries will appear here.</p></div> :
          <div className="grid">{visible.map((item) => <article className="card" key={item.id}>
            <p className="eyebrow">{item.status.toUpperCase()}</p>
            <h2><a href={'/developer/leads/' + item.id}>{item.buyer_name}</a></h2>
            <p>{item.buyer_contact}</p>
            <p><strong>Unit:</strong> {item.unit_id || '—'} · <strong>Configuration:</strong> {item.configuration_id || '—'}</p>
            {item.message && <p>{item.message}</p>}<div className="actions">{statuses.filter((status) => status !== item.status).slice(0, 3).map((status) => <button key={status} type="button" className="button secondary" disabled={busy === item.id} onClick={() => updateStatus(item.id, status)}>{busy === item.id ? 'Saving…' : status[0].toUpperCase() + status.slice(1)}</button>)}</div>
            <small>{new Date(item.created_at).toLocaleString()}</small>
          </article>)}</div>}
      </section>
    </main>
  );
}
