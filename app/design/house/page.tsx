'use client';

import { useMemo, useState } from 'react';

const styles = ['Modern','Contemporary','Traditional','Minimalist','Bungalow','Villa','Farmhouse'];
const roofs = ['Flat','Gable','Hip','Pitched','Mixed'];
const finishes = ['Standard','Premium','Luxury'];

export default function HouseDesignPage() {
  const [plot, setPlot] = useState('50 × 100 ft');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [floors, setFloors] = useState(1);
  const [style, setStyle] = useState('Modern');
  const [garage, setGarage] = useState('2-car garage');
  const [layout, setLayout] = useState('Open kitchen + living');
  const [roof, setRoof] = useState('Hip');
  const [finish, setFinish] = useState('Premium');
  const [budget, setBudget] = useState('KES 15,000,000');

  const summary = useMemo(() => ({ plot, bedrooms, bathrooms, floors, style, garage, layout, roof, finish, budget }), [plot, bedrooms, bathrooms, floors, style, garage, layout, roof, finish, budget]);

  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>House design</span></nav>
      <section className="hero">
        <div>
          <p className="eyebrow">DESIGN · CONFIGURE · PRICE</p>
          <h1>Design your house before you build it.</h1>
          <p className="lead">Start with the plot, rooms, style and budget. Property Vision turns the choices into one structured house design configuration.</p>
        </div>
      </section>

      <section className="grid">
        <label className="card">Plot dimensions<input value={plot} onChange={e=>setPlot(e.target.value)} placeholder="e.g. 50 × 100 ft" /></label>
        <label className="card">Bedrooms<select value={bedrooms} onChange={e=>setBedrooms(+e.target.value)}>{[1,2,3,4,5,6,7].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="card">Bathrooms<select value={bathrooms} onChange={e=>setBathrooms(+e.target.value)}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="card">Floors<select value={floors} onChange={e=>setFloors(+e.target.value)}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="card">House style<select value={style} onChange={e=>setStyle(e.target.value)}>{styles.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Garage / carport<select value={garage} onChange={e=>setGarage(e.target.value)}>{['None','Carport','1-car garage','2-car garage','3-car garage'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Kitchen / living arrangement<select value={layout} onChange={e=>setLayout(e.target.value)}>{['Open kitchen + living','Separate kitchen + living','Kitchen + dining + family room','Custom arrangement'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Roof style<select value={roof} onChange={e=>setRoof(e.target.value)}>{roofs.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Finishes / materials<select value={finish} onChange={e=>setFinish(e.target.value)}>{finishes.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="card">Budget<input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. KES 15,000,000" /></label>
      </section>

      <section>
        <p className="eyebrow">DESIGN CONFIGURATION</p>
        <div className="option">
          <strong>{summary.bedrooms} bedrooms · {summary.bathrooms} bathrooms · {summary.floors} floor(s)</strong>
          <span>{summary.plot} · {summary.style} · {summary.roof} roof · {summary.garage}</span>
          <span>{summary.layout} · {summary.finish} finishes · {summary.budget}</span>
        </div>
        <div className="option"><strong>Next:</strong><span>Generate the architectural concept, floor layout, exterior/interior visualization, material schedule and budget estimate from this configuration.</span></div>
      </section>
    </main>
  );
}
