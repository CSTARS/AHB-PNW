drop table if exists locations;
create table locations (
       name text,
       longitude float,
       latitude float
);

insert into locations (name,longitude,latitude) select * from
(VALUES
('Hayden, ID',-116.7856,47.7661),
('Pilchuck, WA',-121.7967,48.0578),
('Jefferson, OR',-121.2356,44.5792),	
('Clarksbug, CA',-121.5272,38.4206)
) AS l(name,longitude,latitude);

-- --in AFRI
-- create temp view fields as 
--  select *,
--  (public_view.pointToPID(longitude,latitude,8192)).pid 
-- from (VALUES
-- ('Hayden, ID',-116.7856,47.7661),
-- ('Pilchuck, WA',-121.7967,48.0578),
-- ('Jefferson, OR',-121.2356,44.5792),
-- ('Clarksbug, CA',-121.5272,38.4206)
-- ) AS l(name,longitude,latitude);

drop table if exists pixel_sw;
CREATE TABLE pixel_sw (
    pid integer primary key,
    swconst numeric(6,2),
    swpower numeric(6,2)
);

--afri=# \COPY (select pid,swconst,swpower from m3pg.pixel_sw join fields using (pid)) with csv header to STDOUT
COPY pixel_sw (pid, swconst, swpower) FROM stdin with csv header;
pid,swconst,swpower
288544,0.60,6.62
289038,0.54,5.84
293925,0.52,5.50
303216,0.47,4.45
\.

drop table if exists pixel_weather;
CREATE TABLE pixel_weather (
    pid integer primary key,
    tmin double precision[],
    tmax double precision[],
    tdmean double precision[],
    ppt double precision[],
    rs double precision[]
);

--afri=# \COPY (select pid, tmin, tmax, tdmean, ppt, rs from m3pg.weather join fields using (pid) ) to STDOUT

COPY pixel_weather (pid, tmin, tmax, tdmean, ppt, rs) FROM stdin with csv header;
pid,tmin,tmax,tdmean,ppt,rs
289038,"{-3.9,-3.52,-1.2,1.6,5.79,9.24,12.86,11.94,7.86,2.8,-0.74,-4}","{2.37,4.94,9.07,13.89,18.87,22.76,29,28.39,23.11,14.2,6.74,1.91}","{-2.94,-3.33,-1.84,0.26,3.72,5.98,7.38,6.24,4.64,2.11,0,-3.24}","{78.15,52.22,59.35,39.01,54.94,41.68,17.4,21.42,24.43,57.8,82.08,91.56}","{1045.0679931641,2129.2717285156,3500.4392089844,4962.1108398438,5491.4594726562,6182.2651367188,7008.9990234375,5977.3583984375,4202.8662109375,2491.3149414062,1107.7275390625,832.1188354492}"
288544,"{-0.68,-0.93,0.29,2.06,5.08,7.72,10.27,10.21,7.84,4.04,1.45,-1}","{4.88,6.67,8.66,12.54,16.01,18.87,23.31,22.78,19.92,12.84,7.6,4.2}","{0.64,-0.48,0.81,1.96,5.02,7.5,9.65,8.92,6.64,3.85,2.42,-0.3}","{412.7,249.5,314.48,188.46,153.94,108.25,44.06,59.16,113.73,286.99,456.58,399.43}","{954.5272216797,1826.1887207031,2560.9418945312,4139.1044921875,4390.4287109375,4998.529296875,5646.8032226562,5006.0083007812,3579.1357421875,1762.3454589844,1047.7945556641,812.5330810547}"
293925,"{-3.78,-3.36,-2.2,-0.77,3.04,5.68,8.64,7.92,4.71,0.44,-1.48,-4.3}","{5.63,8,12.12,15.31,20.26,24.55,30.71,29.56,25.26,16.86,9.61,5}","{-2.74,-3.42,-2.49,-0.8,2.34,4.44,5.72,5.24,2.7,-0.1,-1.6,-4.04}","{34.98,23.63,15.63,23.88,27.44,20.76,9.78,10.37,7.9,21.96,33.35,38.69}","{1428.2563476562,2633.431640625,3750.1323242188,5149.5688476562,6181.7861328125,7346.90625,7565.888671875,6537.7509765625,4990.7421875,3168.7890625,1640.9327392578,1180.6817626953}"
303216,"{3.87,5.25,6.53,7.96,11.06,13.3,14.62,14.38,13.02,9.34,6.1,3.73}","{12.62,15.38,19.39,21.82,26.5,30.18,33.2,33.16,30.94,25.06,18,12.64}","{4.65,5.67,6.13,6.63,8.92,10.3,11.97,11.68,9.76,6.84,6.12,4.47}","{103.21,95.1,52.2,32.34,22.93,3.6,0.04,1.16,2.49,20.91,44.24,100.93}","{1677.6779785156,2630.7092285156,4583.7021484375,6014.36328125,7032.3916015625,7915.0751953125,7831.5908203125,6956.3227539062,5648.3588867188,4063.7739257812,2421.6083984375,1734.6781005859}"
\.

drop table if exists pixel_maxaws;
CREATE TABLE pixel_maxaws (
    pid integer primary key,
    maxaws double precision
);

--afri=# \COPY (select pid, maxaws from m3pg.pixel_maxaws join fields using (pid) ) to STDOUT with csv header

COPY pixel_maxaws (pid, maxaws) FROM stdin with csv header;
pid,maxaws
288544,12.2589250300169
289038,10.4020365333445
293925,9
303216,15.5164195945742
\.

drop table if exists grass_daylight;
CREATE TABLE grass_daylight (
    month integer,
    pid integer,
    daylight double precision,
    primary key(month,pid)
);

--afri=# \COPY (select distinct d.* from m3pg.grass_daylight d join fields using (pid) order by pid,month) TO STDOUT with CSV HEADER

COPY grass_daylight (month, pid, daylight) FROM stdin with csv header;
month,pid,daylight
1,288544,8.6755819321
2,288544,10.0120687485
3,288544,11.7401571274
4,288544,13.5278930664
5,288544,15.0232419968
6,288544,15.7772102356
7,288544,15.3449249268
8,288544,13.9501028061
9,288544,12.2210474014
10,288544,10.4387559891
11,288544,8.9107952118
12,288544,8.1973247528
1,289038,8.7156896591
2,289038,10.0350589752
3,289038,11.7430992126
4,289038,13.510386467
5,289038,14.9871912003
6,289038,15.7307167053
7,289038,15.3045368195
8,289038,13.9275712967
9,289038,12.21854496
10,289038,10.4566583633
11,289038,8.947725296
12,289038,8.244187355
1,293925,9.0829715729
2,293925,10.2472496033
3,293925,11.7703285217
4,293925,13.3485469818
5,293925,14.6563081741
6,293925,15.3066654205
7,293925,14.9347372055
8,293925,13.7195653915
9,293925,12.1953821182
10,293925,10.6221113205
11,293925,9.2864952087
12,293925,8.6715126038
1,303216,9.6702594757
2,303216,10.5920610428
3,303216,11.8149452209
4,303216,13.0846452713
5,303216,14.124833107
6,303216,14.6339139938
7,303216,14.3436193466
8,303216,13.381444931
9,303216,12.1574277878
10,303216,10.8918437958
11,303216,9.8301267624
12,303216,9.3491296768
\.

drop table if exists pixel;
create table pixel as 
with 
s as (
  select pid,(maxaws,swconst,swpower)::soil_t as soil 
  from pixel_sw join pixel_maxaws using (pid)
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

