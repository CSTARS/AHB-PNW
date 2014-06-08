create table to_bcam.poplar_yield_by_economy as 
select
type,
date,
economy,
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
join to_bcam.economy using (ccid)
group by type,date,economy
order by type,date,economy;

create table to_bcam.poplar_yield_by_economy_commodity as 
select 
type,
date,
economy,
commodity,
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
join to_bcam.economy using (ccid)
group by type,date,economy,commodity
order by type,date,economy,commodity;
