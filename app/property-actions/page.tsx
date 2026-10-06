const actions = [
  {
    id: 'build',
    icon: '🏗️',
    title: 'Build',
    text: 'Start a new house, commercial property or development project.',
    items: ['New house', 'Commercial building', 'Development project'],
  },
  {
    id: 'renovate',
    icon: '🔨',
    title: 'Renovate',
    text: 'Improve an existing property, whether the project is large or small.',
    items: ['Kitchen', 'Bathroom', 'Toilet', 'Extension', 'Whole-property renovation'],
  },
  {
    id: 'improve',
    icon: '🎨',
    title: 'Improve',
    text: 'Upgrade the appearance, performance and comfort of your property.',
    items: ['Painting', 'Flooring', 'Ceiling', 'Waterproofing', 'Landscaping', 'Other upgrades'],
  },
  {
    id: 'estimate',
    icon: '💰',
    title: 'Estimate',
    text: 'Get an early view of materials, quantities, labour and project cost.',
    items: ['Paint quantity', 'Flooring', 'Roofing', 'Concrete', 'Blocks', 'Tiles', 'Ceiling', 'Waterproofing'],
  },
  {
    id: 'professional',
    icon: '👷',
    title: 'Find a Professional',
    text: 'Find the right person or team for your property project.',
    items: ['Architects', 'Quantity surveyors', 'Engineers', 'Contractors', 'Fundis', 'Interior designers', 'Landscapers', 'Suppliers'],
  },
];

export default function PropertyActions() {
  return (
    <main className="shell">
      <nav className="nav">
        <a href="/"><strong>Property Vision</strong></a>
        <div><a href="/services">Services</a><a href="/design/house">Design a House</a><a href="/developer">For Developers</a></div>
      </nav>

      <section className="hero">
        <p className="eyebrow">PROPERTY VISION</p>
        <h1>What do you want to do with your property?</h1>
        <p className="lead">You do not have to be building a complete house. Start with the exact project you need — from a toilet renovation to a full development.</p>
      </section>

      <section className="action-hub">
        {actions.map(action => (
          <article className="action-panel" id={action.id} key={action.id}>
            <div className="action-heading">
              <span className="action-icon">{action.icon}</span>
              <div><h2>{action.title}</h2><p>{action.text}</p></div>
            </div>
            <div className="tag-list">
              {action.items.map(item => <span className="tag" key={item}>{item}</span>)}
            </div>
            <a className="button" href={'/start?type=' + action.id}>Start this project</a>
          </article>
        ))}
      </section>

      <section className="notice">
        <h2>Not sure where to start?</h2>
        <p>Tell Property Vision what you want to build, renovate, fix or improve. We can structure the project from there.</p>
        <a className="button" href="/start">Tell us what you need</a>
      </section>
    </main>
  );
}