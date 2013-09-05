--drop schema m3pgjs cascade;
--create schema m3pgjs;
set search_path=m3pgjs,public;
\i plv8_startup.sql
\i types.sql
\i tree_and_plantation.sql
--\i example_locations.sql
-- If you've modified the js script, then use \reload_modules.sql
\i reload_modules.sql
\i model.sql

select plv8_startup();

drop table if exists growthmodel;
\set start `date`
create table growthmodel as select 
pid,d,grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates('2012-03-01'::date,'2024-12-01'::date) as d, 
--from pixel p,example_dates() as d, 
example_management(example_dates('2012-03-01'::date,'2024-12-01'::date)) as m,
     plantation 
where plantation.type='greenwood';
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

drop table if exists nonIrrigatedGrowthmodel;
\set start `date`
create table nonIrrigatedGrowthmodel as 
select pid,d,
grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates('2012-03-01'::date,'2024-12-01'::date) as d, 
example_management(example_dates('2012-03-01'::date,'2024-12-01'::date),
    '{2014-09-01,2017-09-01,2020-09-01,2023-09-01,          
      2026-09-01,2029-09-01,2032-09-01,2035-09-01}'::date[]
    ,0) as m,
plantation 
--where pid=287635 and plantation.type='greenwood';
where plantation.type='greenwood';
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

drop table if exists average_growth cascade;
create table average_growth as with irr as (                     
 select pid,(d[array_length(d,1)]-d[1])/365.25 as years,
        ps[array_length(ps,1)] as i
 from growthmodel
),
non as (                     
 select pid,(d[array_length(d,1)]-d[1])/365.25 as years,
        ps[array_length(ps,1)] as n
 from nonirrigatedgrowthmodel
)
select pid,
((i)."feedstockHarvest"/irr.years)::decimal(6,2) as "irrigated_yield",
((i)."CumIrrig"/irr.years)::decimal(6,2) as "irrigation",
((n)."feedstockHarvest"/non.years)::decimal(6,2) as "nonirrigated_yield",
false as irrigated,
((n)."feedstockHarvest"/non.years)::decimal(6,2) as yield
from irr join non using (pid);

update average_growth set yield=irrigated_yield,irrigated=true 
where irrigated_yield/nonirrigated_yield > 1.3;