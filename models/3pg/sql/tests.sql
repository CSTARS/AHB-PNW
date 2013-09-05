-- Test showing badness of null defaults.
create or replace function test_null_bad (test float DEFAUlT null) 
RETURNS float as $$ 
test=(test===null)?10:test ; 
plv8.elog(NOTICE,test);
return test;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

select *,11 as want from test_null_bad(11);
select *,10 as want from test_null_bad();

drop function test_null_bad(float);

-- Dates seem to come through fine on JavaScript conversion
create or replace function test_date (d date) 
RETURNS date as $$
log(d);
return new Date(d) ;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

select d,test_date(d) from (VALUES ('2012-01-01 PST'::date)) as v (d);


