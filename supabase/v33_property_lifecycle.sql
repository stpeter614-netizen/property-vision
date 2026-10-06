-- Property Vision V33
-- Property lifecycle and service catalog foundation.
-- Extends the platform beyond off-plan developments without removing
-- projects, units, configurations, enquiries or existing developer workflows.

create table if not exists property_service_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists property_services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references property_service_categories(id) on delete cascade,
  code text unique not null,
  name text not null,
  description text,
  lifecycle_stage text not null check (lifecycle_stage in (
    'design','planning','construction','sale','rent','configure',
    'renovation','repair','maintenance','upgrade','resale','professional','digital'
  )),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_services_category_idx
  on property_services(category_id, sort_order);
create index if not exists property_services_stage_idx
  on property_services(lifecycle_stage, sort_order);

alter table property_service_categories enable row level security;
alter table property_services enable row level security;

drop policy if exists property_service_categories_public_read on property_service_categories;
create policy property_service_categories_public_read
on property_service_categories for select
to anon, authenticated
using (active = true);

drop policy if exists property_services_public_read on property_services;
create policy property_services_public_read
on property_services for select
to anon, authenticated
using (active = true);

insert into property_service_categories (code,name,description,sort_order) values
('design','Property Design','Design and visualize property before work begins.',10),
('construction','Construction','Build and construction delivery services.',20),
('materials-finishes','Materials & Finishes','Finishes, materials, fixtures and installation.',30),
('renovation','Renovation & Remodeling','Transform, extend or remodel existing property.',40),
('repairs-maintenance','Repairs & Maintenance','Keep property working, safe and maintained.',50),
('buy-sell-rent','Buy, Sell & Rent','Property discovery, marketing, comparison and transactions.',60),
('professional','Professional Property Services','Specialist technical and project services.',70),
('interior-lifestyle','Interior & Lifestyle','Furniture, interiors, landscaping and property lifestyle services.',80),
('digital','Property Vision Digital','Interactive property and digital lifecycle services.',90)
on conflict (code) do nothing;

insert into property_services (category_id,code,name,description,lifecycle_stage,sort_order)
select c.id, v.code, v.name, v.description, v.stage, v.sort_order
from property_service_categories c
join (values
('design','house-design','House design','Configure plot, rooms, floors, style, roof, finishes and budget.','design',10),
('design','architectural-concept','Architectural concept development','Turn a brief into a structured architectural concept.','design',20),
('design','floor-plan-design','Floor-plan design','Create and refine functional floor layouts.','design',30),
('design','space-planning','Space planning','Plan room sizes, circulation and use of space.','design',40),
('design','interior-design','Interior design','Plan interiors, finishes, furniture and lighting.','design',50),
('design','exterior-design','Exterior design','Plan elevations, materials and external appearance.','design',60),
('design','3d-visualization','3D visualization','Experience the proposed property before construction.','digital',70),
('construction','new-construction','New construction','Coordinate delivery of new residential or commercial property.','construction',10),
('construction','structural-works','Structural works','Foundations, columns, beams, slabs, walls and structural elements.','construction',20),
('construction','roofing','Roofing','Roof structure, covering, repair and installation.','construction',30),
('construction','plumbing','Plumbing','Water supply, drainage and plumbing installation.','construction',40),
('construction','electrical','Electrical installation','Electrical systems, wiring, distribution and fittings.','construction',50),
('construction','hvac','HVAC','Heating, ventilation and air-conditioning systems.','construction',60),
('construction','doors-windows','Doors & windows','Supply and installation of doors and windows.','construction',70),
('construction','landscaping','Landscaping','External landscape and site works.','construction',80),
('materials-finishes','painting','Painting','Interior and exterior painting and decorative finishes.','construction',10),
('materials-finishes','waterproofing','Waterproofing','Waterproofing systems for roofs, wet areas and structures.','construction',20),
('materials-finishes','tiling','Tiling','Wall and floor tile supply and installation.','construction',30),
('materials-finishes','flooring','Flooring','Timber, stone, tile, vinyl and other floor finishes.','construction',40),
('materials-finishes','ceilings','Ceiling installation','Ceilings, bulkheads and related finishes.','construction',50),
('materials-finishes','kitchens','Kitchen installation','Cabinetry, worktops, appliances and kitchen fittings.','construction',60),
('materials-finishes','bathrooms','Bathroom fitting','Sanitaryware, fittings, finishes and bathroom installation.','construction',70),
('materials-finishes','joinery','Cabinetry & joinery','Wardrobes, cabinets and custom built-in joinery.','construction',80),
('renovation','whole-property-renovation','Whole-property renovation','Plan and deliver comprehensive property renovation.','renovation',10),
('renovation','kitchen-renovation','Kitchen renovation','Upgrade or redesign an existing kitchen.','renovation',20),
('renovation','bathroom-renovation','Bathroom renovation','Upgrade or redesign an existing bathroom.','renovation',30),
('renovation','extensions','Extensions','Add usable space to an existing property.','renovation',40),
('renovation','conversions','Conversions','Convert existing spaces for new uses.','renovation',50),
('renovation','exterior-upgrade','Exterior upgrade','Refresh and upgrade the outside of a property.','upgrade',60),
('repairs-maintenance','plumbing-repair','Plumbing repairs','Diagnose and repair plumbing faults.','repair',10),
('repairs-maintenance','electrical-repair','Electrical repairs','Diagnose and repair electrical faults by qualified professionals.','repair',20),
('repairs-maintenance','roof-repair','Roof repairs','Repair leaks, damage and roof components.','repair',30),
('repairs-maintenance','leak-repair','Leak & water-damage repair','Identify and address leaks and water damage.','repair',40),
('repairs-maintenance','general-maintenance','General maintenance','Routine property maintenance and minor works.','maintenance',50),
('repairs-maintenance','property-inspection','Property inspection','Inspect property condition and identify required work.','maintenance',60),
('buy-sell-rent','property-for-sale','Property for sale','Discover and market properties for sale.','sale',10),
('buy-sell-rent','property-for-rent','Property for rent','Discover and market properties for rent.','rent',20),
('buy-sell-rent','property-valuation','Property valuation','Support property valuation workflows.','sale',30),
('buy-sell-rent','property-marketing','Property marketing','Create interactive digital property marketing experiences.','sale',40),
('buy-sell-rent','property-comparison','Property comparison','Compare properties, units and configurations.','sale',50),
('professional','quantity-surveying','Quantity surveying','Cost planning, measurement and quantity services.','professional',10),
('professional','cost-estimation','Cost estimation','Estimate project and property costs.','planning',20),
('professional','project-management','Project management','Coordinate property projects, work packages and milestones.','professional',30),
('professional','site-supervision','Site supervision','Support construction quality and progress oversight.','professional',40),
('professional','architectural-services','Architectural services','Professional architectural services and documentation.','professional',50),
('professional','structural-engineering','Structural engineering','Professional structural engineering services and review.','professional',60),
('professional','mep-services','MEP services','Mechanical, electrical and plumbing professional services.','professional',70),
('interior-lifestyle','furniture','Furniture','Furniture sourcing and configuration.','upgrade',10),
('interior-lifestyle','curtains-blinds','Curtains & blinds','Window treatments and shading solutions.','upgrade',20),
('interior-lifestyle','smart-home','Smart-home systems','Connected lighting, security and home automation.','upgrade',30),
('interior-lifestyle','home-staging','Home staging','Prepare property for marketing or sale.','sale',40),
('digital','off-plan-experience','Off-plan experience','Interactive digital experience for property that has not yet been built.','digital',10),
('digital','property-configurator','Property configurator','Configure rooms, materials, finishes and upgrades with pricing.','configure',20),
('digital','digital-property-record','Digital property record','Maintain structured property information across its lifecycle.','digital',30),
('digital','buyer-configuration','Buyer configuration','Create a unique saved property configuration for a buyer.','configure',40),
('digital','developer-sales-portal','Developer sales portal','Manage inventory, leads, configurations and sales activity.','sale',50),
('digital','construction-visualization','Construction-stage visualization','Connect project progress with the digital property experience.','construction',60),
('digital','handover-record','Digital handover record','Carry structured property information into ownership and handover.','maintenance',70)
) as v(code,name,description,stage,sort_order) on v.code is not null
where c.code = split_part(v.code, '-', 1) and false;

-- Explicit category mapping keeps service codes stable even when category names change.
insert into property_services (category_id,code,name,description,lifecycle_stage,sort_order)
select c.id, v.code, v.name, v.description, v.stage, v.sort_order
from (values
('design','house-design','House design','Configure plot, rooms, floors, style, roof, finishes and budget.','design',10),
('design','architectural-concept','Architectural concept development','Turn a brief into a structured architectural concept.','design',20),
('design','floor-plan-design','Floor-plan design','Create and refine functional floor layouts.','design',30),
('design','space-planning','Space planning','Plan room sizes, circulation and use of space.','design',40),
('design','interior-design','Interior design','Plan interiors, finishes, furniture and lighting.','design',50),
('design','exterior-design','Exterior design','Plan elevations, materials and external appearance.','design',60),
('design','3d-visualization','3D visualization','Experience the proposed property before construction.','digital',70),
('construction','new-construction','New construction','Coordinate delivery of new residential or commercial property.','construction',10),
('construction','structural-works','Structural works','Foundations, columns, beams, slabs, walls and structural elements.','construction',20),
('construction','roofing','Roofing','Roof structure, covering, repair and installation.','construction',30),
('construction','plumbing','Plumbing','Water supply, drainage and plumbing installation.','construction',40),
('construction','electrical','Electrical installation','Electrical systems, wiring, distribution and fittings.','construction',50),
('construction','hvac','HVAC','Heating, ventilation and air-conditioning systems.','construction',60),
('construction','doors-windows','Doors & windows','Supply and installation of doors and windows.','construction',70),
('construction','landscaping','Landscaping','External landscape and site works.','construction',80),
('materials-finishes','painting','Painting','Interior and exterior painting and decorative finishes.','construction',10),
('materials-finishes','waterproofing','Waterproofing','Waterproofing systems for roofs, wet areas and structures.','construction',20),
('materials-finishes','tiling','Tiling','Wall and floor tile supply and installation.','construction',30),
('materials-finishes','flooring','Flooring','Timber, stone, tile, vinyl and other floor finishes.','construction',40),
('materials-finishes','ceilings','Ceiling installation','Ceilings, bulkheads and related finishes.','construction',50),
('materials-finishes','kitchens','Kitchen installation','Cabinetry, worktops, appliances and kitchen fittings.','construction',60),
('materials-finishes','bathrooms','Bathroom fitting','Sanitaryware, fittings, finishes and bathroom installation.','construction',70),
('materials-finishes','joinery','Cabinetry & joinery','Wardrobes, cabinets and custom built-in joinery.','construction',80),
('renovation','whole-property-renovation','Whole-property renovation','Plan and deliver comprehensive property renovation.','renovation',10),
('renovation','kitchen-renovation','Kitchen renovation','Upgrade or redesign an existing kitchen.','renovation',20),
('renovation','bathroom-renovation','Bathroom renovation','Upgrade or redesign an existing bathroom.','renovation',30),
('renovation','extensions','Extensions','Add usable space to an existing property.','renovation',40),
('renovation','conversions','Conversions','Convert existing spaces for new uses.','renovation',50),
('renovation','exterior-upgrade','Exterior upgrade','Refresh and upgrade the outside of a property.','upgrade',60),
('repairs-maintenance','plumbing-repair','Plumbing repairs','Diagnose and repair plumbing faults.','repair',10),
('repairs-maintenance','electrical-repair','Electrical repairs','Diagnose and repair electrical faults by qualified professionals.','repair',20),
('repairs-maintenance','roof-repair','Roof repairs','Repair leaks, damage and roof components.','repair',30),
('repairs-maintenance','leak-repair','Leak & water-damage repair','Identify and address leaks and water damage.','repair',40),
('repairs-maintenance','general-maintenance','General maintenance','Routine property maintenance and minor works.','maintenance',50),
('repairs-maintenance','property-inspection','Property inspection','Inspect property condition and identify required work.','maintenance',60),
('buy-sell-rent','property-for-sale','Property for sale','Discover and market properties for sale.','sale',10),
('buy-sell-rent','property-for-rent','Property for rent','Discover and market properties for rent.','rent',20),
('buy-sell-rent','property-valuation','Property valuation','Support property valuation workflows.','sale',30),
('buy-sell-rent','property-marketing','Property marketing','Create interactive digital property marketing experiences.','sale',40),
('buy-sell-rent','property-comparison','Property comparison','Compare properties, units and configurations.','sale',50),
('professional','quantity-surveying','Quantity surveying','Cost planning, measurement and quantity services.','professional',10),
('professional','cost-estimation','Cost estimation','Estimate project and property costs.','planning',20),
('professional','project-management','Project management','Coordinate property projects, work packages and milestones.','professional',30),
('professional','site-supervision','Site supervision','Support construction quality and progress oversight.','professional',40),
('professional','architectural-services','Architectural services','Professional architectural services and documentation.','professional',50),
('professional','structural-engineering','Structural engineering','Professional structural engineering services and review.','professional',60),
('professional','mep-services','MEP services','Mechanical, electrical and plumbing professional services.','professional',70),
('interior-lifestyle','furniture','Furniture','Furniture sourcing and configuration.','upgrade',10),
('interior-lifestyle','curtains-blinds','Curtains & blinds','Window treatments and shading solutions.','upgrade',20),
('interior-lifestyle','smart-home','Smart-home systems','Connected lighting, security and home automation.','upgrade',30),
('interior-lifestyle','home-staging','Home staging','Prepare property for marketing or sale.','sale',40),
('digital','off-plan-experience','Off-plan experience','Interactive digital experience for property that has not yet been built.','digital',10),
('digital','property-configurator','Property configurator','Configure rooms, materials, finishes and upgrades with pricing.','configure',20),
('digital','digital-property-record','Digital property record','Maintain structured property information across its lifecycle.','digital',30),
('digital','buyer-configuration','Buyer configuration','Create a unique saved property configuration for a buyer.','configure',40),
('digital','developer-sales-portal','Developer sales portal','Manage inventory, leads, configurations and sales activity.','sale',50),
('digital','construction-visualization','Construction-stage visualization','Connect project progress with the digital property experience.','construction',60),
('digital','handover-record','Digital handover record','Carry structured property information into ownership and handover.','maintenance',70)
) as v(category_code,code,name,description,stage,sort_order)
join property_service_categories c on c.code=v.category_code
on conflict (code) do nothing;
