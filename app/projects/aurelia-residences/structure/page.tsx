'use client';

import { useEffect, useMemo, useState } from 'react';
import { trackPropertyEvent } from '@/lib/analytics';

const levels = ['Foundation', 'Ground floor', 'First floor', 'Second floor', 'Third floor', 'Roof'];
const elements = [
  ['Foundations', 'Foundation'],
  ['Columns', 'Vertical load-bearing frame'],
  ['Beams', 'Horizontal structural frame'],
  ['Slabs', 'Floor plates'],
  ['Structural walls', 'Load-bearing walls'],
  ['Staircase', 'Vertical circulation structure'],
  ['Roof structure', 'Roof framing'],
];

export default function StructurePage() {
  const [level, setLevel] = useState('Ground floor');
  const [mode, setMode] = useState<'skeleton' | 'layers'>('skeleton');

  useEffect(() => {
    void trackPropertyEvent('structure_viewed', { projectId: 'aurelia-residences', level, mode });
  }, [level, mode]);

  const visible = useMemo(
    () => elements.filter(([, detail]) => level === 'Foundation' ? detail === 'Foundation' : detail !== 'Foundation'),
    [level],
  );

  return (
    <main className="shell">
      <nav className="nav">
        <a href="/projects/aurelia-residences">← Aurelia Residences</a>
        <span>Structure</span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">STRUCTURE · OFF-PLAN · HOUSE DESIGN</p>
          <h1>See the building skeleton before the finishes.</h1>
          <p className="lead">
            Switch from the finished architectural experience to the structural framework:
            foundations, columns, beams, slabs, walls, stairs and roof.
          </p>
          <div className="option">
            <button className="button" onClick={() => setMode('skeleton')}>Structural skeleton</button>
            <button className="button" onClick={() => setMode('layers')}>Building layers</button>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow">LEVEL</p>
        <div className="grid">
          {levels.map(item => (
            <button className="card" key={item} onClick={() => setLevel(item)}>
              <strong>{item}</strong>
              <span>{item === level ? 'Currently viewing →' : 'View level →'}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">STRUCTURAL ELEMENTS · {mode.toUpperCase()}</p>
        <div className="grid">
          {visible.map(([name, detail]) => (
            <article className="card" key={name}>
              <h2>{name}</h2>
              <p>{detail}</p>
              <span>Model / drawing asset ready for integration →</span>
            </article>
          ))}
        </div>
      </section>

      <section className="option">
        <strong>Professional source of truth:</strong>
        <span>Structural geometry and engineering status are supplied from the project's approved professional model/drawings. Property Vision visualizes them; it does not invent or certify structural engineering.</span>
      </section>
    </main>
  );
}
