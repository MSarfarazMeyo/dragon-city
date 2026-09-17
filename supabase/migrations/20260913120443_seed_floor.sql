-- v1 scope is a single mall, single floor. Seed it once so zones/units
-- have somewhere to attach — the "Add Project/Floor" admin screen is a
-- later phase, not needed to start using the map.
insert into public.floors (label)
select 'Dragon City'
where not exists (select 1 from public.floors);
