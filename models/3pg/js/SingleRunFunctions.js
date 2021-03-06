/**

@module 3PG Module
**/


/**
Class for all the functions that run in a single step of the model

@class m3PGFunc 
**/
var m3PGFunc = {};

/**
list of constants used for computations

@attribute constant
**/
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
        units:"unitless",
        description:"slope of net vs. solar radiation relationship"
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

/**
Time Dependant Attribute,
units='various',
description='This function creates a time dependant function that decays 
(or rises from f0 to f1.  The value (f0+f1)/2 is reached at tm, 
and the slope of the line at tm is given by p.
@method tdp
@param x
@param f
**/
m3PGFunc.tdp = function(x,f) {
  var p=f.f1 + (f.f0-f.f1)*Math.exp(-Math.log(2)*Math.pow((x/f.tm),f.n));
//  log("f("+x+";f0,f1,tm,n)="+p+";"+f.f0+","+f.f1+","+f.tm+","+f.n);
  return p;
}

/**
@method lin
@param x
@param p
*/
m3PGFunc.lin = function(x, p){
    if (x<0) {
	return p.mn;
    }
    if (x>p.xmax) {
	return p.xmax;
    }
    return p.mn + (p.mx-p.mn)*(x/p.xmax);
}

/**
units='unitless', 
description='Canopy Rainfall interception'
@method Intcptn
@param cur_LAI
@param c
*/
m3PGFunc.Intcptn = function(cur_LAI, c){
    return Math.max(c.mn,c.mn + (c.mx - c.mn) * Math.min(1 , cur_LAI / c.lai));
}

/**
units='mm', 
description='Available Soil Water'
@method ASW
@param maxASW
@param prev_ASW
@param date_ppt
@param cur_Transp
@param cur_Intcptn
@param cur_Irrig
*/
m3PGFunc.ASW = function(maxASW, prev_ASW, date_ppt, cur_Transp, cur_Intcptn, cur_Irrig){
  return Math.min(maxASW*10, Math.max(prev_ASW + date_ppt - (cur_Transp + cur_Intcptn * date_ppt) + cur_Irrig, 0));
}

//TODO: double check the appropriate use of tdmean (dew point temp)
//TODO: take constants out
/**
units='kPA',
description='Mean vapor pressure deficit'
@method VPD
@param date_tmin
@param date_tmax
@param date_tdmean
*/
m3PGFunc.VPD = function(date_tmin, date_tmax, date_tdmean){
  return (0.6108 / 2 * (Math.exp(date_tmin * 17.27 / (date_tmin + 237.3) ) + Math.exp(date_tmax * 17.27 / (date_tmax + 237.3) ) ) ) - (0.6108 * Math.exp(date_tdmean * 17.27 / (date_tdmean + 237.3) ) );
}


/**
units = unitless,
description='Vapor Pressure Deficit Modifier (Poplar)'
@method fVPD
@param kG
@param cur_VPD
*/
m3PGFunc.fVPD = function(kG, cur_VPD){
 return Math.exp(-1 * kG * cur_VPD); 
}

//TODO: take constants out
// make a meaningful tempvar name
/**
units = unitless,
description = 'Number of Freeze Days Modifier'
@method fFrost
@param date_tmin
*/
m3PGFunc.fFrost = function(date_tmin) {
  var tempVar = -1.0;
  if (date_tmin >= 0){
    tempVar = 1.0;
  } //else -1.0
  
  return 0.5 * (1.0 + tempVar * Math.sqrt(1 - Math.exp(-1 * Math.pow((0.17 * date_tmin) , 2) * (4 / 3.14159 + 0.14 * Math.pow( (0.17 * date_tmin) , 2) ) / (1 + 0.14 * Math.pow((0.17 * date_tmin) , 2) ) ) ) ); 
}

//TODO - better naming?: tmin, tmax = weather Topt, Tmax, Tmin = tree params
/**
units=unitless,
description='Temperature modifier'
@method fT
@param tavg
@param fT
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

/**
units='mm/mon',
description='Required Irrigation'
@method Irrig
@param irrigFrac
@param cur_Transp
@param cur_Intcptn
@param date_ppt
*/
m3PGFunc.Irrig = function(irrigFrac, cur_Transp, cur_Intcptn, date_ppt){
   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );
}

//TODO: get units and description
/**
@method fSW
@param ASW
@param maxAWS
@param swconst
@param swpower
*/
m3PGFunc.fSW = function(ASW, maxAWS, swconst, swpower) {
    var fSW;
    if (swconst == 0 || maxAWS==0) {
	fSW=0;
    } else {
	var omr = 1 - (ASW/10)/maxAWS; // One Minus Ratio
	if (omr < 0.001) {
	    fSW=1;
	} else {
	    fSW=(1-Math.pow(omr,swpower))/(1+Math.pow(omr/swconst,swpower));
	}
    }
//    log('f(ASW,max,S_c,S_p),omr=f('+ASW+','+maxAWS+','+swconst+','+swpower+')='+omr+','+fSW);
    return fSW;
}

/**
units='unitless', 
description='Nutritional Fraction, might be based on soil and fertilizer at some point'
@method fNutr
@param fN0
@param FR
*/
m3PGFunc.fNutr = function(fN0, FR){
  return fN0 + (1 - fN0) * FR;
}

/**
TODO: why $3 in makefile - ask about it
units=unitless 
description='Physiological Modifier to conductance and APARu'
@method PhysMod
@param cur_fVPD
@param cur_fSW
@param cur_fAge
*/
m3PGFunc.PhysMod = function(cur_fVPD, cur_fSW, cur_fAge){
   return Math.min(cur_fVPD , cur_fSW) * cur_fAge;
}

/**
units='gc,m/s', 
description='Canopy Conductance'
@method CanCond
@param PhysMod
@param LAI
@param cond
*/
m3PGFunc.CanCond = function(PhysMod, LAI, cond){
   return Math.max(cond.mn , cond.mx * PhysMod * Math.min(1 , LAI / cond.lai) );
}

/**
units='mm/mon' which is also kg/m2/mon
description='Canopy Monthly Transpiration'
@method Transp
@param date_nrel
@param date_daylight
@param cur_VPD
@param BLcond
@param cur_CanCond
@param days_per_month
*/
m3PGFunc.Transp = function(date_nrel, date_daylight, cur_VPD, BLcond, cur_CanCond, days_per_month){
    var VPDconv = m3PGFunc.constant('VPDconv');
    var lambda = m3PGFunc.constant('lambda');
    var rhoAir = m3PGFunc.constant('rhoAir');
    var e20 = m3PGFunc.constant('e20');
    var Qa = m3PGFunc.constant('Qa');
    var Qb = m3PGFunc.constant('Qb');
    var days_per_month = typeof days_per_month !== 'undefined' ? days_per_month : m3PGFunc.constant('days_per_month');

//    netrad=-90 + 0.8 * (date_nrel * 277.778 / date_daylight);
//    defTerm= 1.2 * 2460000 * 0.00622 * cur_VPD * 0.2);
//    div = (1 + 2.2 + 0.2 / CanCond;
//    transp 30.4 * ((2.2 * netrad + defTerm) / div) * date_daylight * 3600 / 2460000  
    // date_daylight = hours
    // nrel is in MJ/m^2/day convert to Wh/m^2/day
   var netRad = Qa + Qb * ((date_nrel * 277.778) / date_daylight);
    var defTerm = rhoAir * lambda * VPDconv * cur_VPD * BLcond;
    var div = 1 + e20 + BLcond / cur_CanCond;
    // Convert daylight to secs.
    var Transp=  days_per_month * ( (e20 * netRad + defTerm ) / div ) * date_daylight * 3600 / lambda;
//    log('R+V/D='+e20*netRad+'+'+defTerm+'/'+div)
//    log('f(nrel,daylight,VPD,BL,cond): f('+date_nrel+','+date_daylight+','+cur_VPD+','+BLcond+','+cur_CanCond+')='+Transp);
    return Transp;
}

//TODO: description
/**
units='metric tons Dry Matter/ha', 
@method NPP
@param prev_StandAge
@param fullCanAge
@param xPP
@param k
@param prev_LAI
@param fVPD
@param fSW
@param fAge
@param alpha
@param fNutr
@param fT
@param fFrost
*/
m3PGFunc.NPP = function(prev_StandAge, fullCanAge, xPP, k, prev_LAI, fVPD, fSW, fAge, alpha, fNutr, fT, fFrost){
  var CanCover = 1;
  if (prev_StandAge < fullCanAge){
    CanCover = prev_StandAge / fullCanAge;
  } 

  return xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(fVPD , fSW) * fAge * alpha * fNutr * fT * fFrost;
}

//TODO: units and description
/**
@method pR
@param cur_PhysMod
@param cur_pR
@param FR
@param pR
*/
m3PGFunc.pR = function(cur_PhysMod, cur_pR,FR,pR){
    var p =(pR.mx * pR.mn) / 
         (pR.mn + (pR.mx - pR.mn) * cur_PhysMod * (pR.m0 + (1 - pR.m0) * FR) );
// This was added by quinn to limit root growth.
    return p*Math.pow(p/cur_pR,2);
}


//TODO: mols or mols per m^2?
/**
units=mols 
description='Monthly PAR in mols / m^2 month' 
molPAR_MJ [mol/MJ] is a constant Conversion of solar radiation to PAR
@method PAR
@param date_rad
@param molPAR_MJ
*/
m3PGFunc.PAR = function(date_rad, molPAR_MJ){
    var molPAR_MJ = typeof molPAR_MJ !== 'undefined' ? 
                    molPAR_MJ : m3PGFunc.constant('molPAR_MJ');
    return date_rad * m3PGFunc.constant('days_per_month') * molPAR_MJ;
}

/**
units='metric tons Dry Matter/ha', 
description='maximum potential Primary Production [tDM / ha month],
NOTE: 10000/10^6 [ha/m2][tDm/gDM] 
gGM_mol [g/mol] is the molecular weight of dry matter
@method xPP
@param y
@param cur_PAR
@param gDM_mol
*/
m3PGFunc.xPP = function(y, cur_PAR, gDM_mol){
    gDM_mol = typeof gDM_mol !== 'undefined' ? 
    gDM_mol : m3PGFunc.constant('gDM_mol');
    return y * cur_PAR * gDM_mol / 100;
}
      
/*** FUNCTIONS FOR COPPICING */
/**
coppice related functions
@method coppice
*/
m3PGFunc.coppice = {};

// Coppice Functions are based on Diameter on Stump, NOT DBH.
// Calculates the pfs based on the stem weight in KG
m3PGFunc.coppice.pfs = function(stem, p) {
//    log(" Math.pow( ( "+stem+" / "+p.stemCnt+" / "+p.stemC+") , (1 / "+p.stemP+") )");
  var avDOB = Math.pow( ( stem / p.stemCnt / p.stemC) , (1 / p.stemP) );
    var ppfs= p.pfsC * Math.pow(avDOB , p.pfsP);
//    log("stem:"+stem+" avDOB:"+avDOB+" ppfs:"+ppfs);
  return Math.min(p.pfsMx,ppfs);
}

// Calculates the pfs based on stem with in G.  Uses volume Index as guide
m3PGFunc.coppice.pfs_via_VI = function (stemG,wsVI,laVI,SLA) {
    if (stemG < 10) {
	stemG=10;
    }
    var VI = Math.pow( (stemG / wsVI.stems_per_stump / wsVI.constant),(1 / wsVI.power) );
//    log(VI+" = Math.pow( ("+stemG+" / "+wsVI.stems_per_stump+" / "+wsVI.constant+"),(1 / "+wsVI.power+") )");
    // Add up for all stems
    var la = laVI.constant * Math.pow(VI,laVI.power) * wsVI.stems_per_stump;
//    log( la+" = "+laVI.constant+" * Math.pow("+VI,laVI.power+")");
    var wf = 1000 * (la / SLA);  // Foilage Weight in g;
//    log(wf+" = 1000 * ("+la+" / "+SLA+")");  // Foilage Weight in g;
    var pfs = wf/stemG;
//    log(pfs+" = "+wf+"/"+stemG);
    return pfs;
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
