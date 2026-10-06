'use client';

import { useEffect, useState } from 'react';

type WorkOrder = {
  id: string;
  property_record_id: string;
  title: string;
  work_type: string;
  urgency: string;
  status: string;
  budget_cents: number | null;
  requested_at: string;
  created_at: string;
  property_records?: { name: string | null; developer_id: string | null } | null;
};

const statuses = ['requested', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'];

export default function DeveloperWorkOrders() {
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/developer/work-orders?page=' + page + '&pageSize=50')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load work orders');
        setItems(data.workOrders || []);
        setHasMore(data.hasMore === true);
        setConnected(data.connected !== false);
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="shell">
      <nav className="nav"><a href="/developer">← Developer</a><span>Work Orders</span></nav>
      <section>
        <p className="eyebrow">PROPERTY OPERATIONS</p>
        <h1>Work Orders</h1>
        <p>Review authenticated customer requests and move eligible work into the execution workflow.</p>
        {!connected && <div className="notice">Unable to connect to the work-order database.</div>}
        {loading ? <p className="notice">Loading work orders…</p> : items.length === 0 ? <div className="panel"><h2>No work orders yet</h2><p>New customer requests will appear here when securely assigned to a developer property.</p></div> :
          <div className="grid">{items.map((item) => (
            <article className="card" key={item.id}>
              <p className="eyebrow">{item.urgency.toUpperCase()} · {item.status.toUpperCase()}</p>
              <h2>{item.title}</h2>
              <p><strong>Property:</strong> {item.property_records?.name || item.property_record_id}</p>
              <p><strong>Type:</strong> {item.work_type}</p>
              {item.budget_cents != null && <p><strong>Budget:</strong> {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(item.budget_cents / 100)}</p>}
              <p><small>{new Date(item.requested_at || item.created_at).toLocaleString()}</small></p>
              <a className="button" href={'/property/execution?workOrderId=' + item.id}>Open execution →</a>
            </article>
          ))}</div>}
        <div className="actions" aria-label="Work order pages">
          <button type="button" className="button secondary" disabled={loading || page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span>Page {page}</span>
          <button type="button" className="button secondary" disabled={loading || !hasMore} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </section>
    </main>
  );
}
