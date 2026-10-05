'use client';

import { trackPropertyEvent } from '@/lib/analytics';
import { use, useEffect, useMemo, useState } from 'react';

const groups = [
  ['Flooring', [['Standard Oak', 0], ['Premium Oak', 2500], ['Stone', 4000]]],
  ['Kitchen', [['Classic', 0], ['Premium', 4500], ['Luxury', 8500]]],
  ['Countertop', [['Quartz', 0], ['Premium Quartz', 1500], ['Marble', 3500]]],
  ['Lighting', [['Standard', 0], ['Smart', 2000], ['Premium Smart', 3500]]],
  ['Bathroom', [['Standard', 0], ['Premium', 3000], ['Luxury', 5500]]],
] as const;

type Props = { params: Promise<{ unitId: string }> };
type SavedConfiguration = { id: string; unitId: string; choices: Record<string,string>; total: number; createdAt: string };

function makeId() { return 'PV-' + Math.random().toString(36).slice(2, 7).toUpperCase() + '-' + Date.now().toString(36).toUpperCase(); }

export default function Customize({ params }: Props) {
  const { unitId } = use(params);
  void trackPropertyEvent('customizer_opened', { unitId }); void trackPropertyEvent('customizer_opened',{unitId});({ params }: Props) {
  const [choices, setChoices] = useState<Record<string,string>>({});
  const [saved, setSaved] = useState<SavedConfiguration | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const { unitId } = use(params);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('configuration');
    if (!raw) return;
    try {
      const shared = JSON.parse(decodeURIComponent(raw)) as SavedConfiguration;
      if (shared.unitId !== unitId || !shared.choices) return;
      setChoices(shared.choices);
      setSaved(shared);
      setNotice('Shared configuration loaded: ' + shared.id);
    } catch {
      setNotice('The shared configuration link is invalid or incomplete.');
    }
  }, [unitId]);

  const total = useMemo(() => 295000 + groups.reduce(
    (sum, [group, options]) => sum + (options.find(([option]) => option === choices[group])?.[1] ?? 0), 0
  ), [choices]);

  function saveConfiguration() {
    if (!unitId) return;
    const configuration = { id: makeId(), unitId, choices, total, createdAt: new Date().toISOString() };
    localStorage.setItem('property-vision:last-configuration', JSON.stringify(configuration));
    setSaved(configuration);
    setNotice('Configuration saved on this device: ' + configuration.id);
  }

  async function persistEnquiry(configuration: SavedConfiguration) {
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          configurationId: configuration.id,
          buyerName: name.trim(),
          buyerContact: contact.trim(),
          message: 'Buyer enquiry for Unit ' + unitId + ' at $' + configuration.total.toLocaleString(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(response.status === 503 ? 'Enquiry prepared locally. Database connection is not configured yet.' : (data.error || 'Enquiry could not be submitted.'));
        return;
      }
      setNotice('Enquiry submitted: ' + data.enquiry.id);
    } catch {
      setNotice('Enquiry prepared locally. Connection could not be reached.');
    }
  }

  async function shareConfiguration() {
    const existing = saved ?? JSON.parse(localStorage.getItem('property-vision:last-configuration') || 'null') as SavedConfiguration | null;
    const configuration = existing ?? { id: makeId(), unitId, choices, total, createdAt: new Date().toISOString() };
    localStorage.setItem('property-vision:last-configuration', JSON.stringify(configuration));
    setSaved(configuration);
    const payload = encodeURIComponent(JSON.stringify(configuration));
    const url = window.location.origin + window.location.pathname + '?configuration=' + payload;
    try { await navigator.clipboard.writeText(url); setNotice('Share link copied: ' + configuration.id); }
    catch { window.prompt('Copy this configuration link', url); }
  }

  function submitEnquiry() {
    if (!name.trim() || !contact.trim()) { setNotice('Please enter your name and phone or email.'); return; }
    const configuration = saved ?? { id: makeId(), unitId, choices, total, createdAt: new Date().toISOString() };
    localStorage.setItem('property-vision:last-configuration', JSON.stringify(configuration));
    localStorage.setItem('property-vision:enquiry', JSON.stringify({ configuration, name: name.trim(), contact: contact.trim(), createdAt: new Date().toISOString() }));
    setSaved(configuration);
    setEnquiryOpen(false);
    setNotice('Enquiry saved with configuration ' + configuration.id);
  }

  return (
    <main className="shell">
      <nav className="nav"><a href={unitId ? '/projects/aurelia-residences/units/' + unitId : '/projects/aurelia-residences'}>← Unit {unitId}</a><span>Customize</span></nav>
      <section>
        <p className="eyebrow">CONFIGURATION</p><h1>Make it yours</h1>
        <p>Select approved finishes and see the configured price update instantly.</p>
        {groups.map(([group, options]) => <div className="option" key={group}><h2>{group}</h2>{options.map(([option, price]) =>
          <button className={choices[group] === option ? 'selected' : ''} onClick={() => setChoices((current) => ({ ...current, [group]: option }))} key={option} type="button">{option}{price ? ' +$' + price.toLocaleString() : ' Included'}</button>
        )}</div>)}
        <div className="summary">
          <div><span>Configured price</span><strong>${total.toLocaleString()}</strong><small>Unit {unitId || '—'} · Save, share or enquire about this exact configuration.</small></div>
          <div className="actions">
            <button className="button" type="button" onClick={saveConfiguration}>Save configuration</button>
            <button className="button secondary" type="button" onClick={shareConfiguration}>Share</button>
            <button className="button secondary" type="button" onClick={() => setEnquiryOpen(true)}>Enquire</button>
          </div>
        </div>
        {notice && <p className="notice">{notice}</p>}
        {enquiryOpen && <div className="panel"><h2>Enquire about this configuration</h2><p>Your exact unit, choices and configured price will be attached to this enquiry.</p>
          <input aria-label="Name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
          <input aria-label="Phone or email" placeholder="Phone or email" value={contact} onChange={(event) => setContact(event.target.value)} />
          <div className="actions"><button className="button" type="button" onClick={submitEnquiry}>Send enquiry</button><button className="button secondary" type="button" onClick={() => setEnquiryOpen(false)}>Cancel</button></div>
        </div>}
      </section>
    </main>
  );
}
