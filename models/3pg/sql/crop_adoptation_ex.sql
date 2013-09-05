create or replace temp view crop_loss as 
with f as 
(
  select economy,ccid,poplar_price,commodity,
  (acres - max(acres) OVER (partition by economy,ccid,commodity))*0.404686
     as hectares 
  from from_bcam.crop_loss
)
select * from f where hectares != 0; 

-- crop_loss shows negative hectares
drop table if exists poplar_adoption cascade;
create table poplar_adoption as 
with 
sup as (
  select pid,replace(cmz,' ','')||state as economy,ccid,
         commodity,acres_harvested,yield as poplar_yield,
	 irrigated
  from to_bcam.pixel_nass_production join m3pgjs.average_growth 
  using (pid) 
  where year=2007), 
tot as ( 
  select pid,economy,ccid,commodity,
         -acres_harvested*0.404686 as hectares_harvested,
	 irrigated,poplar_yield,
  	 acres_harvested*0.404686*poplar_yield as poplar_harvest,
         (sum(-acres_harvested) OVER W)*0.404686 as total_hectares,
         (sum(-acres_harvested*poplar_yield) OVER W)*0.404686 as total_harvest 
  from sup 
  WINDOW W as (partition by economy,ccid,commodity order by poplar_yield desc)
) 
select distinct tot.*,
  min(c.poplar_price) OVER C as poplar_price,
  max(c.hectares) OVER C as bcam_hectares 
from tot 
left join crop_loss c on (tot.economy=c.economy and tot.ccid=c.ccid 
and tot.commodity=c.commodity and tot.total_hectares > c.hectares) 
WINDOW C as (partition by tot.pid,tot.economy,tot.ccid,tot.commodity);

insert into poplar_adoption (pid,economy,ccid,commodity,hectares_harvested,
                             irrigated,poplar_yield,poplar_harvest,
     total_hectares,total_harvest,poplar_price,bcam_hectares)
select pid,economy,ccid,'POPLAR',
sum(-hectares_harvested) as hectares_harvested,
bool_or(irrigated),poplar_yield,
sum(poplar_harvest) as poplar_harvest,
sum(-total_hectares) as total_hectares,
sum(-total_harvest) as total_harvest,poplar_price,
sum(-bcam_hectares) as bcam_hectares
from poplar_adoption 
where bcam_hectares is not null 
group by pid,economy,ccid,poplar_yield,poplar_price order by pid,poplar_price;

create or replace view poplar_adoption_export as 
select pid,economy,ccid,commodity,hectares_harvested::decimal(7,2),
irrigated,
poplar_yield::decimal(7,2),poplar_harvest::decimal(10,2),
total_hectares::integer,
total_harvest,
poplar_price::decimal(6,2),
bcam_hectares::decimal(10,2),
st_asEWKT(st_transform(boundary,4269)) as boundary
from poplar_adoption join afri.pixels using (pid);


\COPY (select * from poplar_adoption_export) TO ~/public_html/poplar_adoption.csv with CSV header

create or replace view poplar_yields as
select y.pid,
irrigated_yield::decimal(7,2),
irrigation::decimal(7,2),
nonirrigated_yield::decimal(7,2),
st_asEWKT(st_transform(boundary,4269)) as boundary
from average_growth y join afri.pixels using (pid);

\COPY (select * from poplar_yields) TO ~/public_html/poplar_yields.csv with CSV header
