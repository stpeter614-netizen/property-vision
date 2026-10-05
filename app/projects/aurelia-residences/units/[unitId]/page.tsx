type Props = { params: Promise<{ unitId: string }> };

export default async function UnitPage({ params }: Props) {
  const { unitId: id } = await params;
  return (
    <main className="shell">
      <nav className="nav"><a href="/projects/aurelia-residences">← Aurelia Residences</a><span>Unit {id}</span></nav>
      <section className="hero"><div>
        <p className="eyebrow">APARTMENT {id}</p>
        <h1>3 bedrooms · 2 bathrooms</h1>
        <p className="lead">142 m² · Living room · Dining · Kitchen · Laundry · Balcony · Parking</p>
        <p className="price">$295,000 starting price</p>
        <div className="option"><a className="button" href={'/projects/aurelia-residences/units/' + id + '/experience'}>Enter Home</a><a className="button" href={'/projects/aurelia-residences/units/' + id + '/customize'}>Customize</a></div>
      </div></section>
    </main>
  );
}
