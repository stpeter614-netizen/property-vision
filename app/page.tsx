const units = ['301','302','303','304','305','306'];

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav">
        <strong>Property Vision</strong>
        <a href="/developer">For Developers</a>
      </nav>
      <section className="hero">
        <div>
          <p className="eyebrow">PROPERTY EXPERIENCE INFRASTRUCTURE</p>
          <h1>Experience Property Before It Exists.</h1>
          <p className="lead">Explore developments, enter apartments, configure finishes, see the price change instantly, save your configuration and enquire.</p>
          <a className="button" href="/projects/aurelia-residences">Explore Aurelia Residences</a>
        </div>
      </section>
      <section>
        <p className="eyebrow">HOW IT WORKS</p>
        <h2>From development to exact configuration.</h2>
        <div className="option">
          <strong>Explore</strong><span> → </span><strong>Choose a unit</strong><span> → </span><strong>Customize</strong><span> → </span><strong>Price</strong><span> → </span><strong>Enquire</strong>
        </div>
        <div className="grid">
          {units.map((unit) => (
            <a className="card" href={'/projects/aurelia-residences/units/' + unit} key={unit}>
              <p className="eyebrow">UNIT {unit}</p>
              <h3>3-bedroom residence</h3>
              <p>142 m² · 2 bathrooms</p>
              <strong>$295,000</strong>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}