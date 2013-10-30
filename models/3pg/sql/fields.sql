-- This SQL file is for the m3pgjs_fields, fieldwork example
--in AFRI
drop schema m3pgjs_fields cascade;
create schema m3pgjs_fields;

create view fields as 
 select *,
 (public_view.pointToPID(longitude,latitude,8192)).*
from (VALUES
('Hayden, ID',-116.7856,47.7661),
('Pilchuck, WA',-121.7967,48.0578),
('Jefferson, OR',-121.2356,44.5792),
('Clarksbug, CA',-121.5272,38.4206)
) AS l(name,longitude,latitude);

create temp view pixel_sw as 
select pid,swconst,swpower 
from m3pg.pixel_sw 
join fields 
using (pid);

create temp view pixel_maxaws as 
select pid,maxaws 
from m3pg.pixel_maxaws 
join fields 
using (pid);

create temp view daylight as 
 select pid,array_agg(month order by month) as month,
 array_agg(daylight order by month) as daylight
 from m3pg.grass_daylight
join fields 
using (pid) group by pid;

create table pixel_climate as 
select pid, x,y,year,month,
st_value(c.tmin,x,y)/100 as tmin, 
st_value(c.tmax,x,y)/100 as tmax, 
st_value(c.tdmean,x,y)/100 as tdmean, 
st_value(c.ppt,x,y)/100 as ppt,
w.rs[month] as rs,
w.tmin[month] as atmin,
w.tmax[month] as atmax,
w.tdmean[month] as atdmean,
w.ppt[month] as appt
from prism.climate c,fields f
join m3pg.weather w using (pid)
order by year,month,pid;
 
-- Radiation data is a hack. We need to get this properly create inside
-- postgres.  Solar needs to be modified for the shapefile input.
-- Not ever sure, why we even try and go the raster route there.

create or replace function dateToIndex(d date) 
RETURNS integer AS
$$
with ym as (
select distinct year,month 
from pixel_climate),
d as (
select array_agg((year||'-'||month||'-01')::date order by year,month) as date 
from ym
),
ind as (
select generate_subscripts(date,1) as i,
unnest(date) as date 
from d) 
select i from ind where date=$1
$$ LANGUAGE SQL;


create table pixel as
with
s as (
  select pid,(maxaws,swpower,swconst)::m3pgjs.soil_t as soil
  from pixel_sw join pixel_maxaws using (pid)
),
u as (
 select pid,year,c.month,
 tmin,tmax,tdmean,ppt,rs*0.0036 as rs,
 daylight[c.month] as daylight
 from pixel_climate c join
 daylight d using (pid)
),
w as (
 select pid,year,month,
 (tmin,tmax,tdmean,ppt,rs,daylight)::m3pgjs.weather_t as weather
 from u
),
ws as (
 select pid,array_agg(weather order by year,month) as weather
 from w group by pid
)
select pid,soil,weather from s join ws using (pid);



