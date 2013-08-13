--drop schema m3pgjs cascade;
--create schema m3pgjs;
set search_path=m3pgjs,public;
\i types.sql
\i tree.sql
\i example_locations.sql
-- If you've modified the js script, then reimport the plv8_startup, otherwise, just run it.
--\i plv8_startup.sql
select plv8_startup();

-- Test showing badness of null defaults.
--create or replace function foo (test float DEFAUlT null) RETURNS float as $$ test=(test===null)?10:test ; plv8.elog(NOTICE,test);return test;$$ LANGUAGE plv8 IMMUTABLE STRICT;
--ahb=# select * from foo(11);
--NOTICE:  11
-- foo 
--  11
--ahb=# select * from foo();

create or replace function init(p plantation, t tree,w weather,s soil) 
RETURNS plantation_state AS $$
	return m3PG.init(p,t,w,s);
$$ LANGUAGE plv8 IMMUTABLE STRICT;

create or replace function singleStepCoppiced(t tree,s soil,w weather,
m management,
c plantation_state) 
RETURNS plantation_state AS $$
	return m3PG.singleStepCoppiced(t,s,w,m,c);
$$ LANGUAGE plv8 IMMUTABLE STRICT;

create or replace function pixelTree(
 i_date date,i_cnt int, 
 i_tree tree,i_pixel pixel) 
RETURNS TABLE(d date,ps plantation_state) AS $$
BEGIN
RETURN QUERY 
with
recursive psm(dt,p) as (
 VALUES (i_date,
 init(i_tree,
      (i_pixel).mean_weather[extract(month from '2012-03-01'::date)],
      (i_pixel).soil))
UNION ALL 
 select (dt+'1 month'::interval)::date as dt,
 singleStep(
      i_tree,
      (i_pixel).mean_weather[extract(month from dt+'1 month'::interval)],
      (i_pixel).soil,p) as p
 from psm
) 
select dt,p from psm limit i_cnt;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

create or replace function grow(i_tree tree,
i_soil soil,weathers weather[],manage management[])
RETURNS plantation_state[] AS $$
DECLARE
cur plantation_state;
new plantation_state;
grow plantation_state[] = '{}';
w weather;
BEGIN
cur := init(i_tree,i_soil,weathers[1],manage[1]);
--FOREACH w IN ARRAY weathers
FOR i IN 1..array_length(weathers,1)
LOOP
 new:= singleStepCoppiced(i_tree,i_soil,weathers[i],manage[i],cur);
 grow := array_append(grow,new);
 cur:=new;
END LOOP; 
return grow;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;


create or replace function example_management(
st date DEFAULT '2012-03-01'::date,
en date DEFAULT '2035-12-01'::date,
coppice date[] DEFAULT  '{2014-09-01,2017-09-01,2020-09-01,2023-09-01,
                          2026-09-01,2029-09-01,2032-09-01,2035-09-01}'::date[],
irrigFrac float DEFAULT 1.0,
fertility float DEFAULT 0.8
)
RETURNS management[] AS $$
with d as (
 select d::date date 
 from 
 generate_series($1,$2,'1 month'::interval) as d
),
foo as (
 select date,
 ($4,$5, case when 
(
 d.date = ANY ($3)
)
  THEN true else false END)::management as manage
from d) 
select 
array_agg(manage order by date) as manage
from foo
$$ LANGUAGE sql IMMUTABLE STRICT;

create or replace function example_weather(
mean_weather weather[],
st date DEFAULT '2012-03-01'::date,
en date DEFAULT '2035-12-01'::date
)
RETURNS weather[] AS $$
with d as (
 select d::date date,
        $1[extract(month from d)] as weather  
 from 
 generate_series($2,$3,'1 month'::interval) as d
)
select  array_agg(weather order by date) 
from d; 
$$ LANGUAGE sql IMMUTABLE STRICT;

create temp table growit as select 
pid,trees.type,grow(trees,pixel.soil,example_weather(p.weather),m) as ps 
from trees,pixel p,example_management() as m;