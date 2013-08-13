var m3PGFunc = {};

m3PGFunc.constant = function(c) {
//    log("constant:"+c);
    var constant={
	days_per_month:{
	    value:30.4,
	    units:"days/mo",
	    description:"Number of Days in an average month"
	},
	e20:{
	    value:2.2,
	    units:"vp/t",
	    description:"Rate of change of saturated VP with T at 20C"
	},
	rhoAir:{
	    value:1.2,
	    units:"kg/m^3",
	    description:"Density of air"
	},
	lambda:{
	    value:2460000,
	    units:"J/kg",
	    description:"Latent heat of vapourisation of h2o"
	},
	VPDconv:{
	    value:0.000622,
	    units:"?",
	    description:"Convert VPD to saturation deficit = 18/29/1000"
	},
	Qa:{
	    value:-90,
	    units:"W/m^2",
	    description:"Intercept of net radiation versus solar radiation relationship"
	},
	Qb:{
	    value:0.8,
	    units:"",
	    description:""
	},
	gDM_mol:{
	    value:24,
	    units:"g/mol(C)",
	    description:"Molecular weight of dry matter"
	},
	molPAR_MJ:{
	    value:2.3,
	    units:"mol(C)/MJ",
	    description:"Conversion of solar radiation to PAR"
	}
    };
    return constant[c].value;
}

/**Intcptn
units='unitless' 
description='Canopy Rainfall interception'
*/
m3PGFunc.Intcptn = function(MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if (LAImaxIntcptn<=0){
    return MaxIntcptn;    
  }else {
    return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn);
  }
}

/**ASW
units='mm' 
description='Available Soil Water'
*/
m3PGFunc.ASW = function(maxASW, prev_ASW, date_ppt, cur_Transp, cur_Intcptn, cur_Irrig){
  return Math.min(maxASW*10, Math.max(prev_ASW + date_ppt - (cur_Transp + cur_Intcptn * date_ppt) + cur_Irrig, 0));
}

//TODO: double check the appropriate use of tdmean (dew point temp)
//TODO: take constants out
/**VPD
units='kPA'
description='Mean vapor pressure deficit'
*/
m3PGFunc.VPD = function(date_tmin, date_tmax, date_tdmean){
  return (0.6108 / 2 * (Math.exp(date_tmin * 17.27 / (date_tmin + 237.3) ) + Math.exp(date_tmax * 17.27 / (date_tmax + 237.3) ) ) ) - (0.6108 * Math.exp(date_tdmean * 17.27 / (date_tdmean + 237.3) ) );
}


/**fVPD
units = unitless
description='Vapor Pressure Deficit Modifier (Poplar)'
*/
m3PGFunc.fVPD = function(kG, cur_VPD){
  return Math.exp(-1 * kG * cur_VPD); 
}

//TODO: take constants out
// make a meaningful tempvar name
/**fFrost
units = unitless
description = 'Number of Freeze Days Modifier'
*/
m3PGFunc.fFrost = function(date_tmin) {
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
m3PGFunc.fT = function(date_tmin, date_tmax, Tmin, Tmax, Topt){
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
m3PGFunc.Irrig = function(irrigFrac, cur_Transp, cur_Intcptn, date_ppt){
   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );
}


/**fAge
//TODO: recheck description
TODO: set nage=0 as a param in the model setup (like a checkbox)
units='unitless'
description='age modifier'
*/
m3PGFunc.fAge = function(prev_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (prev_StandAge / maxAge) / rAge) , nAge) ) );
  }
}

/**fSW
TODO: get units and description
*/
m3PGFunc.fSW = function(prev_ASW, maxAWS, swconst, swpower){
   return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (prev_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
}

/**fNutr
units='unitless' 
description='Nutritional Fraction, might be based on soil and fertilizer at some point'
*/
m3PGFunc.fNutr = function(fN0, FR){
  return fN0 + (1 - fN0) * FR;
}

/**PhysMod
TODO: why $3 in makefile - ask about it
units=unitless 
description='Physiological Modifier to conductance and APARu'
*/
m3PGFunc.PhysMod = function(cur_fVPD, cur_fSW, cur_fAge){
   return Math.min(cur_fVPD , cur_fSW) * cur_fAge;
}

/**LAI
units='m2/m2' 
description='Leaf Area Index'
*/
m3PGFunc.LAI = function(prev_WF, SLA1, SLA0, prev_StandAge, tSLA){
   return prev_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (prev_StandAge / tSLA) , 2) ) );
}

/**CanCond
units='gc,m/s' 
description='Canopy Conductance'
*/
m3PGFunc.CanCond = function(MaxCond, cur_PhysMod, cur_LAI, LAIgcx){
   return Math.max(0.0001 , MaxCond * cur_PhysMod * Math.min(1 , cur_LAI / LAIgcx) );
}

/**Transp
units='mm/mon' 
description='Canopy Monthly Transpiration'
*/
m3PGFunc.Transp = function(date_nrel, date_daylight, cur_VPD, BLcond, cur_CanCond, VPDconv, rhoAir, lambda, e20,days_per_month,Qa,Qb){
    VPDconv = typeof VPDconv !== 'undefined' ? VPDconv : m3PGFunc.constant('VPDconv');
    lambda = typeof lambda !== 'undefined' ? lambda : m3PGFunc.constant('lambda');
    rhoAir = typeof rhoAir !== 'undefined' ? rhoAir : m3PGFunc.constant('rhoAir');
    e20 = typeof e20 !== 'undefined' ? e20 : m3PGFunc.constant('e20');
    days_per_month = typeof days_per_month !== 'undefined' ? days_per_month : m3PGFunc.constant('days_per_month');
    Qa = typeof Qa !== 'undefined' ? Qa : m3PGFunc.constant('Qa');
    Qb = typeof Qb !== 'undefined' ? Qb : m3PGFunc.constant('Qb');
   return days_per_month * ( (e20 * (Qa + Qb * (date_nrel / date_daylight) ) + (rhoAir * lambda * VPDconv * cur_VPD * BLcond) ) / (1 + e20 + BLcond / cur_CanCond) ) * date_daylight * 3600 / lambda;
}

/**NPP
units='metric tons Dry Matter/ha' 
description - ? 
TODO: add description
*/
m3PGFunc.NPP = function(prev_StandAge, fullCanAge, xPP, k, prev_LAI, fVPD, fSW, fAge, alpha, fNutr, fT, fFrost){
  var CanCover = 1;
  if (prev_StandAge < fullCanAge){
    CanCover = prev_StandAge / fullCanAge;
  } //else CanCover = 1;
    // log("StandAge:"+prev_StandAge+
    // 	" fullCanAge:"+fullCanAge+
    // 	" xPP:"+xPP+
    // 	" k:"+k+
    // 	" LAI:"+prev_LAI+
    // 	" fVPD:"+fVPD+
    // 	" fSW:"+fSW+
    // 	" fAge:"+fAge+
    // 	" alpha:"+alpha+
    // 	" fNutr:"+fNutr+
    // 	" fT:"+fT+
    // 	" fFrost"+fFrost
    //    );
	

  return xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(fVPD , fSW) * fAge * alpha * fNutr * fT * fFrost;
}

/**litterfall
TODO: untis + definition
I'm not sure I believe the litterfall should be reset.  That means the root never gets old.
*/
m3PGFunc.litterfall = function(gammaFx, gammaF0, prev_StandAge, tgammaF, prev_lastCoppiceAge){
    prev_lastCoppiceAge = typeof prev_lastCoppiceAge !== 'undefined' ? 
	prev_lastCoppiceAge : 0;
  var prev_realStandAge = prev_StandAge - prev_lastCoppiceAge;
  //log("DEBUGGING COPPICE: prev_StandAge=" + prev_StandAge +"; prev_realStandAge=" + prev_realStandAge);
  return gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * prev_realStandAge / tgammaF) );
}

/**pS
TODO: units and description
*/
m3PGFunc.pS = function(prev_WS, StockingDensity, 
                      stemConst, stemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (prev_WS * 1000 / StockingDensity) / stemConst) , (1 / stemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
}

/**pR
TODO: units and description
*/
m3PGFunc.pR = function(pRx, pRn, cur_PhysMod, m0, FR){
  return (pRx * pRn) / (pRn + (pRx - pRn) * cur_PhysMod * (m0 + (1 - m0) * FR) );
}

/**pF
TODO: units and description
*/
m3PGFunc.pF = function(cur_pR, cur_pS){
  return 1 - cur_pR - cur_pS;
}

/**WF
units='t/ha' 
description='Foliage Biomass'
*/
m3PGFunc.WF = function(cur_pF, prev_WF, cur_NPP, cur_litterfall){
   return prev_WF + cur_NPP * cur_pF - cur_litterfall * prev_WF;
}

/**WR
units='t/ha' 
description='Root Biomass'
*/
m3PGFunc.WR = function(prev_WR, cur_NPP, cur_pR, Rttover){
   return prev_WR + cur_NPP * cur_pR - Rttover * prev_WR;
}

/**WS
units='t/ha' 
description='Stem Biomass'
*/
m3PGFunc.WS = function(prev_WS, cur_NPP, cur_pS){
   return prev_WS + cur_NPP * cur_pS;
} 

/**W
units='t/ha' 
description='Tree Biomass'
*/
m3PGFunc.W = function(cur_WF, cur_WR, cur_WS){
  return cur_WF + cur_WR + cur_WS;
}

/**StandAge
TODO: units and description
*/
m3PGFunc.StandAge = function(prev_StandAge){
  return prev_StandAge + 1.0/12;
}


/*** FUNCTIONS FROM ANOTHER MAKEFILE solar.mk in alder:/home/quinn/qjhart.postgis-data/m3pg$ cat solar.mk */

/**PAR
TODO: mols or mols per m^2?
units=mols 
description='Monthly PAR in mols / m^2 month' 
molPAR_MJ [mol/MJ] is a constant Conversion of solar radiation to PAR
*/
m3PGFunc.PAR = function(date_rad, molPAR_MJ){
    molPAR_MJ = typeof molPAR_MJ !== 'undefined' ? 
	molPAR_MJ : m3PGFunc.constant('molPAR_MJ');
    return date_rad * m3PGFunc.constant('days_per_month') * molPAR_MJ;
}

/**xPP
units='metric tons Dry Matter/ha' 
description='maximum potential Primary Production [tDM / ha month]
NOTE: 10000/10^6 [ha/m2][tDm/gDM] 
gGM_mol [g/mol] is the molecular weight of dry matter
*/
m3PGFunc.xPP = function(y, cur_PAR, gDM_mol){
    gDM_mol = typeof gDM_mol !== 'undefined' ? 
	gDM_mol : m3PGFunc.constant('gDM_mol');
    return y * cur_PAR * gDM_mol / 100;
}
      
/*** FUNCTIONS FOR COPPICING */
m3PGFunc.coppice = {};

// Coppice Functions are based on Diameter on Stump, NOT DBH.
m3PGFunc.coppice.pfs = function(prev_WS,StockingDensity, stemsPerStump, stemConst, stemPower, pfsConst, pfsPower,pfsMax) {
  var avDOB = Math.pow( ( (prev_WS * 1000 / StockingDensity / stemsPerStump) / stemConst) , (1 / stemPower) );
  var ppfs= pfsConst * Math.pow(avDOB , pfsPower);
//    log("avDOB:"+avDOB+"ppfs:"+ppfs);
  return Math.min(pfsMax,ppfs);
}

m3PGFunc.coppice.pS = function(cur_pR,pfs) {
  return (1 - cur_pR) / (1 + pfs );
}

m3PGFunc.coppice.pF = function(cur_pR,pfs) {
    return (1 - cur_pR) / (1 + 1/pfs );
}

m3PGFunc.coppice.RootP = function(cur_npp, cur_nppTarget, WR,W,pRx,rootStoragePct) {
  var nppRes = cur_nppTarget - cur_npp;
//  log("nppRes=" + nppRes);
  var rootPP;
  if (nppRes > 0) {
//      log("WR:"+WR+"W:"+W+"pRx:"+pRx+"rootStoragePct:"+rootStoragePct);
    rootPP = Math.min(nppRes,WR*(WR/W - pRx)*rootStoragePct);
  } else {
    rootPP = 0; 
 }
//    log("RootP"+rootPP);
  return rootPP;
}

/**WR
units='t/ha' 
description='Root Biomass'
*/
m3PGFunc.coppice.WR = function(prev_WR, cur_NPP, cur_pR, Rttover,RootP){
  //log("DEBUGGING COPPICE: prev_WR=" + prev_WR + "; cur_NPP=" + cur_NPP + "; cur_pR=" + cur_pR + "; Rttover=" + Rttover+ "; RootP=" + RootP);
   return prev_WR, prev_WR + cur_NPP * cur_pR - Rttover * prev_WR - RootP;
}


// NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var objStr = "m3PGFunc={";
		for( var key in m3PGFunc ) {
			if( typeof m3PGFunc[key] == 'function' ) {
				objStr += key+":"+m3PGFunc[key].toString()+",";
			} else {
				objStr += key+":"+JSON.stringify(m3PGFunc[key])+",";
			}
		}
		return objStr.replace(/,$/,'')+"};";
	}
	
	exports.testFunctions = function() {
		var key, args, funcStr, assignments;
		var ret = "";
		
		for( key in m3PGFunc ) {
			if( typeof m3PGFunc[key] == 'function' ) {
				funcStr = "\nCREATE OR REPLACE FUNCTION "+key+"(";
				
				args = getArguments(m3PGFunc[key]);
				
				for( var i = 0; i < args.length; i++ ) {
					if( args[i].replace(/\s/g,'').length > 0 ) {
						funcStr += "\""+args[i].replace(/\s/g,'')+"\" float, ";
					}
				}
				funcStr = funcStr.replace(/,\s$/,'')+") RETURNS\nfloat AS $$\n";
				funcStr += getBody(m3PGFunc[key])+"\n";
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
