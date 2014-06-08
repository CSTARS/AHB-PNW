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

drop type if exists pfs_t cascade;
create type pfs_t as (
 "stemCnt" float,
 "stemC" float,
 "stemP" float,
 "pfsMx" float,
 "pfsP" float,
 "pfsC" float
);

drop type if exists rootP_t cascade;
create type rootP_t as (
"frac" float,
"LAITarget" float,
"efficiency" float
);

drop type if exists wsVI_t cascade;
create type wsVI_t as (
"constant" float,
"power" float,
"stems_per_stump" float
);

drop type if exists laVI_t cascade;
create type laVI_t as (
"constant" float,
"power"  float
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
litterfall tdp_t,
"wsVI" wsVI_t,
"laVI" laVI_t 
);

-- This could also be an external table
--INSERT INTO tree (type,"fullCanAge", "kG", "alpha", "fT", "BLcond", "fAge", "fN0", "SLA","Conductance", "Intcptn", "pR", "y", "pfs", "rootP","litterfall", "k") VALUES 
--('amichev',0, 0.5, 0.06, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.02, 3.33)::cond_t, (0,0.15,5)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
--('amichev-stick',0, 0.5, 0.06, (5,20,40)::fT_t, 0.2,(1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.02, 3.33)::cond_t, (0,0.15,5)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (1, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (0.01, 10, 0.6)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
--('headlee2012',0, 0.7, 0.08, (10,30,48)::fT_t, 0.05, (1,0,47.5,4)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0,0.02)::pR_t, 0.43, (2.8, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.083,0.1,1.5,2.5)::tdp_t, 0.799),
--('headlee2012-stick',1.5, 0.5, 0.08, (10,30,48)::fT_t, 0.05, (1,0,47.5,4)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0,0.02)::pR_t, 0.43, (1, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (0.01,10,0.6)::rootP_t, (0.083,0.1,1.5,2.5)::tdp_t, 0.799);
-- ('v-cd-lw',0.7, 0.5, 0.08, (0,20,50)::fT_t, 0.05, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-cd-lw-stick',1.5, 0.5, 0.08, (0,20,50)::fT_t, 0.05,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772,1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-wm-lw',0.7, 0.5, 0.08, (0,30,50)::fT_t, 0.05, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-wm-lw-stick',1.5, 0.5, 0.08, (0,30,50)::fT_t, 0.05,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-cd-mw',0.7, 0.5, 0.08, (0,20,50)::fT_t, 0.03, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-cd-mw-stick',1.5, 0.5, 0.08, (0,20,50)::fT_t, 0.03,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-wm-mw',0.7, 0.5, 0.08, (0,30,50)::fT_t, 0.03, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.2,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
-- ('v-wm-mw-stick',1.5, 0.5, 0.08, (0,30,50)::fT_t, 0.03,(1,0,47.5,3.5)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,.5,0.02)::pR_t, 0.47, (1, 0.18, 2.4, 2, -0.772, 1.3)::pfs_t, (0.01, 10, 0.5)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
--('default',0, 0.5, 0.0177, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.02, 3.33)::cond_t, (0,0.15,5)::intcpt_t, (0.25,0.8,0,0.005)::pR_t, 0.47, (4.4, 0.18, 2.4, 5, -1.161976, 1.91698)::pfs_t, (0.25, 10, 0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
--('fischer2013',0, 0.85, 0.08, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.033, 3.33)::cond_t, (0,0.24,7.3)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5);


CREATE TABLE tree OF tree_t ( type with options primary key );

INSERT INTO m3pgjs.tree (type,"fullCanAge", "kG", "alpha", "fT", "BLcond", "fAge", "fN0", "SLA","Conductance", "Intcptn", "pR", "y", "pfs", "rootP","litterfall", "k") VALUES 
('headlee2012',1.5, 0.7, 0.08, (10,30,48)::fT_t, 0.05, (1,0,47.5,4)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0,0.02)::pR_t, 0.43, (2.8, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.083,0.1,1.5,2.5)::tdp_t, 0.799),
('headlee2012-stick',1.5, 0.5, 0.08, (10,30,48)::fT_t, 0.05, (1,0,47.5,4)::tdp_t, 0.26, (19,10,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0,0.02)::pR_t, 0.43,(1, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (0.01,10,0.6)::rootP_t, (0.083,0.1,1.5,2.5)::tdp_t, 0.799),
('fischer2013',1.5, 0.85, 0.08, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.033, 3.33)::cond_t, (0,0.24,7.3)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47, (2.8, 0.18, 2.4, 2, -1.161976, 1.91698)::pfs_t, (1,10,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('fischer2013-stick',1.5, 0.85, 0.08, (5,20,40)::fT_t, 0.2, (1,0,47.5,3.5)::tdp_t, 1, (10.8,10.8,1,2)::tdp_t, (0.0001,0.033, 3.33)::cond_t, (0,0.24,7.3)::intcpt_t, (0.25,0.34,0,0.005)::pR_t, 0.47,(1, 0.081, 2.46, 2, -1.161976, 1.91698)::pfs_t, (0.01,10,0.6)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('pont-hart12coppice-stick',1.5, 0.5, 0.08, (0,20,50)::fT_t, 0.04, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (1,0.081,2.46,2,-0.77,1.2)::pfs_t, (0.01,1,0.6)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5),
('pont-hart12coppice',1.5, 0.5, 0.08, (0,20,50)::fT_t, 0.04, (1,0,47.5,3.5)::tdp_t, .26, (19,10.8,5,2)::tdp_t, (0.0001,0.02, 2.6)::cond_t, (0,0.24,7.3)::intcpt_t, (0.17,0.7,0.5,0.02)::pR_t, 0.47, (1, 0.081, 2.46, 2, -0.77, 1.2)::pfs_t, (0.1,1,0.75)::rootP_t, (0.0015,0.03,2,2.5)::tdp_t, 0.5);

INSERT INTO m3pgjs.tree (type,"fullCanAge", "kG", "alpha", "fT", "BLcond", "fAge", "fN0", "SLA","Conductance", "Intcptn", "pR", "y", "rootP","litterfall", "k","wsVI","laVI") VALUES 
('pont-raspalje-stick',0.8,0.5, 0.08,(0,20,50)::fT_t,0.04,(1,0,47.5,3.5)::tdp_t,0.26,(19,10.8,5,2)::tdp_t,(0.0001,0.02,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.01,1,0.6)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(161.5,0.887,1)::wsVI_t,(0.751,0.495)::laVI_t),
('pont-raspalje',0.6,0.5, 0.08,(0,20,50)::fT_t,0.04,(1,0,47.5,3.5)::tdp_t,0.26,(19,10.8,5,2)::tdp_t,(0.0001,0.02,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.1,1,0.75)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(161.5,0.887,2.8)::wsVI_t,(0.751,0.495)::laVI_t),
('pont-beaupre-best-stick',0.8,0.5, 0.08,(0,20,50)::fT_t,0.04,(1,0,47.5,3.5)::tdp_t,1.0,(19,10.8,5,2)::tdp_t,(0.0001,0.04,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.01,1,0.6)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(166,0.854,4)::wsVI_t,(0.851,0.428)::laVI_t),
('pont-beaupre-best',0.5,0.4, 0.11,(0,20,60)::fT_t,0.04,(1,0,12,5)::tdp_t,1.0,(19,10.8,5,2)::tdp_t,(0.0001,0.04,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.1,1,0.75)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(166,0.854,1.5)::wsVI_t,(0.851,0.428)::laVI_t),
('pont-fritzi-best-stick',0.8,0.5, 0.08,(0,20,50)::fT_t,0.04,(1,0,25,3.5)::tdp_t,0.8,(19,10.8,5,2)::tdp_t,(0.0001,0.04,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.01,1,0.6)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(157.6,0.863,1)::wsVI_t,(0.820,0.481)::laVI_t),
('pont-fritzi-best',0.7,0.3, 0.09,(0,20,60)::fT_t,0.04,(1,0,47.5,3.5)::tdp_t,0.8,(19,10.8,5,2)::tdp_t,(0.0001,0.03,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.1,1,0.75)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(157.6,0.863,3.5)::wsVI_t,(0.820,0.481)::laVI_t),
('pont-raspalje-best-stick',1.0,0.6, 0.08,(0,20,50)::fT_t,0.04,(1,0,47.5,3.5)::tdp_t,0.1,(19,10.8,5,2)::tdp_t,(0.0001,0.04,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.01,1,0.6)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(161.5,0.887,1)::wsVI_t,(0.751,0.495)::laVI_t),
('pont-raspalje-best',0.9,0.5, 0.08,(0,20,50)::fT_t,0.04,(1,0,25,3.5)::tdp_t,0.3,(19,10.8,5,2)::tdp_t,(0.0001,0.04,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.1,1,0.75)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(161.5,0.887,2.8)::wsVI_t,(0.751,0.495)::laVI_t),
('pont-robusta-best-stick',1.0,0.5, 0.06,(0,20,50)::fT_t,0.04,(1,0,25,3.5)::tdp_t,1.0,(19,10.8,5,2)::tdp_t,(0.0001,0.04,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.01,1,0.6)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(162,0.838,1)::wsVI_t,(0.761,0.496)::laVI_t),
('pont-robusta-best',1.2,0.5, 0.06,(0,20,50)::fT_t,0.04,(1,0,25,3.5)::tdp_t,1.0,(19,10.8,5,2)::tdp_t,(0.0001,0.03,2.6)::cond_t,(0,0.24,7.3)::intcpt_t,(0.17,0.7,0.5,0.02)::pR_t,0.47,(0.1,1,0.75)::rootP_t,(0.0015,0.03,2,2.5)::tdp_t,0.5,(162,0.838,5)::wsVI_t,(0.761,0.496)::laVI_t);

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
insert into plantation("type","StockingDensity",
"SeedlingMass","pS","pF","pR","seedlingTree","coppicedTree")
select
p.type||'-'||t2.type,p."StockingDensity",0.0004,0.1,0,0.9,t,t2
from tree t, 
tree t2,
(VALUES 
('gr',3857,'headlee2012'),('gr',3857,'fischer2013'),
('srwc',10000,'pont-hart12coppice'),('srwc',10000,'pont-raspalje'),
('srwc',10000,'pont-beaupre-best'),('srwc',10000,'pont-fritzi-best'),
('srwc',10000,'pont-raspalje-best'),('srwc',10000,'pont-robusta-best') 
)as p(type,"StockingDensity",n)
where t.type=p.n||'-stick' 
and t2.type=p.n;
