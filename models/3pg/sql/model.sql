create or replace function init(plantation plantation_t, tree tree_t,soil soil_t) 
RETURNS plantation_state_t AS $$
	return m3PG.init(plantation,tree,soil);
$$ LANGUAGE plv8 IMMUTABLE STRICT;

create or replace function singleStepCoppiced(
plantation plantation_t,
tree tree_t,
soil soil_t,
weather weather_t,
manage manage_t,
cur plantation_state_t) 
RETURNS plantation_state_t AS $$
	return m3PG.singleStepCoppiced(plantation,tree,soil,weather,manage,cur);
$$ LANGUAGE plv8 IMMUTABLE STRICT;

create or replace function grow(
plantation plantation_t, 
tree tree_t,
soil soil_t,
weather weather_t[],
manage manage_t[])
RETURNS plantation_state_t[] AS $$
DECLARE
cur plantation_state_t;
new plantation_state_t;
grow plantation_state_t[] = '{}';
i integer;
BEGIN
cur := init(plantation,tree,soil);
--FOREACH w IN ARRAY weather
FOR i IN 1..array_length(weather,1)
LOOP
 new:= singleStepCoppiced(plantation,tree,soil,weather[i],manage[i],cur);
 grow := array_append(grow,new);
 cur:=new;
END LOOP; 
return grow;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

create or replace function example_dates(
st date DEFAULT '2012-03-01'::date,
en date DEFAULT '2035-12-01'::date
)
RETURNS date[] AS $$
 select array_agg(d::date) 
 from 
 generate_series($1,$2,'1 month'::interval) as d;
$$ LANGUAGE sql IMMUTABLE STRICT;

create or replace function example_management(
dates date[],
coppice date[] DEFAULT  '{2014-09-01,2017-09-01,2020-09-01,2023-09-01,
                          2026-09-01,2029-09-01,2032-09-01,2035-09-01}'::date[],
irrigFrac float DEFAULT 1.0,
fertility float DEFAULT 0.8
)
RETURNS manage_t[] AS $$
WITH
foo as (
 select date,
 ($3,$4, case when 
(
  date = ANY ($2)
)
  THEN true else false END)::manage_t as manage
from unnest($1) as d(date)
)
select 
array_agg(manage order by date) as manage
from foo
$$ LANGUAGE sql IMMUTABLE STRICT;

create or replace function example_weather(
dates date[],
mean_weather weather_t[]
)
RETURNS weather_t[] AS $$
with 
d as (
 select date,
        $2[extract(month from date)] as weather  
 from unnest($1) as date
)
select  array_agg(weather order by date) 
from d; 
$$ LANGUAGE sql IMMUTABLE STRICT;
