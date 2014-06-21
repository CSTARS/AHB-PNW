create table growthmodel as
with
swd as (
 select p,scenario,date,
       w.weather[index:index+12*5*3] as weather
from generate_series(2000,2060,10) as plant(y)
join pixel_weather_dates on ((y||'-03-15')::date=date),
pixel_weather w join m3pgjs.pixel p using (pid)
),
m as (
 select m3pgjs.example_management(example_dates(min(date),max(date))) from 
 swd
)
select
(p).pid,scenario,(pt).type,swd.date,
ir as irrigation,f as fertility,
m3pgjs.grow(pt,(p).soil,swd.weather,m3pgjs.manage(ir,f)) as ps
from plantation,swd,
(VALUES (0,0.7),(1,0.8)) as m(ir,f);

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
