\set m3pg `cat ../js/Model3PG.js`
\set m3pgfunc `cat ../js/SingleRunFunctions.js`
truncate plv8_modules;
insert into plv8_modules 
values ('m3pgfunc',true,:'m3pgfunc'),
('m3pg',true,:'m3pg');

do language plv8 ' load_module("m3pgfunc"); load_module("m3pg"); ';
