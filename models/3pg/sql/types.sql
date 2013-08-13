CREATE TYPE weather_t as (
"tmin" float,
"tmax" float,
"tdmean" float,
"ppt" float,
"rad" float,
"daylight" float
);

CREATE TYPE soil_t as (
"maxAWS" float,
"swpower" float,
"swconst" float
);

CREATE TYPE plantation_state_t as (
"feedstockHarvest" float,
"coppiceCount" float,
"coppiceAge" float,
"VPD" float,
"fVPD" float,
"fT" float,
"fFrost" float,
"fNutr" float,
"fSW" float,
"fAge" float,
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
"PhysMod" float,
"pfs" float,
"pR" float,
"pS" float,
"pF" float,
"litterfall" float,
"NPP" float,
"RootP" float,
"dW" float,
"WF" float,
"WR" float,
"WS" float,
"W" float
);

CREATE type manage_t as (
       "irrigFrac" float,
       "fertility" float,
       coppice boolean
);


