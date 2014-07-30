drop table if exists pixel;
create table pixel as 
with 
s as (
  select pid,(maxaws,swpower,swconst)::soil_t as soil 
  from m3pg.pixel_sw join m3pg.pixel_maxaws using (pid)
),
d as (
 select pid,array_agg(month order by month) as month,
 array_agg(daylight order by month) as daylight 
 from grass_daylight group by pid
), 
u as (
 select pid,generate_subscripts(tmin,1) i,
 unnest(tmin) as tmin,
 unnest(tmax) as tmax,
 unnest(tdmean) as tdmean,unnest(ppt) as ppt,unnest(rs)*0.0036 as rs,
 unnest(daylight) as daylight 
 from weather join 
 d using (pid)
), 
w as (
 select pid,i,(tmin,tmax,tdmean,ppt,rs,daylight)::weather_t as weather 
 from u
),
ws as (
 select pid,array_agg(weather order by i) as mean_weather 
 from w group by pid
)
select pid,soil,mean_weather from s join ws using (pid);

