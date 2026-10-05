'use client';

import { useEffect } from 'react';
import { trackPropertyEvent } from '@/lib/analytics';

export default function ProjectPage(){
  const units=['301','302','303','304','305','306'];
  useEffect(()=>{void trackPropertyEvent('project_viewed',{projectId:'aurelia-residences'})},[]);
  return <main className="shell"><nav className="nav"><a href="/">PROPERTY VISION</a><span>Explore development</span></nav><section className="hero"><div><p className="eyebrow">DEVELOPMENT</p><h1>Aurelia Residences</h1><p className="lead">Explore floors and available apartments, then enter a unit to configure it.</p></div></section><section><h2>Available apartments</h2><div className="grid">{units.map(id=><a className="unit" key={id} href={'/projects/aurelia-residences/units/'+id}><strong>Unit {id}</strong><span>3 bedrooms · 2 bathrooms</span><span>142 m² · From $295,000</span></a>)}</div></section></main>
}