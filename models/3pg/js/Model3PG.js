/**


NOTE:  litterfall modified to account for stand age after coppicing

+ root max is chosen (not to let it drop) 

lengthOfGrowth is in months
*/

var m3PG = {
	
	run : function(lengthOfGrowth) {
		  //work with offsets and weather data later
		  
		  var isCoppiced = false;
		  var willCoppice = false;
		  var yearToCoppice;
		  var coppiceInterval;
		  var monthToCoppice;
		  //Global Variables Array
		  
		  var g = {};
		  m3PGIO.readAllConstants(g); //global variables are an array of key-value pairs. INCLUDES SOIL DEPENDENT ONES - Separate?
		 
		  //calculate fNutr and add here;
		  g.fNutr=m3PGFunc.fNutr(g.fN0, g.FR);
		  
		  var weatherMap = {};
		  var s = {}; //soilMap
		  var dateMap = {};
		  m3PGIO.readWeather(weatherMap, s, dateMap);
		  
		  var currentDate = dateMap["datePlanted"];
		  
		  var plantedMonth = currentDate.getMonth();
		  var currentMonth = currentDate.getMonth();
		  
		  if (dateMap["dateCoppiced"] != undefined){
		    yearToCoppice = dateMap["dateCoppiced"].getYear();
		    monthToCoppice = dateMap["dateCoppiced"].getMonth();
		    coppiceInterval = dateMap["yearsPerCoppice"];
		    willCoppice = true;
		  }
		  
		  log("Month of Planting = " + currentMonth);
		  
		  var step = 0;
		  
		  var d = weatherMap[currentMonth];
		  
		  log(d);
		  
		  var keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS", "W"];    

		  m3PG.runCurrentSetup(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap)
		  
		  //init all - will be p,
		  //then each step returned from singleStep will be p to feed back into
		  //Weather?
	},
	
	runCurrentSetup: function(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap){
	    
        var firstMonthResults = m3PG.init(g,d,s);
        firstMonthResults.Date = (currentDate.getMonth()+1) + "/" + currentDate.getYear();
        
        var rows = []; //these will become rows
        
        log("Results of the first month: " +firstMonthResults);
        
        rows.push(keysInOrder);
        
        var firstRow = [];
        for (var i = 0; i < keysInOrder.length; i++){
          var key = keysInOrder[i];
          log(key  + ": " + firstMonthResults[key]);
          firstRow.push(firstMonthResults[key]);
        }
        
        rows.push(firstRow);

        var currentMonthResults = firstMonthResults;
        currentMonthResults.lastCoppiceAge = 0;
        var nextMonthResults;
        
        for (var step = 1; step < lengthOfGrowth; step++){
          currentDate.setMonth(currentDate.getMonth() + 1); // add a month to current date
          log("currentDate = " + currentDate);
          currentMonth = currentDate.getMonth();
          
          //If curretn year is the year of coppice, cut the tree (redestribute the weight)
          //set coppicing flag to true
          //use coppicing functions
          log("if ("+willCoppice+" && "+currentDate.getYear()+"=="+yearToCoppice+" && "+currentMonth+" == monthToCoppice)");
          if (willCoppice && currentDate.getYear()==yearToCoppice && currentMonth == monthToCoppice){
            log("Time to Coppice!");
            //TODO: update trees
            
            if (isCoppiced == false) {
              //first time coppice
              //Important function name changes for the first coppice
              currentMonthResults.coppice_WR = currentMonthResults.WR;
            }
            
            isCoppiced = true; //growth model changes
            currentMonthResults.WS = 1.3; //no stem
            currentMonthResults.WF = 2.4; //no foliage
            currentMonthResults.lastCoppiceAge = currentMonthResults.StandAge;
            //currentMonthResults.StandAge = 0; //the age of stand is 1 month?
            yearToCoppice = yearToCoppice + coppiceInterval; //next coppice year
            //key Headers change
            keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","coppice_pS","litterfall","coppice_NPP","WF","coppice_WR","WS", "W"];    
            rows.push(keysInOrder);
          } 
          

          d = weatherMap[currentMonth]; //increment the month
          nextMonthResults = this.singleStep(g,currentMonthResults,d,s, isCoppiced);
          nextMonthResults.Date = (currentDate.getMonth()+1)  + "/" + currentDate.getYear();
          log("\n Results of the next month: " + nextMonthResults);
          var thisRow = [];
          for (var i = 0; i < keysInOrder.length; i++) {
            var key = keysInOrder[i];
            log( key  + ": " + nextMonthResults[key]);
            thisRow.push(nextMonthResults[key]);
          } 
          currentMonthResults = nextMonthResults;
          rows.push(thisRow);
          
        }
        
        m3PGIO.dump(rows);
        
        return rows;
	},
	
	init : function(g,d,s) {
		  var c = {};
		  c.StandAge = m3PGFunc.init_StandAge();
		  //note: change in order
		  c.WF = m3PGFunc.init_WF(g.StockingDensity, g.SeedlingMass);
		  c.WR = m3PGFunc.init_WR(g.StockingDensity, g.SeedlingMass);
		  c.WS = m3PGFunc.init_WS(g.StockingDensity, g.SeedlingMass);
		  
		  c.LAI = m3PGFunc.init_LAI(c.WF, g.SLA1, g.SLA0, c.StandAge, g.tSLA);
		  c.VPD = m3PGFunc.VPD(d.tmin, d.tmax, d.tdmean);
		  c.fVPD = m3PGFunc.fVPD(g.kG, c.VPD);
		  
		  //note: the order of var changes here. ASW calsulated before fsw TODO: double check this behavior
		  c.ASW = m3PGFunc.init_ASW(s.maxAWS);
		  c.fSW = m3PGFunc.init_fSW(c.ASW, s.maxAWS, s.swconst, s.swpower);
		  c.fAge = m3PGFunc.fAge(c.StandAge, g.maxAge, g.rAge, g.nAge);
		  c.fFrost = m3PGFunc.fFrost(d.tmin);
		  c.PAR = m3PGFunc.PAR(d.rad, g.molPAR_MJ);
		  c.xPP = m3PGFunc.xPP(g.y, c.PAR, g.gDM_mol);
		  c.PhysMod = m3PGFunc.PhysMod(c.fVPD, c.fSW, c.fAge);
		  c.Intcptn = m3PGFunc.init_Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
		  c.CanCond = m3PGFunc.CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
		  c.pR = m3PGFunc.pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);
		  log("DEBUGGIN: tmin= " + d.tmin + "; tmax=" + d.tmax + "; Tmin=" + g.Tmin + "; Tmax=" + g.Tmax + "; Topt= " + g.Topt);
		  c.fT = m3PGFunc.fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
		  c.NPP = m3PGFunc.init_NPP(c.StandAge, g.fullCanAge, c.xPP, g.k, c.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
		  c.litterfall = m3PGFunc.init_litterfall(g.gammaFx, g.gammaF0, c.StandAge, g.tgammaF);
		  c.Transp = 0; // TODO: is it the correct default value?
		 
		  c.pS = m3PGFunc.init_pS(c.WS, g.StockingDensity, g.StemConst, g.StemPower, c.pR, g.pfsConst, g.pfsPower);
		  c.Irrig = m3PGFunc.Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
		  c.CumIrrig = m3PGFunc.init_CumIrrig();
		  
		  c.W = m3PGFunc.W(c.WF, c.WR, c.WS);
		  return c;
		
	},
	
	singleStep : function(g,p,d,s,isCoppiced){
		  log("isCoppiced? = " + isCoppiced);
		  if (isCoppiced) {
		    return this.singleStepCoppiced(g,p,d,s);
		  } else {
		    return this.singleStepSincePlanting(g,p,d,s);
		  }
	},
	
	singleStepCoppiced : function(g,p,d,s){
		  var c = new Object();
		  c.StandAge = m3PGFunc.StandAge(p.StandAge);
		  c.LAI = m3PGFunc.LAI(p.WF, g.SLA1, g.SLA0, p.StandAge, g.tSLA);
		  c.VPD = m3PGFunc.VPD(d.tmin, d.tmax, d.tdmean);
		  c.fVPD = m3PGFunc.fVPD(g.kG, c.VPD);
		  
		  c.fSW = m3PGFunc.fSW(p.ASW, s.maxAWS, s.swconst, s.swpower);
		  c.fAge = m3PGFunc.fAge(p.StandAge, g.maxAge, g.rAge, g.nAge);
		  c.fFrost = m3PGFunc.fFrost(d.tmin);
		  c.PAR = m3PGFunc.PAR(d.rad, g.molPAR_MJ);
		  c.fT = m3PGFunc.fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
		  c.xPP = m3PGFunc.xPP(g.y, c.PAR, g.gDM_mol);
		  
		  
		 // c.coppice_RootPP = coppice_RootPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost,p.WR,p.W,g.pRx,g.cpRootStoragePct,g.cpRootLAITarget);

		  c.PhysMod = m3PGFunc.PhysMod(c.fVPD, c.fSW, c.fAge);
		  
		  c.NPP_regular = m3PGFunc.NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
		   log("c.NPP_regular=" + c.NPP_regular);
		  c.NPP_target = m3PGFunc.NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, g.cpRootLAITarget, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
		   log("c.NPP_target=" + c.NPP_target);
		  
		  c.coppice_RootPP = m3PGFunc.coppice_RootPP(c.NPP_regular, c.NPP_target, p.coppice_WR, p.W,g.pRx,g.cpRootStoragePct,g.cpRootLAITarget);
		  log("c.coppice_RootPP=" + c.coppice_RootPP);
		  c.coppice_pfs = m3PGFunc.coppice_pfs(p.WS,g.StockingDensity, g.cpStemsPerStump, g.cpStemConst, g.cpStemPower, g.cpPfsConst, g.cpPfsPower, g.cpMaxPfs);
		  c.coppice_NPP = m3PGFunc.coppice_NPP(c.NPP_regular,c.coppice_RootPP);
		  
		  c.Intcptn = m3PGFunc.Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
		  c.CanCond = m3PGFunc.CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
		  
		  c.pR = m3PGFunc.pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);

		  c.litterfall = m3PGFunc.litterfall(g.gammaFx, g.gammaF0, p.StandAge, g.tgammaF, p.lastCoppiceAge);
		  
		  //log("g.days_per_mon=" + g.days_per_mon + " g.e20=" + g.e20 + " g.Qa=" + g.Qa + " g.Qb=" + g.Qb + " d.nrel=" + d.nrel + " d.daylight=" + d.daylight + " g.rhoAir=" + g.rhoAir + " g.lambda=" + g.lambda + " g.VPDconv=" + g.VPDconv + " c.VPD=" + c.VPD + " g.BLcond=" + g.BLcond + " c.CanCond=" + c.CanCond);
		  c.Transp = m3PGFunc.Transp(g.days_per_mon, g.e20, g.Qa, g.Qb, d.nrel, d.daylight, g.rhoAir, g.lambda, g.VPDconv, c.VPD, g.BLcond, c.CanCond);
		  
		  c.coppice_pS = m3PGFunc.coppice_pS(c.pR,c.coppice_pfs);
		  c.coppice_pF = m3PGFunc.coppice_pF(c.pR,c.coppice_pfs);
		  
		  c.Irrig = m3PGFunc.Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
		  c.CumIrrig = m3PGFunc.CumIrrig(p.CumIrrig, c.Irrig);
		  
		  c.ASW = m3PGFunc.ASW(s.maxAWS, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxAWS
		  
		  log("c.pR=" + c.pR + " c.coppice_pS=" + c.coppice_pS + " p.WF=" + p.WF + " c.litterfall=" + c.litterfall);
		  c.WF = m3PGFunc.WF(c.pR, p.WF, c.coppice_NPP, c.litterfall);
		  
		  log("p.coppice_WR=" + p.coppice_WR + " c.coppice_NPP=" + c.coppice_NPP + " c.pR=" + c.pR + " g.RttoverP=" + g.Rttover);
		  c.coppice_WR = m3PGFunc.coppice_WR(p.coppice_WR, c.coppice_NPP, c.pR, g.Rttover, c.coppice_RootPP);
		  c.WS = m3PGFunc.WS(p.WS, c.coppice_NPP, c.coppice_pS);
		  c.W = m3PGFunc.W(c.WF, c.coppice_WR, c.WS);
		  c.lastCoppiceAge = p.lastCoppiceAge;
		  return c;
	},
	
	singleStepSincePlanting : function(g,p,d,s){
		  var c = new Object();
		  c.StandAge = m3PGFunc.StandAge(p.StandAge);
		  c.LAI = m3PGFunc.LAI(p.WF, g.SLA1, g.SLA0, p.StandAge, g.tSLA);
		  c.VPD = m3PGFunc.VPD(d.tmin, d.tmax, d.tdmean);
		  c.fVPD = m3PGFunc.fVPD(g.kG, c.VPD);
		  
		  c.fSW = m3PGFunc.fSW(p.ASW, s.maxAWS, s.swconst, s.swpower);
		  c.fAge = m3PGFunc.fAge(p.StandAge, g.maxAge, g.rAge, g.nAge);
		  c.fFrost = m3PGFunc.fFrost(d.tmin);
		  c.PAR = m3PGFunc.PAR(d.rad, g.molPAR_MJ);
		  
		  c.xPP = m3PGFunc.xPP(g.y, c.PAR, g.gDM_mol);
		  c.PhysMod = m3PGFunc.PhysMod(c.fVPD, c.fSW, c.fAge);
		  c.Intcptn = m3PGFunc.Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
		  c.CanCond = m3PGFunc.CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
		  
		  c.pR = m3PGFunc.pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);
		  c.fT = m3PGFunc.fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
		  c.NPP = m3PGFunc.NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
		  c.litterfall = m3PGFunc.litterfall(g.gammaFx, g.gammaF0, p.StandAge, g.tgammaF, p.lastCoppiceAge);
		    
		  log("g.days_per_mon=" + g.days_per_mon + " g.e20=" + g.e20 + " g.Qa=" + g.Qa + " g.Qb=" + g.Qb + " d.nrel=" + d.nrel + " d.daylight=" + d.daylight + " g.rhoAir=" + g.rhoAir + " g.lambda=" + g.lambda + " g.VPDconv=" + g.VPDconv + " c.VPD=" + c.VPD + " g.BLcond=" + g.BLcond + " c.CanCond=" + c.CanCond);
		  c.Transp = m3PGFunc.Transp(g.days_per_mon, g.e20, g.Qa, g.Qb, d.nrel, d.daylight, g.rhoAir, g.lambda, g.VPDconv, c.VPD, g.BLcond, c.CanCond);
		  c.pS = m3PGFunc.pS(p.WS, g.StockingDensity, g.StemConst, g.StemPower, c.pR, g.pfsConst, g.pfsPower);
		  c.pF = m3PGFunc.pF(c.pR, c.pS);
		  
		  log("DEBUGGIN: irrigFrac= " + g.irrigFrac + "; Transp=" + c.Transp + "; c.Intcptn=" + c.Intcptn + "; d.ppt=" + d.ppt);
		  c.Irrig = m3PGFunc.Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
		  c.CumIrrig = m3PGFunc.CumIrrig(p.CumIrrig, c.Irrig);
		  
		  log("DEBUGGIN: maxAWS= " + s.maxAWS + "; ASW=" + p.ASW + "; d.ppt=" + d.ppt + "; c.Transp=" + c.Transp + "; c.Intcptn= " + c.Intcptn + "; c.Irrig= " + c.Irrig);
		  c.ASW = m3PGFunc.ASW(s.maxAWS, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxAWS
		  c.WF = m3PGFunc.WF(c.pF, p.WF, c.NPP, c.litterfall);
		  c.WR = m3PGFunc.WR(p.WR, c.NPP, c.pR, g.Rttover);
		  c.WS = m3PGFunc.WS(p.WS, c.NPP, c.pS);
		  c.W = m3PGFunc.W(c.WF, c.WR, c.WS);
		  c.lastCoppiceAge = p.lastCoppiceAge;
		  return c;
	},
	
	
	
	
}

function env() {
	if( typeof plv8 !== 'undefined' ) return "plv8";
	if( typeof Logger !== 'undefined' ) return "appscript";
	if( typeof module !== 'undefined' && module.exports) return "node";
}


function log(msg) {
	if( env() == "plv8" ) plv8.elog(NOTICE, 'notice', msg);
	if( env() == "appscript" ) Logger.log(msg);
}

//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var objStr = "m3PG={";
		for( var key in m3PG ) {
			if( typeof m3PG[key] == 'function' ) {
				objStr += key+":"+m3PG[key].toString()+",";
			} else {
				objStr += key+":"+JSON.stringify(m3PG[key])+",";
			}
		}
		return objStr.replace(/,$/,'')+"};";
	}
}
