set search_path=field,public;
select plv8_startup();

create or replace function manage(
irrigFrac float DEFAULT 0.0,
fertility float DEFAULT 0.8,
cnt integer DEFAULT 240
)
RETURNS m3pgjs.manage_t[] AS $$
WITH
foo as (
select ($1,$2,false)::m3pgjs.manage_t as m
from generate_series(1,$3)
)
select array_agg(m) from foo;
$$ LANGUAGE sql IMMUTABLE STRICT;


drop table if exists growthmodel;
\set start `date`
create table growthmodel as 
with pl as (
select (type,"StockingDensity","SeedlingMass",
"seedlingTree","coppicedTree",
"pS","pF","pR")::m3pgjs.plantation_t as pt 
from plantation
),
dt as (
select (y||'-03-01')::date as d
from generate_series(1960,1989) as y
),
i as (
select d,dateToIndex(d) as i
from dt
)
select 
pid,(pt).type,i.d as date,ir as irrigation,f as fertility,
m3pgjs.grow(pt,p.soil,p.weather[i.i:i.i+235],manage(ir,f)) as ps 
from pixel p,pl,i,
(VALUES (0,0.8),(1,0.8)) as m(ir,f);
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