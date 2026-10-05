'use client';

import { useMemo, useState } from 'react';

const groups = [
  ['Flooring', [['Standard Oak', 0], ['Premium Oak', 2500], ['Stone', 4000]]],
  ['Kitchen', [['Classic', 0], ['Premium', 4500], ['Luxury', 8500]]],
  ['Countertop', [['Quartz', 0], ['Premium Quartz', 1500], ['Marble', 3500]]],
  ['Lighting', [['Standard', 0], ['Smart', 2000], ['Premium Smart', 3500]]],
  ['Bathroom', [['Standard', 0], ['Premium', 3000], ['Luxury', 5500]]],
] as const;

type Props = { params: Promise<{ unitId: string }> };

export default function Customize({ params }: Props) {
  const [unitId, setUnitId] = useState('');
  const [choices, setChoices] = useState<Record<string, string>>({});

  void params.then(({ unitId: id }) => setUnitId(id));

  const total = useMemo(
    () => 295000 + groups.reduce(
      (sum, [group, options]) => sum + (options.find(([name]) => name === choices[group])?.[1] ?? 0),
      0,
    ),
    [choices],
  );

  return (
    <main className="shell">
      <nav className="nav">
        <a href={unitId ? '/projects/aurelia-residences/units/' + unitId : '/projects/aurelia-residences'}>
          ← Unit {unitId || '—'}
        </a>
        <span>Customize</span>
      </nav>
      <section>
        <p className="eyebrow">CONFIGURATION</p>
        <h1>Make it yours</h1>
        <p>Select approved finishes and see the configured price update instantly.</p>
        {groups.map(([group, options]) => (
          <div className="option" key={group}>
            <h2>{group}</h2>
            {options.map(([name, price]) => (
              <button
                className={choices[group] === name ? 'selected' : ''}
                onClick={() => setChoices((current) => ({ ...current, [group]: name }))}
                key={name}
                type="button"
              >
                {name}{price ? ' +$' + price.toLocaleString() : ' Included'}
              </button>
            ))}
          </div>
        ))}
        <div className="summary">
          <span>Configured price</span>
          <strong>${total.toLocaleString()}</strong>
          <small>Unit {unitId || '—'} · Configuration ready to save and share</small>
        </div>
      </section>
    </main>
  );
}