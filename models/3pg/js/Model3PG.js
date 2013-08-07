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
    
    var reprintHeaders = true; //print headers at coppice time (to help see that row)
    var runCoppicedVersion = false; //this variable at the moment is only used in running test setup
    m3PG.runCurrentSetup(runCoppicedVersion,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap,reprintHeaders)
    
    //init all - will be p,
    //then each step returned from singleStep will be p to feed back into
    //Weather?
  },
  
  runCurrentSetup: function(runCoppicedVersion,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap,reprintHeaders){
    
    //for running the coppice model right away we need to assume it is being coppiced right away, 
    //but the only diff is the init weight of stem, foliage and root. all prev values are 0
    //diff init function is needed + all coppice flags immediately true -> different trigger call required
    //someting like = purely coppiced model vs this one. at the moment only in local js on spreadsheet
    
    var firstMonthResults = m3PG.init(g,d,s);
    firstMonthResults.Date = (currentDate.getMonth()+1) + "/" + currentDate.getYear();
    
    var rows = []; //these will become rows
    //if coppiced in the first month (AKA running coppice model from day one)
    if (runCoppicedVersion || (willCoppice && currentDate.getYear()==yearToCoppice && currentMonth == monthToCoppice)){
      log("Time to Coppice!");
      //TODO: update trees
      
      if (isCoppiced == false) {
        //first time coppice
        //Important function name changes for the first coppice
        firstMonthResults.coppice_WR = firstMonthResults.WR;
        firstMonthResults.WR = undefined;
      }
      isCoppiced = true; //growth model changes into the coppiced one
      
      //firstMonthResults.WS  = the starting value
      //firstMonthResults.WF  = the starting value
      firstMonthResults.coppice_pS = firstMonthResults.pS;
      firstMonthResults.pS = undefined;
      firstMonthResults.totalP = firstMonthResults.NPP;//because there is no root contribution
      firstMonthResults.lastCoppiceAge = firstMonthResults.StandAge;
      //currentMonthResults.StandAge = 0; //the age of stand is 1 month?
      if (!runCoppicedVersion){ //only do this is the coppice cycle started, not if runCoppicedVersion is true and we just force the coppice model to start
          yearToCoppice = yearToCoppice + coppiceInterval; //next coppice year
      }
      //key Headers change
      keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","coppice_pS","coppice_pS","litterfall","totalP","WF","coppice_WR","WS", "W"];    
      if (reprintHeaders==true){
        rows.push(keysInOrder);
      } else {}
    } 
    
    

    
    log("Results of the first month: " +firstMonthResults);
    
    rows.push(keysInOrder);
    
    var firstRow = [];
    for (var i = 0; i < keysInOrder.length; i++){
      var key = keysInOrder[i];
      //log(key  + ": " + firstMonthResults[key]);
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
      log("if ("+willCoppice+" && "+currentDate.getYear()+"=="+yearToCoppice+" && "+currentMonth+" == "+monthToCoppice+")");
      if (willCoppice && currentDate.getYear()==yearToCoppice && currentMonth == monthToCoppice){
        log("Time to Coppice!");
        //TODO: update trees
        
        if (isCoppiced == false) {
          //first time coppice
          //Important function name changes for the first coppice
          currentMonthResults.coppice_WR = currentMonthResults.WR;
          currentMonthResults.WR = undefined;
        }
        
        isCoppiced = true; //growth model changes
        currentMonthResults.WS = 0; //no stem after cut
        currentMonthResults.WF = 0; //no foliage after cut 
        currentMonthResults.W = currentMonthResults.WF + currentMonthResults.WS + currentMonthResults.coppice_WR;
        currentMonthResults.lastCoppiceAge = currentMonthResults.StandAge;
        //currentMonthResults.StandAge = 0; //the age of stand is 1 month?
        yearToCoppice = yearToCoppice + coppiceInterval; //next coppice year
        //key Headers change
        keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","coppice_pS","litterfall","totalP","WF","coppice_WR","WS", "W"];    
        if (reprintHeaders==true){
          rows.push(keysInOrder);
        } else {}
      } 
      
      
      d = weatherMap[currentMonth]; //increment the month
      nextMonthResults = this.singleStep(g,currentMonthResults,d,s, isCoppiced);
      nextMonthResults.Date = (currentDate.getMonth()+1)  + "/" + currentDate.getYear();
      log("\n Results of the next month: " + nextMonthResults);
      var thisRow = [];
      for (var i = 0; i < keysInOrder.length; i++) {
        var key = keysInOrder[i];
        //log( key  + ": " + nextMonthResults[key]);
        thisRow.push(nextMonthResults[key]);
      } 
      currentMonthResults = nextMonthResults;
      rows.push(thisRow);
      
    }
    
    m3PGIO.dump(rows);
    
    return rows;
  },
  
  coppice_init : function(g,d,s) {
    m3PGIO.init(g,d,s);
    //run regular init, then update WF,WR,WS
    
  },
  
  init : function(g,d,s) {
    var c = {};
    c.StandAge = m3PGFunc.init_StandAge();
    //note: change in order
    c.WF = m3PGFunc.init_WF(g.StockingDensity, g.SeedlingFoliageMass);
    c.WR = m3PGFunc.init_WR(g.StockingDensity, g.SeedlingRootMass);
    c.WS = m3PGFunc.init_WS(g.StockingDensity, g.SeedlingStemMass);
    
    c.LAI = m3PGFunc.init_LAI(c.WF, g.SLA1, g.SLA0, c.StandAge, g.tSLA);
    c.VPD = m3PGFunc.VPD(d.tmin, d.tmax, d.tdmean);
    c.fVPD = m3PGFunc.fVPD(g.kG, c.VPD);
    
    //note: the order of var changes here. ASW calsulated before fsw TODO: double check this behavior
    c.ASW = m3PGFunc.init_ASW(s.maxaws);
    c.fSW = m3PGFunc.init_fSW(c.ASW, s.maxaws, s.swconst, s.swpower);
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
    
    c.fSW = m3PGFunc.fSW(p.ASW, s.maxaws, s.swconst, s.swpower);
    c.fAge = m3PGFunc.fAge(p.StandAge, g.maxAge, g.rAge, g.nAge);
    c.fFrost = m3PGFunc.fFrost(d.tmin);
    c.PAR = m3PGFunc.PAR(d.rad, g.molPAR_MJ);
    c.fT = m3PGFunc.fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
    c.xPP = m3PGFunc.xPP(g.y, c.PAR, g.gDM_mol);
    
    
    c.PhysMod = m3PGFunc.PhysMod(c.fVPD, c.fSW, c.fAge);
    
    c.NPP_regular = m3PGFunc.NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
    log("c.NPP_regular=" + c.NPP_regular);
    c.NPP_target = m3PGFunc.NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, g.cpRootLAITarget, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
    log("c.NPP_target=" + c.NPP_target);
    
    c.coppice_RootP = m3PGFunc.coppice_RootP(c.NPP_regular, c.NPP_target, p.coppice_WR, p.W,g.pRx,g.cpRootStoragePct,g.cpRootLAITarget);
    log("c.coppice_RootP=" + c.coppice_RootP);
    c.coppice_pfs = m3PGFunc.coppice_pfs(p.WS,g.StockingDensity, g.cpStemsPerStump, g.cpStemConst, g.cpStemPower, g.cpPfsConst, g.cpPfsPower, g.cpMaxPfs);
    c.totalP = m3PGFunc.totalP(c.NPP_regular,c.coppice_RootP, g.ConversionEfficiency);
    
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
    
    c.ASW = m3PGFunc.ASW(s.maxaws, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxaws
    
    log("c.coppice_pF=" + c.coppice_pF + " c.coppice_pS=" + c.coppice_pS + " p.WF=" + p.WF + " c.litterfall=" + c.litterfall);
    c.WF = m3PGFunc.WF(c.coppice_pF, p.WF, c.totalP, c.litterfall);
    
    log("p.coppice_WR=" + p.coppice_WR + " c.totalP=" + c.totalP + " c.pR=" + c.pR + " g.RttoverP=" + g.Rttover);
    c.coppice_WR = m3PGFunc.coppice_WR(p.coppice_WR, c.totalP, c.pR, g.Rttover, c.coppice_RootP);
    c.WS = m3PGFunc.WS(p.WS, c.totalP, c.coppice_pS);
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
    
    c.fSW = m3PGFunc.fSW(p.ASW, s.maxaws, s.swconst, s.swpower);
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
    
    log("DEBUGGIN: maxaws= " + s.maxaws + "; ASW=" + p.ASW + "; d.ppt=" + d.ppt + "; c.Transp=" + c.Transp + "; c.Intcptn= " + c.Intcptn + "; c.Irrig= " + c.Irrig);
    c.ASW = m3PGFunc.ASW(s.maxaws, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxaws
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
