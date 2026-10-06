'use client';

import { useMemo, useState } from 'react';

const groups = [
  ['Property Design', ['House design','Floor-plan design','Interior design','Exterior design','3D visualization']],
  ['Construction', ['New construction','Structural works','Roofing','Plumbing','Electrical installation','HVAC','Doors & windows','Landscaping']],
  ['Materials & Finishes', ['Painting','Waterproofing','Tiling','Flooring','Ceiling installation','Kitchen installation','Bathroom fitting','Cabinetry & joinery']],
  ['Renovation & Remodeling', ['Whole-property renovation','Kitchen renovation','Bathroom renovation','Extensions','Conversions','Exterior upgrade']],
  ['Repairs & Maintenance', ['Plumbing repairs','Electrical repairs','Roof repairs','Leak & water-damage repair','General maintenance','Property inspection']],
  ['Buy, Sell & Rent', ['Property for sale','Property for rent','Property valuation','Property marketing','Property comparison']],
  ['Professional Property Services', ['Quantity surveying','Cost estimation','Project management','Site supervision','Architectural services','Structural engineering','MEP services']],
  ['Interior & Lifestyle', ['Furniture','Curtains & blinds','Smart-home systems','Home staging']],
  ['Property Vision Digital', ['Off-plan experience','Property configurator','Digital property record','Buyer configuration','Developer sales portal','Construction-stage visualization','Digital handover record']],
] as const;

export default function ServicesPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => groups.map(([name, services]) => [name, services.filter(s => s.toLowerCase().includes(query.toLowerCase()))] as const).filter(([, services]) => services.length),
    [query]
  );

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>Services</span></nav>
      <section className="hero">
        <div>
          <p className="eyebrow">PROPERTY LIFECYCLE INFRASTRUCTURE</p>
          <h1>One platform for the property lifecycle.</h1>
          <p className="lead">Design, plan, build, buy, sell, rent, configure, renovate, repair, maintain and upgrade property through one connected experience.</p>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search property services…" aria-label="Search property services" />
        </div>
      </section>
      <section className="grid">
        {filtered.map(([name, services]) => (
          <div className="card" key={name}>
            <p className="eyebrow">{services.length} SERVICES</p>
            <h2>{name}</h2>
            <div className="service-list">{services.map(service => <div className="option" key={service}><strong>{service}</strong><span>View service →</span></div>)}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
