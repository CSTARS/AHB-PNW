drop type if exists tdp_t cascade;
create type tdp_t as (
 f0 float,
 f1 float,
 tm float,
 n  float
);

drop type if exists fT_t cascade;
create type fT_t as (
 mn float,
 opt float,
 mx float
);

drop type if exists cond_t cascade;
create type cond_t as (
 mn float,
 mx float,
 lai float
);

drop type if exists intcpt_t cascade;
create type intcpt_t as (
 mn float,
 mx float,
 lai float
);


drop type if exists pR_t cascade;
create type pR_t as (
 mn float,
 mx float,
 m0 float,
 turnover float
);

drop type if exists rootP_t cascade;
create type rootP_t as (
"frac" float,
"LAITarget" float,
"efficiency" float
);

drop type if exists pfs_t cascade;
create type pfs_t as (
       "stemCnt" float,
       "stemC"   float,
       "stemP" float,
       "pfsMx" float,
       "pfsP"  float,
       "pfsC"  float
);

drop type if exists tree_t cascade;
CREATE TYPE tree_t as (
"type" text,
"Rttover" float,
"k" float,
"fullCanAge" float,
"kG" float,
"alpha" float,
"fT" fT_t,
"BLcond" float,
"fAge" tdp_t,
"fN0" float,
"SLA" tdp_t,
"Conductance" cond_t,
"Intcptn" intcpt_t,
"pR" pR_t,
"y" float,
pfs pfs_t,
"rootP" rootP_t,
litterfall tdp_t
);

-- This could also be an external table
CREATE TABLE tree OF tree_t ( type with options primary key );

INSERT INTO tree (type,"fullCanAge", "kG", "alpha", "fT", "BLcond", "fAge", "fN0", "SLA","Conductance", "Intcptn", "pR", "y", "pfs", "rootP","litterfall", "k") VALUES 
('default',0, 0.5, 0.0177, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.02, 3.33)::cond_t, (0,0.15,5)::intcpt_t, (0.25,0.8,0,0.005)::pR_t, 0.47, (4.4, 0.18, 2.4, 5, -1.161976, 1.91698)::pfs_t, (0.25, 10, 0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('headlee2012',0, 0.7, 0.08, (10,30,48)::fT_t, 0.05, (1,0,47.5,4)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0,0.02)::pR_t, 0.43, (2.8, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.083,0.1,1.5,2.5)::tdp_t, 0.799),
('headlee2012-stick',1.5, 0.5, 0.08, (10,30,48)::fT_t, 0.05, (1,0,47.5,4)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0,0.02)::pR_t, 0.43, (1, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (0.01,10,0.6)::rootP_t, (0.083,0.1,1.5,2.5)::tdp_t, 0.799),
('amichev',0, 0.5, 0.06, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.02, 3.33)::cond_t, (0,0.15,5)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('amichev-stick',0, 0.5, 0.06, (5,20,40)::fT_t, 0.2,(1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.02, 3.33)::cond_t, (0,0.15,5)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (1, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (0.01, 10, 0.6)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-cd-lw',0.7, 0.5, 0.08, (0,20,50)::fT_t, 0.05, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-cd-lw-stick',1.5, 0.5, 0.08, (0,20,50)::fT_t, 0.05,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772,1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-wm-lw',0.7, 0.5, 0.08, (0,30,50)::fT_t, 0.05, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-wm-lw-stick',1.5, 0.5, 0.08, (0,30,50)::fT_t, 0.05,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-cd-mw',0.7, 0.5, 0.08, (0,20,50)::fT_t, 0.03, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-cd-mw-stick',1.5, 0.5, 0.08, (0,20,50)::fT_t, 0.03,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-wm-mw',0.7, 0.5, 0.08, (0,30,50)::fT_t, 0.03, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('v-wm-mw-stick',1.5, 0.5, 0.08, (0,30,50)::fT_t, 0.03,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('fischer2013',0, 0.85, 0.08, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.033, 3.33)::cond_t, (0,0.24,7.3)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5)

;

drop type if exists plantation_t cascade;
CREATE type plantation_t as (
"type" text,
"StockingDensity" float,
"SeedlingMass" float,
"seedlingTree" tree_t,
"coppicedTree" tree_t,
"pS" float,
"pF" float,
"pR" float
);

create table plantation of plantation_t ( type with options primary key);
insert into plantation("type","StockingDensity","SeedlingMass","pS","pF","pR","seedlingTree","coppicedTree")
select
'gr/'||t2.type,3587,0.0004,0.1,0,0.9,t,t2
from tree t, tree t2,(VALUES ('v-cd-lw'),('v-cd-mw'),('v-wm-lw'),('v-wm-mw') )as u(n)
where t.type=n||'-stick' 
and t2.type=n;
