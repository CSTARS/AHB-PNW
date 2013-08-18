--drop schema m3pgjs cascade;
--create schema m3pgjs;
set search_path=m3pgjs,public;
--\i plv8_startup.sql
--\i types.sql
--\i tree.sql
--\i example_locations.sql
-- If you've modified the js script, then use \reload_modules.sql
--\i reload_modules.sql
--\i model.sql

select plv8_startup();

-- This is a quick test over three months.
--with f as (
-- select pid,tree.type,
--  grow(plantation,tree,p.soil,example_weather(p.mean_weather,'2012-03-01'::date,'2012-05-01'::date),m) as ps
-- from tree,pixel p,example_management('2012-03-01'::date,'2012-05-01'::date) as m,
-- plantation where plantation.type='greenwood'
--) 
--select ps[3]."RootP" from f;

\set start `date`
create table growthmodel as select 
pid,tree.type,d,grow(plantation,tree,p.soil,example_weather(d,p.mean_weather),m) as ps 
from tree,pixel p,example_dates() as d, example_management(example_dates()) as m,
     plantation 
where tree.type='poplar' and plantation.type='greenwood';
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

 
with u as (
 select pid,(d[array_length(d,1)]-d[1])/365.4 as years,
        ps[array_length(ps,1)].* 
 from growit
) select pid,"feedstockHarvest"/years from u; 
