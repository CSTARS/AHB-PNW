--drop schema m3pgjs cascade;
--create schema m3pgjs;
set search_path=m3pgjs,public;
--\i plv8_startup.sql
-- \i types.sql
\i  tree_and_plantation.sql
-- --\i example_locations.sql
-- -- If you've modified the js script, then use \reload_modules.sql
\i reload_modules.sql
\i model.sql

select plv8_startup();

drop table if exists growthmodel;
\set start `date`
create table growthmodel as select 
pid,d,plantation.type,grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates('2012-03-01'::date,'2024-12-01'::date) as d, 
--from pixel p,example_dates() as d, 
example_management(example_dates('2012-03-01'::date,'2024-12-01'::date)) as m,
     plantation; 
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

drop table if exists nonIrrigatedGrowthmodel;
\set start `date`
create table nonIrrigatedGrowthmodel as 
select pid,d,plantation.type,
grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates('2012-03-01'::date,'2024-12-01'::date) as d, 
example_management(example_dates('2012-03-01'::date,'2024-12-01'::date),
    '{2014-09-01,2017-09-01,2020-09-01,2023-09-01,          
      2026-09-01,2029-09-01,2032-09-01,2035-09-01}'::date[]
    ,0) as m,
plantation ;
\set stop `date`
select :'stop'::timestamp-:'start'::timestamp as elapsed;

drop table if exists harvests cascade;
create table harvests as 
with a as (
 select generate_subscripts(ps,1) as i,
 unnest(d) as d,
 (unnest(ps))."coppiceCount"
 from growthmodel
), 
i as (
select distinct min(i) over (partition by "coppiceCount") as n,
 (max(i) over (partition by "coppiceCount"))+1 as x 
 from a order by n
), 
f as (
 select pid,i.n,p.n as p,type,d[i.n] as date,
 g.ps[i.n] as irr,n.ps[i.n] as non,
 g.ps[p.n] as pirr,n.ps[p.n] as pnon,
 (i.n-p.n)/12 as yr
 from growthmodel g 
 join nonirrigatedgrowthmodel n using (pid,d,type),
 i i join i p on (i.n=p.x)
) 
select pid,type,date,
(((irr)."feedstockHarvest" - (pirr)."feedstockHarvest")/yr)::decimal(6,2) as irrigated_yield, 
(((irr)."CumIrrig" - (pirr)."CumIrrig")/yr)::decimal(6,2) as irrigation,
(((non)."feedstockHarvest" - (pnon)."feedstockHarvest")/yr)::decimal(6,2) as nonirrigated_yield
from f 
order by date,pid,type;

--update average_growth set yield=irrigated_yield,irrigated=true 
--where irrigated_yield/nonirrigated_yield > 1.3;

create view poplar_yield_by_cmz as 
select
type,
date,
regexp_replace(cmz,' ','')||state as state_cmz,
min(irrigated_yield)::decimal(6,1) min_ir,
max(irrigated_yield)::decimal(6,1) max_ir,
avg(irrigated_yield)::decimal(6,1) as avg_ir,
stddev(irrigated_yield)::decimal(6,3) as stddev_ir,
(sum(acres_harvested*irrigated_yield)/
 sum(acres_harvested))::decimal(6,1) as weighted_avg_ir,
min(irrigation)::decimal(6,1) min_water,
max(irrigation)::decimal(6,1) max_water,
avg(irrigation)::decimal(6,1) as avg_water,
stddev(irrigation)::decimal(6,3) as stddev_water,
(sum(acres_harvested*irrigation)/
 sum(acres_harvested))::decimal(6,1) as weighted_avg_water,
min(nonirrigated_yield)::decimal(6,1) min_non,
max(nonirrigated_yield)::decimal(6,1) max_non,
avg(nonirrigated_yield)::decimal(6,1) as avg_non,
stddev(nonirrigated_yield)::decimal(6,3) as stddev_non,
(sum(acres_harvested*nonirrigated_yield)/
 sum(acres_harvested))::decimal(6,1) as weighted_avg_non
from to_bcam.pixel_nass_production 
join m3pgjs.harvests using (pid)
group by type,date,state,cmz
order by type,date,state,cmz;

create view poplar_yield_by_cmz_commodity as 
select 
type,
date,
regexp_replace(cmz,' ','')||state as state_cmz,commodity,
min(irrigated_yield)::decimal(6,1) min_ir,
max(irrigated_yield)::decimal(6,1) max_ir,
avg(irrigated_yield)::decimal(6,1) as avg_ir,
stddev(irrigated_yield)::decimal(6,3) as stddev_ir,
(sum(acres_harvested*irrigated_yield)/
 sum(acres_harvested))::decimal(6,1) as weighted_avg_ir,
min(irrigation)::decimal(6,1) min_water,
max(irrigation)::decimal(6,1) max_water,
avg(irrigation)::decimal(6,1) as avg_water,
stddev(irrigation)::decimal(6,3) as stddev_water,
(sum(acres_harvested*irrigation)/
 sum(acres_harvested))::decimal(6,1) as weighted_avg_water,
min(nonirrigated_yield)::decimal(6,1) min_non,
max(nonirrigated_yield)::decimal(6,1) max_non,
avg(nonirrigated_yield)::decimal(6,1) as avg_non,
stddev(nonirrigated_yield)::decimal(6,3) as stddev_non,
(sum(acres_harvested*nonirrigated_yield)/
 sum(acres_harvested))::decimal(6,1) as weighted_avg_non
from to_bcam.pixel_nass_production 
join m3pgjs.harvests using (pid)
group by type,date,state,cmz,commodity
order by type,date,state,cmz,commodity;
