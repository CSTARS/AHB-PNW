-- drop schema m3pgjs cascade;
-- create schema m3pgjs;
-- set search_path=m3pgjs,public;
-- \i plv8_startup.sql
-- \i types.sql
-- \i  tree_and_plantation.sql
-- -- --\i example_locations.sql
-- -- -- If you've modified the js script, then use \reload_modules.sql
-- \i reload_modules.sql
-- \i model.sql

-- select plv8_startup();

drop table if exists growthmodel;
\set start `date`
create table growthmodel as select 
pid,d,plantation.type,grow(plantation,p.soil,example_weather(d,p.mean_weather),m) as ps 
from pixel p,example_dates('2012-03-01'::date,'2024-12-01'::date) as d, 
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


create table harvest_avg as 
with a as (
 select pid,date,
 min(irrigated_yield)::decimal(6,2) as min_irrigated_yield,
 max(irrigated_yield)::decimal(6,2) as max_irrigated_yield,
 avg(irrigated_yield)::decimal(6,2) as avg_irrigated_yield,
 stddev_samp(irrigated_yield)::decimal(6,2) as stddev_irrigated_yield,
 min(nonirrigated_yield)::decimal(6,2) as min_nonirrigated_yield,
 max(nonirrigated_yield)::decimal(6,2) as max_nonirrigated_yield,
 avg(nonirrigated_yield)::decimal(6,2) as avg_nonirrigated_yield,
 stddev_samp(nonirrigated_yield)::decimal(6,2) as stddev_nonirrigated_yield,
 avg(irrigation)::decimal(6,2) as avg_irrigation,
 stddev_samp(irrigation)::decimal(6,2) as stddev_irrigation 
 from harvests
 where type in (
 'gr-fischer2013',
 'srwc-pont-beaupre-best',
 'srwc-pont-fritzi-best',
 'srwc-pont-hart12coppice',
 'srwc-pont-raspalje',
 'srwc-pont-raspalje-best',
 'srwc-pont-robusta-best'
) 
 group by pid,date
),
t as (
 select a.pid,
 string_agg(h1.type,',') as max_irrigated_type,
 string_agg(h2.type,',') as max_nonirrigated_type 
from a 
join harvests h1 on (a.pid=h1.pid and a.max_irrigated_yield=h1.irrigated_yield)
join harvests h2 on (a.pid=h2.pid 
 and h2.nonirrigated_yield=a.max_nonirrigated_yield) 
group by a.pid
)
select * from a join t using (pid);

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

-- create view poplar_avg_yield_by_cmz as 
-- select date, 'average'::text as estimate,
-- regexp_replace(cmz,' ','')||state as state_cmz,
-- (sum(acres_harvested*avg_irrigated_yield)/
--  sum(acres_harvested))::decimal(6,1) as irrigated_yield,
-- (sum(acres_harvested*avg_irrigation)/
--  sum(acres_harvested))::decimal(6,1) as irrigation,
-- (sum(acres_harvested*avg_nonirrigated_yield)/
--  sum(acres_harvested))::decimal(6,1) as nonirrigated_yield
-- from to_bcam.pixel_nass_production 
-- join harvest_avg using (pid)
-- group by date,state,cmz
-- union
-- select date, '+stddev'::text as estimate,
-- regexp_replace(cmz,' ','')||state as state_cmz,
-- (sum(acres_harvested*(avg_irrigated_yield+stddev_irrigated_yield))/
--  sum(acres_harvested))::decimal(6,1) as irrigated_yield,
-- (sum(acres_harvested*(avg_irrigation+stddev_irrigation))/
--  sum(acres_harvested))::decimal(6,1) as irrigation,
-- (sum(acres_harvested*(avg_nonirrigated_yield+stddev_nonirrigated_yield))/
--  sum(acres_harvested))::decimal(6,1) as nonirrigated_yield
-- from to_bcam.pixel_nass_production 
-- join harvest_avg using (pid)
-- group by date,state,cmz
-- union
-- select date, '-stddev'::text as estimate,
-- regexp_replace(cmz,' ','')||state as state_cmz,
-- (sum(acres_harvested*(avg_irrigated_yield-stddev_irrigated_yield))/
--  sum(acres_harvested))::decimal(6,1) as irrigated_yield,
-- (sum(acres_harvested*(avg_irrigation-stddev_irrigation))/
--  sum(acres_harvested))::decimal(6,1) as irrigation,
-- (sum(acres_harvested*(avg_nonirrigated_yield-stddev_nonirrigated_yield))/
--  sum(acres_harvested))::decimal(6,1) as nonirrigated_yield
-- from to_bcam.pixel_nass_production 
-- join harvest_avg using (pid)
-- group by date,state,cmz 
-- order by date,state_cmz;

create view poplar_avg_yield_by_economy as 
select date, 'average'::text as estimate,
economy,
(sum(acres_harvested*avg_irrigated_yield)/
 sum(acres_harvested))::decimal(6,1) as irrigated_yield,
(sum(acres_harvested*avg_irrigation)/
 sum(acres_harvested))::decimal(6,1) as irrigation,
(sum(acres_harvested*avg_nonirrigated_yield)/
 sum(acres_harvested))::decimal(6,1) as nonirrigated_yield
from to_bcam.pixel_nass_production 
join harvest_avg using (pid)
join from_bcam.pixel_fractions using (pid)
group by date,economy
union
select date, '+stddev'::text as estimate,
economy,
(sum(acres_harvested*(avg_irrigated_yield+stddev_irrigated_yield))/
 sum(acres_harvested))::decimal(6,1) as irrigated_yield,
(sum(acres_harvested*(avg_irrigation+stddev_irrigation))/
 sum(acres_harvested))::decimal(6,1) as irrigation,
(sum(acres_harvested*(avg_nonirrigated_yield+stddev_nonirrigated_yield))/
 sum(acres_harvested))::decimal(6,1) as nonirrigated_yield
from to_bcam.pixel_nass_production 
join harvest_avg using (pid)
join from_bcam.pixel_fractions using (pid)
group by date,economy
union
select date, '-stddev'::text as estimate,
economy,
(sum(acres_harvested*(avg_irrigated_yield-stddev_irrigated_yield))/
 sum(acres_harvested))::decimal(6,1) as irrigated_yield,
(sum(acres_harvested*(avg_irrigation-stddev_irrigation))/
 sum(acres_harvested))::decimal(6,1) as irrigation,
(sum(acres_harvested*(avg_nonirrigated_yield-stddev_nonirrigated_yield))/
 sum(acres_harvested))::decimal(6,1) as nonirrigated_yield
from to_bcam.pixel_nass_production 
join harvest_avg using (pid)
join from_bcam.pixel_fractions using (pid)
group by date,economy; 

create view bcam_models as 
with f as (
select economy,estimate,
irrigated_yield::decimal(6,2),
irrigation::decimal(6,2),
nonirrigated_yield::decimal(6,2)
from poplar_avg_yield_by_economy
where date = (select min(date) from harvest_avg)
),
v as (
select 
economy,estimate,
avg(irrigated_yield)::decimal(6,2) as irrigated_yield,
avg(irrigation)::decimal(6,2) as irrigation,
avg(nonirrigated_yield)::decimal(6,2) as nonirrigated_yield
from poplar_avg_yield_by_economy
where date != (select min(date) from harvest_avg)
group by economy,estimate
)
select 
economy,estimate,
f.irrigated_yield as first_irrigated_yield,
f.irrigation as first_irrigation,
f.nonirrigated_yield as first_nonirrigated_yield,
v.irrigated_yield as irrigated_yield,
v.irrigation as irrigation,
v.nonirrigated_yield as nonirrigated_yield
from f join v using (economy,estimate)
order by estimate,economy;


-- For Prasad's Paper
create view water_usage as 
with w as (
 select pid,generate_subscripts(mean_weather,1) as month, 
 (unnest(mean_weather)).ppt 
 from m3pgjs.pixel), 
p as (
  select pid,type,unnest(d) as date,(unnest(ps)).* 
  from m3pgjs.growthmodel
),
 i as ( 
  select p.pid,type,"coppiceCount",
  sum("Transp") as trans,sum("Irrig") as irrigation,
  sum("Intcptn") as intcptn,sum(ppt) as ppt 
  from p join w on (p.pid=w.pid and extract(month from p.date)=w.month) 
  group by p.pid,type,"coppiceCount"
),
up as (
 select pid,type,(unnest(ps)).* from m3pgjs.nonirrigatedgrowthmodel
),
u as ( 
 select pid,type,"coppiceCount",
 sum("Transp") as trans,sum("Irrig") as irrigation,sum("Intcptn") as intcptn 
 from up 
 group by pid,type,"coppiceCount"
)
select i.pid,type,"coppiceCount",
i.trans as irrigated_et,i.irrigation as irrigation,i.intcptn as intcptn,
u.trans as unirrigated_et,i.ppt 
from i join u using (pid,type,"coppiceCount") 
order by pid,type,"coppiceCount";

