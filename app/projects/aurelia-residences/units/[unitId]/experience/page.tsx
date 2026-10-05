'use client';

import { use, useEffect } from 'react';
import { trackPropertyEvent } from '@/lib/analytics';

type Props = { params: Promise<{ unitId: string }> };

const rooms = [
  { id: 'living', name: 'Living room', detail: 'Light, flooring, furniture and view' },
  { id: 'dining', name: 'Dining', detail: 'Layout, lighting and finish selections' },
  { id: 'kitchen', name: 'Kitchen', detail: 'Cabinetry, worktop, appliances and lighting' },
  { id: 'bedroom-1', name: 'Primary bedroom', detail: 'Flooring, wardrobe and lighting' },
  { id: 'bedroom-2', name: 'Bedroom 2', detail: 'Flooring, wardrobe and lighting' },
  { id: 'bedroom-3', name: 'Bedroom 3', detail: 'Flooring, wardrobe and lighting' },
  { id: 'bathroom-1', name: 'Bathroom 1', detail: 'Sanitaryware, wall finish and fittings' },
  { id: 'bathroom-2', name: 'Bathroom 2', detail: 'Sanitaryware, wall finish and fittings' },
  { id: 'balcony', name: 'Balcony', detail: 'Outdoor finish and view' },
];

export default function ApartmentExperience({ params }: Props) {
  const { unitId } = use(params);
  useEffect(() => { void trackPropertyEvent('room_experience_opened', { unitId }); }, [unitId]);

  return (
    <main className="shell">
      <nav className="nav"><a href={'/projects/aurelia-residences/units/' + unitId}>← Unit {unitId}</a><span>Interactive apartment</span></nav>
      <section className="hero"><div><p className="eyebrow">ENTER HOME · UNIT {unitId}</p><h1>Experience the apartment room by room.</h1><p className="lead">Choose a space to explore. Your selections stay tied to Unit {unitId} and can become one exact buyer configuration.</p><a className="button" href={'/projects/aurelia-residences/units/' + unitId + '/customize'}>Customize the whole apartment</a></div></section>
      <section><div className="grid">{rooms.map(room => <a className="card" key={room.id} href={'/projects/aurelia-residences/units/' + unitId + '/customize?room=' + room.id}><h2>{room.name}</h2><p>{room.detail}</p><span>Explore this space →</span></a>)}</div></section>
    </main>
  );
}