'use client';

import { useState } from 'react';

const journeys = [
  { id:'design', title:'I want to design a property', steps:['Tell us about the plot','Choose rooms, floors and style','Configure materials and finishes','Generate the design brief','Review with professionals'] },
  { id:'build', title:'I want to build', steps:['Define the property','Create scope and specifications','Estimate materials and cost','Plan project stages','Track construction'] },
  { id:'buy', title:'I want to buy', steps:['Discover property','Explore the building or home','Compare options','Configure upgrades','Enquire or reserve'] },
  { id:'rent', title:'I want to rent', steps:['Find a property','Explore it digitally','Compare properties','Enquire','Proceed with the rental process'] },
  { id:'renovate', title:'I want to renovate', steps:['Describe the existing property','Select areas to change','Define materials and finishes','Build the renovation scope','Request professional delivery'] },
  { id:'repair', title:'I need a repair', steps:['Describe the problem','Select the property area','Add photos or information','Request a service','Track the work'] },
  { id:'maintain', title:'I need property maintenance', steps:['Create the property record','Record maintenance needs','Schedule work','Keep service history','Plan preventive maintenance'] },
  { id:'upgrade', title:'I want to upgrade my property', steps:['Select the area','Explore upgrade options','Compare materials/products','See the cost impact','Save the upgrade plan'] },
  { id:'improve', title:'I want to improve my property', steps:['Choose the area','Select the improvement','Describe the desired result','Estimate scope and materials','Request delivery'] },
  { id:'estimate', title:'I want a project estimate', steps:['Choose project type','Enter measurements','Select materials and finish level','Calculate an early cost range','Request a professional estimate'] },
  { id:'professional', title:'I need a professional', steps:['Describe the project','Choose the professional type','Set location and requirements','Review suitable providers','Request a consultation or quote'] },
];

export default function StartPage() {
  const [selected, setSelected] = useState(journeys[0]);
  return (
    <main className="shell">
      <nav className="nav"><a href="/">PROPERTY VISION</a><span>Start a property journey</span></nav>
      <section className="hero">
        <div>
          <p className="eyebrow">PROPERTY LIFECYCLE</p>
          <h1>What do you want to do with your property?</h1>
          <p className="lead">Start with the outcome. Property Vision guides the property, configuration, service and project information through the journey.</p>
        </div>
      </section>
      <section className="grid">
        {journeys.map(j => (
          <button className="card" key={j.id} onClick={() => setSelected(j)}>
            <h2>{j.title}</h2>
            <p>{j.steps.length} stages</p>
            <span>Start journey →</span>
          </button>
        ))}
      </section>
      <section>
        <p className="eyebrow">SELECTED JOURNEY</p>
        <div className="option"><h2>{selected.title}</h2></div>
        <div className="grid">{selected.steps.map((step,index) => <div className="card" key={step}><p className="eyebrow">STEP {index+1}</p><h3>{step}</h3></div>)}</div>
      </section>
    </main>
  );
}
