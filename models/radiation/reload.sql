-- This requires the JS Module loader
\set radiation `cat radiation.js`
delete from plv8_modules where modname='radiation';
insert into plv8_modules 
values ('radiation',true,:'radiation');

do language plv8 ' load_module("radiation");';

CREATE TYPE extraterrestrial_radiation_t as 
(
	"date" date,
	"doy" integer,
	"latitude_radians" float,
	"inverse_relative_solar_distance" float,
	"extraterrestrial_radiation" float,
	"sunset_hour_angle" float,
	"daylight_hours" float,
	"solar_declination" float
);

create or replace function extraterrestrial_radiation as (day date,lat float)
RETURNS extraterrestrial_radiation_t AS $$
	return SolRad.extraterrestrial_radiation(day,lat);
$$ LANGUAGE plv8 IMMUTABLE STRICT;

create or replace function solar_radiation as (rad extraterrestrial_radiation_t  ,n float)
RETURNS float AS $$
	return SolRad.solar_radiation(rad,n);
$$ LANGUAGE plv8 IMMUTABLE STRICT;

create or replace function daylight_hours as (rad extraterrestrial_radiation_t  ,Rs float)
RETURNS float AS $$
	return SolRad.daylight_hours(rad,Rs);
$$ LANGUAGE plv8 IMMUTABLE STRICT;
