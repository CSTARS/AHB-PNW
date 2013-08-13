drop type if exists tree_t cascade;
CREATE TYPE tree_t as (
"type" text,
"gammaFx" float,
"gammaF0" float,
"tgammaF" float,
"Rttover" float,
"k" float,
"fullCanAge" float,
"kG" float,
"alpha" float,
"Tmax" float,
"Tmin" float,
"Topt" float,
"BLcond" float,
"maxAge" float,
"rAge" float,
"nAge" float,
"fN0" float,
"SLA0" float,
"SLA1" float,
"tSLA" float,
"MaxCond" float,
"LAIgcx" float,
"MaxIntcptn" float,
"LAImaxIntcptn" float,
"m0" float,
"pRx" float,
"pRn" float,
"wSx1000" float,
"thinPower" float,
"y" float,
"stemsPerStump" float,
"stemConst" float,
"stemPower" float,
"pfsMax" float,
"pfsPower" float,
"pfsConst" float,
"rootStoragePct" float,
"rootLAITarget" float,
"rootEfficiency" float
);

-- This could also be an external table
CREATE TABLE tree OF tree_t ( type with options primary key );

INSERT INTO tree (type,"fullCanAge", "kG", "alpha", "Tmax", "Tmin", "Topt", "BLcond", "maxAge", "rAge", "nAge", "fN0", "SLA0", "SLA1", "tSLA", "MaxCond", "LAIgcx", "MaxIntcptn", "LAImaxIntcptn", "m0", "pRx", "pRn", "wSx1000", "thinPower", "y", "stemsPerStump", "stemConst", "stemPower", "pfsMax", "pfsPower", "pfsConst", "rootStoragePct", "rootLAITarget", "rootEfficiency","gammaFx", "gammaF0", "tgammaF", "Rttover", "k") VALUES 
('default',0, 0.5, 0.0177, 40, 5, 20, 0.2, 50, 0.95, 4, 1, 10.8, 10.8, 1, 0.02, 3.33, 0.15, 0, 0, 0.8, 0.25, 300, 1.5, 0.47, 4.4, 0.18, 2.4, 5, -1.161976, 1.91698, 0.25, 10, 0.75, 0.03, 0.001, 24, 0.005, 0.5),
('poplar',0, 0.5, 0.06, 40, 5, 20, 0.2, 50, 0.95, 4, 1, 10.8, 10.8, 1, 0.02, 3.33, 0.15, 0, 0, 0.34, 0.25, 300, 1.5, 0.47, 2.8, 0.18, 2.4, 2, -1.161976, 1.91698, 1, 10, 0.75, 0.03, 0.001, 24, 0.005, 0.5);

drop type if exists plantation_t cascade;
CREATE type plantation_t as (
"type" text,
"StockingDensity" float,
"SeedlingMass" float,
"stemsPerStump" float,
"pS" float,
"pF" float,
"pR" float
);

create table plantation of plantation_t ( type with options primary key);
insert into plantation("type","StockingDensity","SeedlingMass","stemsPerStump","pS","pF","pR")
VALUES ('greenwood',3587,0.0004,1,0.1,0,0.9);
