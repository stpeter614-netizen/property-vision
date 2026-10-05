'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Enquiry = {
  id: string;
  unit_id: string | null;
  configuration_id: string | null;
  buyer_name: string;
  buyer_contact: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const statuses = ['new','contacted','qualified','reserved','closed','lost'];

export default function LeadDetail() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/developer/enquiries')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load lead');
        const found = (data.enquiries || []).find((entry: Enquiry) => entry.id === params.id);
        if (!found) throw new Error('Lead not found');
        setItem(found);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load lead'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateStatus(status: string) {
    if (!item) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/developer/enquiries/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update status');
      setItem({ ...item, status: data.enquiry.status, updated_at: data.enquiry.updated_at });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="shell"><p className="notice">Loading lead…</p></main>;
  if (!item) return <main className="shell"><p className="notice">{error || 'Lead not found'}</p></main>;

  return (
    <main className="shell">
      <nav className="nav"><a href="/developer/leads">← Lead Inbox</a><span>Lead Detail</span></nav>
      <section>
        <p className="eyebrow">BUYER LEAD</p>
        <h1>{item.buyer_name}</h1>
        <p>{item.buyer_contact}</p>
        {error && <div className="notice">{error}</div>}

        <div className="grid">
          <article className="card"><h2>Property</h2><p><strong>Unit:</strong> {item.unit_id || 'Not supplied'}</p><p><strong>Configuration:</strong> {item.configuration_id ? <a href={'/developer/configuration?id=' + encodeURIComponent(item.configuration_id)}>{item.configuration_id} →</a> : 'Not supplied'}</p></article>
          <article className="card"><h2>Lead status</h2><p><strong>{item.status.toUpperCase()}</strong></p><div className="actions">{statuses.map((status) => <button key={status} className={status === item.status ? 'button' : 'button secondary'} disabled={saving} onClick={() => updateStatus(status)}>{status}</button>)}</div></article>
        </div>

        <article className="panel"><h2>Buyer message</h2><p>{item.message || 'No message supplied.'}</p></article>
        <article className="panel"><h2>Timeline</h2><p>Created: {new Date(item.created_at).toLocaleString()}</p><p>Last updated: {new Date(item.updated_at).toLocaleString()}</p></article>
      </section>
    </main>
  );
}
