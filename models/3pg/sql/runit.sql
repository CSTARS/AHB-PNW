--drop schema m3pgjs cascade;
--create schema m3pgjs;
set search_path=m3pgjs,public;
--\i plv8_startup.sql
--\i types.sql
--\i tree_and_plantation.sql
--\i example_locations.sql
-- If you've modified the js script, then use \reload_modules.sql
\i reload_modules.sql
\i model.sql

select plv8_startup();

-- This is a quick test over three months.
--with f as (
-- select pid,tree.type,
--  grow(plantation,tree,p.soil,example_weather(p.mean_weather,'2012-03-01'::date,'2012-05-01'::date),m) as ps
-- from tree,pixel p,example_management('2012-03-01'::date,'2012-05-01'::date) as m,
-- plantation where plantation.type='greenwood'
--) 
--select ps[3]."RootP" from f;

drop table if exists growthmodel;
\set start `date`
create table growthmodel as select 
pid,d,grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates() as d, example_management(example_dates()) as m,
     plantation 
where plantation.type='greenwood';
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

drop table if exists nonIrrigatedGrowthmodel;
\set start `date`
create table nonIrrigatedGrowthmodel as 
select pid,d,
grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates() as d, 
example_management(example_dates(),
    '{2014-09-01,2017-09-01,2020-09-01,2023-09-01,          
      2026-09-01,2029-09-01,2032-09-01,2035-09-01}'::date[]
    ,0) as m,
plantation 
where plantation.type='greenwood';
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

drop table if exists average_growth;
create table average_growth as with u as (                     
 select pid,(d[array_length(d,1)]-d[1])/365.25 as years,
        ps[array_length(ps,1)] as p
 from growthmodel
) select pid,(p)."feedstockHarvest"/years as "yield",
(p)."CumIrrig"/years as "irrigation" 
from u;
