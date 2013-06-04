
var _3PGFunc = {};

/**Intcptn
units='unitless' 
description='Canopy Rainfall interception'
*/
_3PGFunc.Intcptn = function(MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if (LAImaxIntcptn<=0){
    return MaxIntcptn;    
  }else {
    return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn);
  }
}

/**init_Intcptn
Canopy Rainfall Interception at time of planting
*/
_3PGFunc.init_Intcptn = function(MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if(LAImaxIntcptn <= 0){
     return MaxIntcptn;
  } else {
     return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn );
  }
}

/**ASW
units='mm' 
description='Available Soil Water'
*/
_3PGFunc.ASW = function(maxASW, prev_ASW, date_ppt, cur_Transp, cur_Intcptn, cur_Irrig){
  return Math.min(maxASW*10, Math.max(prev_ASW + date_ppt - (cur_Transp + cur_Intcptn * date_ppt) + cur_Irrig, 0));
}

/**init_ASW
Available soil water at planting time
*/
_3PGFunc.init_ASW = function(maxAWS){
  return 0.8 * 10 * maxAWS;
}


//TODO: double check the appropriate use of tdmean (dew point temp)
//TODO: take constants out
/**VPD
units='kPA'
description='Mean vapor pressure deficit'
*/
_3PGFunc.VPD = function(date_tmin, date_tmax, date_tdmean){
  return (0.6108 / 2 * (Math.exp(date_tmin * 17.27 / (date_tmin + 237.3) ) + Math.exp(date_tmax * 17.27 / (date_tmax + 237.3) ) ) ) - (0.6108 * Math.exp(date_tdmean * 17.27 / (date_tdmean + 237.3) ) );
}


/**fVPD
units = unitless
description='Vapor Pressure Deficit Modifier (Poplar)'
*/
_3PGFunc.fVPD = function(kG, cur_VPD){
  return Math.exp(-1 * kG * cur_VPD); 
}

//TODO: take constants out
// make a meaningful tempvar name
/**fFrost
units = unitless
description = 'Number of Freeze Days Modifier'
*/
_3PGFunc.fFrost = function(date_tmin) {
  var tempVar = -1.0;
  if (date_tmin >= 0){
    tempVar = 1.0;
  } //else -1.0
  
  return 0.5 * (1.0 + tempVar * Math.sqrt(1 - Math.exp(-1 * Math.pow((0.17 * date_tmin) , 2) * (4 / 3.14159 + 0.14 * Math.pow( (0.17 * date_tmin) , 2) ) / (1 + 0.14 * Math.pow((0.17 * date_tmin) , 2) ) ) ) ); 
}

//TODO - better naming?: tmin, tmax = weather Topt, Tmax, Tmin = tree params
/**fT
units=unitless
description='Temperature modifier'
*/
_3PGFunc.fT = function(date_tmin, date_tmax, Tmin, Tmax, Topt){
  var tavg = (date_tmin + date_tmax) / 2;
  if (tavg <= Tmin || tavg >= Tmax){
     return 0;
  }else {
     return  ( (tavg - Tmin) / (Topt - Tmin) )  *  Math.pow ( ( (Tmax - tavg) / (Tmax - Topt) )  , ( (Tmax - Topt) / (Topt - Tmin) ) );
  }
}

/**Irrig
units='mm/mon'
description='Required Irrigation'
*/
_3PGFunc.Irrig = function(irrigFrac, cur_Transp, cur_Intcptn, date_ppt){
   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );
}


/**CumIrrig
units='mm' 
description='Cumulative Required Irrigation'
*/
_3PGFunc.CumIrrig = function(prev_CumIrrig, cur_Irrig){
   return prev_CumIrrig + cur_Irrig;
}

/**init_CumIrrig
Cumulative Required Irrigation at the time of planting
*/
_3PGFunc.init_CumIrrig = function(){
  return 0; 
}

/**fAge
//TODO: recheck description
TODO: set nage=0 as a param in the model setup (like a checkbox)
units='unitless'
description='age modifier'
*/
_3PGFunc.fAge = function(prev_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (prev_StandAge / maxAge) / rAge) , nAge) ) );
  }
}

/**
TODO: WHAT IS INIT_FAGE? where in makefile??
*/
_3PGFunc.init_fAge = function(cur_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (cur_StandAge / maxAge) / rAge) , nAge) ) );
  }
}

/**fSW
TODO: get units and description
*/
function fSW(prev_ASW, maxAWS, swconst, swpower){
   return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (prev_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
}

/**
TODO: WHAT IS INIT_FSW? where in makefile??
*/
_3PGFunc.init_fSW = function(cur_ASW, maxAWS, swconst, swpower){
  return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (cur_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
}

/**fNutr
units='unitless' 
description='Nutritional Fraction, might be based on soil and fertilizer at some point'
*/
_3PGFunc.fNutr = function(fN0, FR){
  return fN0 + (1 - fN0) * FR;
}

/**PhysMod
TODO: why $3 in makefile - ask about it
units=unitless 
description='Physiological Modifier to conductance and APARu'
*/
_3PGFunc.PhysMod = function(cur_fVPD, cur_fSW, cur_fAge){
   return Math.min(cur_fVPD , cur_fSW) * cur_fAge;
}

/**LAI
units='m2/m2' 
description='Leaf Area Index'
*/
_3PGFunc.LAI = function(prev_WF, SLA1, SLA0, prev_StandAge, tSLA){
   return prev_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (prev_StandAge / tSLA) , 2) ) );
}

/**init_LAI
Leaf Area INdex at the time of planting
*/
_3PGFunc.init_LAI = function(cur_WF, SLA1, SLA0, cur_StandAge, tSLA){
  return cur_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (cur_StandAge / tSLA) , 2) ) ); 
}

/**CanCond
units='gc,m/s' 
description='Canopy Conductance'
*/
_3PGFunc.CanCond = function(MaxCond, cur_PhysMod, cur_LAI, LAIgcx){
   return Math.max(0.0001 , MaxCond * cur_PhysMod * Math.min(1 , cur_LAI / LAIgcx) );
}

/**Transp
units='mm/mon' 
description='Canopy Monthly Transpiration'
*/
_3PGFunc.Transp = function(days_per_mon, e20, Qa, Qb, date_nrel, date_daylight, rhoAir, lambda, VPDconv, cur_VPD, BLcond, cur_CanCond){
   return days_per_mon * ( (e20 * (Qa + Qb * (date_nrel / date_daylight) ) + (rhoAir * lambda * VPDconv * cur_VPD * BLcond) ) / (1 + e20 + BLcond / cur_CanCond) ) * date_daylight * 3600 / lambda;
}

/**NPP
units='metric tons Dry Matter/ha' 
description - ? 
TODO: add description
*/
_3PGFunc.NPP = function(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost){
  var CanCover = 1;
  if (prev_StandAge < fullCanAge){
    CanCover = prev_StandAge / fullCanAge;
  } //else CanCover = 1;
  return cur_xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(cur_fVPD , cur_fSW) * cur_fAge * alpha * fNutr * cur_fT * cur_fFrost;
}

/**init_NPP
TODO: WHAT IS IT?
*/
_3PGFunc.init_NPP = function(cur_StandAge, fullCanAge, cur_xPP, k, cur_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost){
 return 0;
}

/**litterfall
TODO: untis + definition
*/
_3PGFunc.litterfall = function(gammaFx, gammaF0, prev_StandAge, tgammaF, prev_lastCoppiceAge){
  var prev_realStandAge = prev_StandAge - prev_lastCoppiceAge;
  Logger.log("DEBUGGING COPPICE: prev_StandAge=" + prev_StandAge +"; prev_realStandAge=" + prev_realStandAge);
  return gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * prev_realStandAge / tgammaF) );
}

/**init_litterfall
TODO: WHAT IS IT SUPPOSED TO BE?
*/
_3PGFunc.init_litterfall = function(gammaFx, gammaF0, cur_StandAge, tgammaF){
  
  var result = gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * cur_StandAge / tgammaF) );
  //Logger.log("DEBUGGING: " + result);
  return result;
}

/**pS
TODO: units and description
*/
_3PGFunc.pS = function(prev_WS, StockingDensity, StemConst, StemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (prev_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
}

/**init_pS
TODO: WHAT IS IT SUPPOSED TO BE???
*/
_3PGFunc.init_pS = function(cur_WS, StockingDensity, StemConst, StemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (cur_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
}

/**pR
TODO: units and description
*/
_3PGFunc.pR = function(pRx, pRn, cur_PhysMod, m0, FR){
  return (pRx * pRn) / (pRn + (pRx - pRn) * cur_PhysMod * (m0 + (1 - m0) * FR) );
}

/**pF
TODO: units and description
*/
_3PGFunc.pF = function(cur_pR, cur_pS){
  return 1 - cur_pR - cur_pS;
}

/**WF
units='t/ha' 
description='Foliage Biomass'
*/
_3PGFunc.WF = function(cur_pF, prev_WF, cur_NPP, cur_litterfall){
   return prev_WF + cur_NPP * cur_pF - cur_litterfall * prev_WF;
}

/**init_WF
Foliage Biomass at planting time
*/
_3PGFunc.init_WF = function(StockingDensity, SeedlingMass){
  return 0.5 * StockingDensity * SeedlingMass; 
}

/**WR
units='t/ha' 
description='Root Biomass'
*/
_3PGFunc.WR = function(prev_WR, cur_NPP, cur_pR, Rttover){
   return prev_WR + cur_NPP * cur_pR - Rttover * prev_WR;
}

/**init_WR
Root Biomass at planting time
*/
_3PGFunc.init_WR = function(StockingDensity, SeedlingMass){
  return 0.25 * StockingDensity * SeedlingMass; 
}

/**WS
units='t/ha' 
description='Stem Biomass'
*/
_3PGFunc.WS = function(prev_WS, cur_NPP, cur_pS){
   return prev_WS + cur_NPP * cur_pS;
} 

/**init_WS
Root Biomass at planting time
*/
_3PGFunc.init_WS = function(StockingDensity, SeedlingMass){
  return 0.25 * StockingDensity * SeedlingMass; 
}

/**W
units='t/ha' 
description='Tree Biomass'
*/
_3PGFunc.W = function(cur_WF, cur_WR, cur_WS){
  return cur_WF + cur_WR + cur_WS;
}

/**StandAge
TODO: units and description
*/
_3PGFunc.StandAge = function(prev_StandAge){
  return prev_StandAge + 1.0/12;
}

/**initStandAge
StandAge at planting time
*/
_3PGFunc.init_StandAge = function(){
  return 1.0 / 12; 
}


/*** FUNCTIONS FROM ANOTHER MAKEFILE solar.mk in alder:/home/quinn/qjhart.postgis-data/m3pg$ cat solar.mk */

/**PAR
TODO: mols or mols per m^2?
units=mols 
description='Monthly PAR in mols / m^2 month' 
*/
_3PGFunc.PAR = function(date_rad, molPAR_MJ){
  return date_rad * 30.4 * molPAR_MJ;
}

/**xPP
units='metric tons Dry Matter/ha' 
description='maximum potential Primary Production [tDM / ha month]
NOTE: 10000/10^6 [ha/m2][tDm/gDM] 
*/
_3PGFunc.xPP = function(y, cur_PAR, gDM_mol){
  return y * cur_PAR * gDM_mol / 100;
}
      
/*** FUNCTIONS FOR COPPICING */

// Coppice Functions are based on Diameter on Stump, NOT DBH.
_3PGFunc.coppice_pfs = function(prev_WS,StockingDensity, cpStemsPerStump, cpStemConst, cpStemPower, cpPfsConst, cpPfsPower,cpMaxPfs) {
  var avDOB = Math.pow( ( (prev_WS * 1000 / StockingDensity / cpStemsPerStump) / cpStemConst) , (1 / cpStemPower) );
  var ppfs= cpPfsConst * Math.pow(avDOB , cpPfsPower);
  return Math.min(cpMaxPfs,ppfs);
}

_3PGFunc.coppice_pS = function(cur_pR,pfs) {
  return (1 - cur_pR) / (1 + 1/pfs );
}

_3PGFunc.coppice_pF = function(cur_pR,pfs) {
    return (1 - cur_pR) / (1 + 1/pfs );
}

_3PGFunc.coppice_RootPP = function(cur_npp, cur_nppTarget, WR,W,pRx,cpRootStoragePct,cpRootLAITarget) {
 // var npp=NPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost);
 // var nppTarget = NPP(prev_StandAge, fullCanAge, cur_xPP, k, cpRootLAITarget, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost);
 
  var nppRes = cur_nppTarget - cur_npp;
  //Logger.log("nppRes=" + nppRes);
  var rootPP;
  if (nppRes > 0) {
    rootPP = Math.min(nppRes,WR*(WR/W - pRx)*cpRootStoragePct);
  } else {
    rootPP = 0;
  }
  return rootPP;
}

_3PGFunc.coppice_NPP = function(cur_npp,coppice_RootPP) {
  //var npp = NPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost);
//  var rootPP = coppice_RootPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost,WR,W,pRx,cpRootStoragePct);
  return cur_npp+coppice_RootPP;
}

/**WR
units='t/ha' 
description='Root Biomass'
*/
_3PGFunc.coppice_WR = function(prev_WR, cur_NPP, cur_pR, Rttover,coppice_RootPP){
  //Logger.log("DEBUGGING COPPICE: prev_WR=" + prev_WR + "; cur_NPP=" + cur_NPP + "; cur_pR=" + cur_pR + "; Rttover=" + Rttover+ "; coppice_RootPP=" + coppice_RootPP);
   return prev_WR, prev_WR + cur_NPP * cur_pR - Rttover * prev_WR - coppice_RootPP;
}


// NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var objStr = "_3PGFunc={";
		for( var key in _3PGFunc ) {
			if( typeof _3PGFunc[key] == 'function' ) {
				objStr += key+":"+_3PGFunc[key].toString()+",";
			} else {
				objStr += key+":"+JSON.stringify(_3PGFunc[key])+",";
			}
		}
		return objStr.replace(/,$/,'')+"};";
	}
	
	exports.testFunctions = function() {
		var key, args, funcStr, assignments;
		var ret = "";
		
		for( key in _3PGFunc ) {
			if( typeof _3PGFunc[key] == 'function' ) {
				funcStr = "\nCREATE OR REPLACE FUNCTION "+key+"(";
				
				args = getArguments(_3PGFunc[key]);
				
				// hack for variable input names
				assignments = "";
				for( var i = 0; i < args.length; i++ ) {
					if( args[i].replace(/\s/g,'').length > 0 ) {
						funcStr += "arg"+i+" NUMERIC, ";
						assignments += "var "+args[i].replace(/\s/g,'')+" = arg"+i+";\n";
					}
				}
				funcStr = funcStr.replace(/,\s$/,'')+") RETURNS\nNUMERIC AS $$\n";
				funcStr += assignments;
				funcStr += getBody(_3PGFunc[key])+"\n";
				ret += funcStr + "$$ LANGUAGE plv8 IMMUTABLE STRICT;\n";
			}
		}
		return ret;
	}
	
	function getArguments(f) {
		return f.toString().split("(")[1].split(")")[0].replace(/\s/,'').split(",");
	}
	
	function getBody(f) {
		var parts = f.toString().split(")");
		var body = parts[1];
		parts.splice(0,1);
		return parts.join(')').replace(/^\s*{/,'').replace(/}[\n\s]*$/,'');
	}
}