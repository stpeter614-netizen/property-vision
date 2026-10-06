const units = ['301', '302', '303', '304', '305', '306'];

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav">
        <strong>Property Vision</strong>
        <div><a href="/services">Services</a><a href="/design/house">Design a House</a><a href="/developer">For Developers</a></div>
      </nav>
      <section className="hero">
        <div>
          <p className="eyebrow">PROPERTY EXPERIENCE INFRASTRUCTURE</p>
          <h1>Experience Property Before It Exists.</h1>
          <p className="lead">Design, plan, build, buy, sell, rent, configure, renovate, repair, maintain and upgrade property through one connected platform.</p>
          <div><a className="button" href="/services">Explore Property Services</a> <a className="button" href="/projects/aurelia-residences">Explore Aurelia Residences</a></div>
        </div>
      </section>
      <section>
        <p className="eyebrow">THE PROPERTY LIFECYCLE</p>
        <h2>One property record from concept to ownership.</h2>
        <div className="option"><strong>Design</strong><span>→</span><strong>Plan</strong><span>→</span><strong>Build</strong><span>→</span><strong>Sell / Rent</strong><span>→</span><strong>Buy</strong><span>→</span><strong>Configure</strong><span>→</span><strong>Renovate</strong><span>→</span><strong>Repair</strong><span>→</span><strong>Maintain</strong><span>→</span><strong>Upgrade</strong><span>→</span><strong>Resell</strong></div>
      </section>
      <section>
        <p className="eyebrow">DEMO DEVELOPMENT</p><h2>Aurelia Residences</h2>
        <div className="grid">{units.map(unit => <a className="card" href={'/projects/aurelia-residences/units/' + unit} key={unit}><p className="eyebrow">UNIT {unit}</p><h3>3-bedroom residence</h3><p>142 m² · 2 bathrooms</p><strong>$295,000</strong></a>)}</div>
      </section>
    </main>
  );
}