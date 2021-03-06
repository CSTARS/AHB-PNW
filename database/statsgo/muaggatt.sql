SET search_path = statsgo, pg_catalog;
drop table if exists muaggatt CASCADE;

create table muaggatt (
musym varchar(6),
munamed varchar(175),
mustatus varchar(254), -- references mapunit_status,
slopegraddcp float,
slopegradwta float,
brockdepmin integer,
wtdepannmin integer,
wtdepaprjunmin integer,
flodfreqdcd varchar(254),-- references flooding_frequency_class,
flodfreqmax varchar(254),-- references flooding_frequency_class,
pondfreqprs varchar(254),-- references ponding_frequency_map_legend,
aws025wta float,
aws050wta float,
aws0100wta float,
aws0150wta float,
drclassdcd varchar(28) references drainage_class(drainagecl),
drclasswettest varchar(28) references drainage_class(drainagecl),
hydgrpdcd varchar(3) references hydrologic_group(hydgrp),
iccdcd varchar(1) references capability_class(capcl),
iccdcdpct integer,
niccdcd varchar(1) references capability_class(capcl),
niccdcdpct integer,
engdwobdcd varchar(254),
engdwbdcd varchar(254),
engdwbll varchar(254),
engdwbml varchar(254),
engstafdcd varchar(254),
engstafll varchar(254),
engstafml varchar(254),
engsldcd varchar(254),
engsldcp varchar(254),
englrsdcd varchar(254),
engcmssdcd varchar(254),
engcmssmp varchar(254),
urbrecptdcd varchar(254),
urbrecptwta float,
forpehrtdcp varchar(254),
hydclprs varchar(254),-- references hydric_classification_map_legend,
awmmfpwwta float,
mukey varchar(30) primary key
);

--musym,munamed,mustatus,slopegraddcp,slopegradwta,brockdepmin,wtdepannmin,wtdepaprjunmin,flodfreqdcd,flodfreqmax,pondfreqprs,aws025wta,aws050wta,aws0100wta,aws0150wta,drclassdcd,drclasswettest,hydgrpdcd,iccdcd,iccdcdpct,niccdcd,niccdcdpct,engdwobdcd,engdwbdcd,engdwbll,engdwbml,engstafdcd,engstafll,engstafml,engsldcd,engsldcp,englrsdcd,engcmssdcd,engcmssmp,urbrecptdcd,urbrecptwta,forpehrtdcp,hydclprs,awmmfpwwta,mukey
