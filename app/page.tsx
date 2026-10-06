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
          <div><a className="button" href="/property-actions">What do you want to do?</a> <a className="button secondary" href="/services">Explore Property Services</a> <a className="button secondary" href="/start">Start a Property Journey</a> <a className="button secondary" href="/projects/aurelia-residences">Explore Aurelia Residences</a></div>
        </div>
      </section>

      <section>
        <p className="eyebrow">WHAT DO YOU WANT TO DO WITH YOUR PROPERTY?</p>
        <h2>From a new build to a small repair, Property Vision helps you move from idea to action.</h2>
        <div className="grid">
          <a className="card" href="/property-actions#build"><span className="action-icon">🏗️</span><h3>Build</h3><p>Plan a new home, commercial property or development.</p></a>
          <a className="card" href="/property-actions#renovate"><span className="action-icon">🔨</span><h3>Renovate</h3><p>Kitchen, bathroom, toilet, extension or whole-property renovation.</p></a>
          <a className="card" href="/property-actions#improve"><span className="action-icon">🎨</span><h3>Improve</h3><p>Painting, flooring, ceiling, waterproofing, landscaping and upgrades.</p></a>
          <a className="card" href="/property-actions#estimate"><span className="action-icon">💰</span><h3>Estimate</h3><p>Explore quantities, materials, labour and approximate project costs.</p></a>
          <a className="card" href="/property-actions#professional"><span className="action-icon">👷</span><h3>Find a Professional</h3><p>Connect with the right professional or skilled service provider.</p></a>
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