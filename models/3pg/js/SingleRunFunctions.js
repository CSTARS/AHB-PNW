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

/** Time Dependant Parameter
units='various'
description='This function creates a time dependant function that decays 
(or rises from f0 to f1.  The value (f0+f1)/2 is reached at tm, 
and the slope of the line at tm is given by p.
**/
m3PGFunc.tdp = function(x,f) {
  var p=f.f1 + (f.f0-f.f1)*Math.exp(-Math.log(2)*Math.pow((x/f.tm),f.n));
//  log("f("+x+";f0,f1,tm,n)="+p+";"+f.f0+","+f.f1+","+f.tm+","+f.n);
  return p;
}

m3PGFunc.lin = function(x, p){
    if (x<0) {
	return p.mn;
    }
    if (x>p.xmax) {
	return p.xmax;
    }
    return p.mn + (p.mx-p.mn)*(x/p.xmax);
}

/**Intcptn
units='unitless' 
description='Canopy Rainfall interception'
*/
m3PGFunc.Intcptn = function(cur_LAI, c){
    return Math.max(c.mn,c.mn + (c.mx - c.mn) * Math.min(1 , cur_LAI / c.lai));
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
m3PGFunc.fT = function(tavg, fT){
    var f;
  if (tavg <= fT.mn || tavg >= fT.mx){
     f=0;
  }else {
     f = ( (tavg - fT.mn) / (fT.opt - fT.mn) )  *  
             Math.pow ( ( (fT.mx - tavg) / (fT.mx - fT.opt) ), 
                        ( (fT.mx - fT.opt) / (fT.opt - fT.mn) ) 
                      );
  }
//  log("fT(x):mn,opt,mx=f:fT("+tavg+"):"+fT.mn+","+fT.opt+","+fT.mx+"="+f);
    return(f);
}

/**Irrig
units='mm/mon'
description='Required Irrigation'
*/
m3PGFunc.Irrig = function(irrigFrac, cur_Transp, cur_Intcptn, date_ppt){
   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );
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

/**CanCond
units='gc,m/s' 
description='Canopy Conductance'
*/
m3PGFunc.CanCond = function(cur_PhysMod, cur_LAI, cond){
   return Math.max(cond.mn , cond.mx * cur_PhysMod * Math.min(1 , cur_LAI / cond.lai) );
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
  } 

  return xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(fVPD , fSW) * fAge * alpha * fNutr * fT * fFrost;
}

/**pR
TODO: units and description
*/
m3PGFunc.pR = function(cur_PhysMod, FR,pR){
  return (pR.mx * pR.mn) / 
         (pR.mn + (pR.mx - pR.mn) * cur_PhysMod * (pR.m0 + (1 - pR.m0) * FR) );
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
// Calculates the pfs based on the stem weight in KG
m3PGFunc.coppice.pfs = function(stem, p) {
  var avDOB = Math.pow( ( stem / p.stemCnt / p.stemC) , (1 / p.stemP) );
    var ppfs= p.pfsC * Math.pow(avDOB , p.pfsP);
//    log("avDOB:"+avDOB+"ppfs:"+ppfs);
  return Math.min(p.pfsMx,ppfs);
}
m3PGFunc.coppice.RootP = function(cur_npp, cur_nppTarget, WR,W,pRx,frac) {
  var nppRes = cur_nppTarget - cur_npp;
  var rootPP;
  if (nppRes > 0 && WR/W > pRx ) {
//      log(nppRes+"<"+WR*(WR/W - pRx)+"*"+frac);
      rootPP = Math.min(nppRes,WR*(WR/W - pRx)*frac);
  } else {
    rootPP = 0; 
 }
  return rootPP;
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
