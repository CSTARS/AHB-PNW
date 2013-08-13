CREATE TYPE weather as (
"tmin" float,
"tmax" float,
"tdmean" float,
"ppt" float,
"rad" float,
"daylight" float
);

CREATE TYPE soil as (
"maxaws" float,
"swpower" float,
"swconst" float
);

CREATE TYPE plantation_state as (
"VPD" float,
"fVPD" float,
"fT" float,
"fFrost" float,
"fNutr" float,
"PAR" float,
"xPP" float,
"Intcptn" float,
"ASW" float,
"CumIrrig" float,
"Irrig" float,
"StandAge" float,
"LAI" float,
"CanCond" float,
"Transp" float,
"fSW" float,
"fAge" float,
"PhysMod" float,
"pR" float,
"pS" float,
"litterfall" float,
"NPP" float,
"WF" float,
"WR" float,
"WS" float,
"W" float
);

CREATE type management as (
       "irrigFrac" float,
       "fertility" float,
       coppice boolean
);


