create table growthmodel as
with pl as (
 select (type,"StockingDensity","SeedlingMass",
 "seedlingTree","coppicedTree","pS","pF","pR")::m3pgjs.plantation_t 
 as pt
from m3pgjs_fields.plantation
),
swd as (
 select p,scenario,date,
       w.weather[index:index+235] as weather
from generate_series(2000,2060,2) as plant(y)
join pixel_weather_dates on ((y||'-03-15')::date=date),
pixel_weather w join m3pgjs_fields.pixel p using (pid)
)
select
(p).pid,scenario,(pt).type,swd.date,
ir as irrigation,f as fertility,
m3pgjs.grow(pt,(p).soil,swd.weather,m3pgjs_fields.manage(ir,f)) as ps
from pl,swd,
(VALUES (0,0.8),(1,0.8)) as m(ir,f);

create temp view gm_as_table as
with a as (
 select name,scenario,type,date,irrigation,
 generate_subscripts(ps,1) as count,(unnest(ps)).* 
 from climate_change.growthmodel 
 join m3pgjs_fields.fields using (pid) 
 order by name,date,count
)
select name,scenario,date as planted,
irrigation,(date::date +(count-1||' months')::interval)::date as month,
"WS","WF","W","CumIrrig" 
from a 
order by name,planted,irrigation,month;

\COPY (select * from gm_as_table) to ~/climate_monthly_plus.csv with csv header
