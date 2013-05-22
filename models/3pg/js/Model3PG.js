/**


NOTE:  litterfall modified to account for stand age after coppicing

+ root max is chosen (not to let it drop) 

lengthOfGrowth is in months
*/

function runModel(lengthOfGrowth){
  //work with offsets and weather data later
  
  var isCoppiced = false;
  var willCoppice = false;
  var yearToCoppice;
  var coppiceInterval;
  var monthToCoppice;
  //Global Variables Array
  
  var g = {};
  readAllConstants(g); //global variables are an array of key-value pairs. INCLUDES SOIL DEPENDENT ONES - Separate?
 
  //calculate fNutr and add here;
  g.fNutr=fNutr(g.fN0, g.FR);
  
  var weatherMap = {};
  var s = {}; //soilMap
  var dateMap = {};
  readWeather(weatherMap, s, dateMap);
  
  var currentDate = dateMap["datePlanted"];
  
  var plantedMonth = currentDate.getMonth();
  var currentMonth = currentDate.getMonth();
  
  if (dateMap["dateCoppiced"] != undefined){
    yearToCoppice = dateMap["dateCoppiced"].getYear();
    monthToCoppice = dateMap["dateCoppiced"].getMonth();
    coppiceInterval = dateMap["yearsPerCoppice"];
    willCoppice = true;
  }
  
  Logger.log("Month of Planting = " + currentMonth);
  
  var step = 0;
  
  var d = weatherMap[currentMonth];
  
  Logger.log(d);
  
  var keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS", "W"];    

             
  var firstMonthResults = initializeModel(g,d,s);
  firstMonthResults.Date = (currentDate.getMonth()+1) + "/" + currentDate.getYear();
  
  var rows = []; //these will become rows
  
  Logger.log("Results of the first month: " +firstMonthResults);
  
  rows.push(keysInOrder);
  
  var firstRow = [];
  for (var i = 0; i < keysInOrder.length; i++){
    var key = keysInOrder[i];
    Logger.log(key  + ": " + firstMonthResults[key]);
    firstRow.push(firstMonthResults[key]);
  }
  
  rows.push(firstRow);

  var currentMonthResults = firstMonthResults;
  currentMonthResults.lastCoppiceAge = 0;
  var nextMonthResults;
  
  for (var step = 1; step < lengthOfGrowth; step++){
    currentDate.setMonth(currentDate.getMonth() + 1); // add a month to current date
    Logger.log("currentDate = " + currentDate);
    currentMonth = currentDate.getMonth();
    
    //If curretn year is the year of coppice, cut the tree (redestribute the weight)
    //set coppicing flag to true
    //use coppicing functions
    if (willCoppice && currentDate.getYear()==yearToCoppice && currentMonth == monthToCoppice){
      Logger.log("Time to Coppice!");
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
    nextMonthResults = singleStep(g,currentMonthResults,d,s, isCoppiced);
    nextMonthResults.Date = (currentDate.getMonth()+1)  + "/" + currentDate.getYear();
    Logger.log("\n Results of the next month: " + nextMonthResults);
    var thisRow = [];
    for (var i = 0; i < keysInOrder.length; i++) {
      var key = keysInOrder[i];
      Logger.log( key  + ": " + nextMonthResults[key]);
      thisRow.push(nextMonthResults[key]);
    } 
    currentMonthResults = nextMonthResults;
    rows.push(thisRow);
    
  }
  
  writeRowsToSheet(rows);
  
  //init all - will be p,
  //then each step returned from singleStep will be p to feed back into
  //Weather?
}



function initializeModel(g,d,s){
  var c = new Object();
  c.StandAge = init_StandAge();
  //note: change in order
  c.WF = init_WF(g.StockingDensity, g.SeedlingMass);
  c.WR = init_WR(g.StockingDensity, g.SeedlingMass);
  c.WS = init_WS(g.StockingDensity, g.SeedlingMass);
  
  c.LAI = init_LAI(c.WF, g.SLA1, g.SLA0, c.StandAge, g.tSLA);
  c.VPD = VPD(d.tmin, d.tmax, d.tdmean);
  c.fVPD = fVPD(g.kG, c.VPD);
  
  //note: the order of var changes here. ASW calsulated before fsw TODO: double check this behavior
  c.ASW = init_ASW(s.maxAWS);
  c.fSW =  init_fSW(c.ASW, s.maxAWS, s.swconst, s.swpower);
  c.fAge = fAge(c.StandAge, g.maxAge, g.rAge, g.nAge);
  c.fFrost = fFrost(d.tmin);
  c.PAR = PAR(d.rad, g.molPAR_MJ);
  c.xPP = xPP(g.y, c.PAR, g.gDM_mol);
  c.PhysMod = PhysMod(c.fVPD, c.fSW, c.fAge);
  c.Intcptn = init_Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
  c.CanCond = CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
  c.pR = pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);
  Logger.log("DEBUGGIN: tmin= " + d.tmin + "; tmax=" + d.tmax + "; Tmin=" + g.Tmin + "; Tmax=" + g.Tmax + "; Topt= " + g.Topt);
  c.fT = fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
  c.NPP = init_NPP(c.StandAge, g.fullCanAge, c.xPP, g.k, c.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
  c.litterfall = init_litterfall(g.gammaFx, g.gammaF0, c.StandAge, g.tgammaF);
  c.Transp = 0; // TODO: is it the correct default value?
 
  c.pS = init_pS(c.WS, g.StockingDensity, g.StemConst, g.StemPower, c.pR, g.pfsConst, g.pfsPower);
  c.Irrig = Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
  c.CumIrrig = init_CumIrrig();
  
  c.W = W(c.WF, c.WR, c.WS);
  return c;
}


function singleStep(g,p,d,s,isCoppiced){
  Logger.log("isCoppiced? = " + isCoppiced);
  if (isCoppiced) {
    return singleStepCoppiced(g,p,d,s);
  } else {
    return singleStepSincePlanting(g,p,d,s);
  }
 
}

function singleStepCoppiced(g,p,d,s){
  var c = new Object();
  c.StandAge = StandAge(p.StandAge);
  c.LAI = LAI(p.WF, g.SLA1, g.SLA0, p.StandAge, g.tSLA);
  c.VPD = VPD(d.tmin, d.tmax, d.tdmean);
  c.fVPD = fVPD(g.kG, c.VPD);
  
  c.fSW = fSW(p.ASW, s.maxAWS, s.swconst, s.swpower);
  c.fAge = fAge(p.StandAge, g.maxAge, g.rAge, g.nAge);
  c.fFrost = fFrost(d.tmin);
  c.PAR = PAR(d.rad, g.molPAR_MJ);
  c.fT = fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
  c.xPP = xPP(g.y, c.PAR, g.gDM_mol);
  
  
 // c.coppice_RootPP = coppice_RootPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost,p.WR,p.W,g.pRx,g.cpRootStoragePct,g.cpRootLAITarget);

  c.PhysMod = PhysMod(c.fVPD, c.fSW, c.fAge);
  
  c.NPP_regular = NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
   Logger.log("c.NPP_regular=" + c.NPP_regular);
  c.NPP_target = NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, g.cpRootLAITarget, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
   Logger.log("c.NPP_target=" + c.NPP_target);
  
  c.coppice_RootPP = coppice_RootPP(c.NPP_regular, c.NPP_target, p.coppice_WR, p.W,g.pRx,g.cpRootStoragePct,g.cpRootLAITarget);
  Logger.log("c.coppice_RootPP=" + c.coppice_RootPP);
  c.coppice_pfs = coppice_pfs(p.WS,g.StockingDensity, g.cpStemsPerStump, g.cpStemConst, g.cpStemPower, g.cpPfsConst, g.cpPfsPower, g.cpMaxPfs);
  c.coppice_NPP = coppice_NPP(c.NPP_regular,c.coppice_RootPP);
  
  c.Intcptn = Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
  c.CanCond = CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
  
  c.pR = pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);

  c.litterfall = litterfall(g.gammaFx, g.gammaF0, p.StandAge, g.tgammaF, p.lastCoppiceAge);
  
  //Logger.log("g.days_per_mon=" + g.days_per_mon + " g.e20=" + g.e20 + " g.Qa=" + g.Qa + " g.Qb=" + g.Qb + " d.nrel=" + d.nrel + " d.daylight=" + d.daylight + " g.rhoAir=" + g.rhoAir + " g.lambda=" + g.lambda + " g.VPDconv=" + g.VPDconv + " c.VPD=" + c.VPD + " g.BLcond=" + g.BLcond + " c.CanCond=" + c.CanCond);
  c.Transp = Transp(g.days_per_mon, g.e20, g.Qa, g.Qb, d.nrel, d.daylight, g.rhoAir, g.lambda, g.VPDconv, c.VPD, g.BLcond, c.CanCond);
  
  c.coppice_pS = coppice_pS(c.pR,c.coppice_pfs);
  c.coppice_pF = coppice_pF(c.pR,c.coppice_pfs);
  
  c.Irrig = Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
  c.CumIrrig = CumIrrig(p.CumIrrig, c.Irrig);
  
  c.ASW = ASW(s.maxAWS, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxAWS
  
  Logger.log("c.pR=" + c.pR + " c.coppice_pS=" + c.coppice_pS + " p.WF=" + p.WF + " c.litterfall=" + c.litterfall);
  c.WF = WF(c.pR, p.WF, c.coppice_NPP, c.litterfall);
  
  Logger.log("p.coppice_WR=" + p.coppice_WR + " c.coppice_NPP=" + c.coppice_NPP + " c.pR=" + c.pR + " g.RttoverP=" + g.Rttover);
  c.coppice_WR = coppice_WR(p.coppice_WR, c.coppice_NPP, c.pR, g.Rttover, c.coppice_RootPP);
  c.WS = WS(p.WS, c.coppice_NPP, c.coppice_pS);
  c.W = W(c.WF, c.coppice_WR, c.WS);
  c.lastCoppiceAge = p.lastCoppiceAge;
  return c;
}

function singleStepSincePlanting(g,p,d,s){
  var c = new Object();
  c.StandAge = StandAge(p.StandAge);
  c.LAI = LAI(p.WF, g.SLA1, g.SLA0, p.StandAge, g.tSLA);
  c.VPD = VPD(d.tmin, d.tmax, d.tdmean);
  c.fVPD = fVPD(g.kG, c.VPD);
  
  c.fSW = fSW(p.ASW, s.maxAWS, s.swconst, s.swpower);
  c.fAge = fAge(p.StandAge, g.maxAge, g.rAge, g.nAge);
  c.fFrost = fFrost(d.tmin);
  c.PAR = PAR(d.rad, g.molPAR_MJ);
  
  c.xPP = xPP(g.y, c.PAR, g.gDM_mol);
  c.PhysMod = PhysMod(c.fVPD, c.fSW, c.fAge);
  c.Intcptn = Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
  c.CanCond = CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
  
  c.pR = pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);
  c.fT = fT(d.tmin, d.tmax, g.Tmin, g.Tmax, g.Topt);
  c.NPP = NPP(p.StandAge, g.fullCanAge, c.xPP, g.k, p.LAI, c.fVPD, c.fSW, c.fAge, g.alpha, g.fNutr, c.fT, c.fFrost);
  c.litterfall = litterfall(g.gammaFx, g.gammaF0, p.StandAge, g.tgammaF, p.lastCoppiceAge);
    
  Logger.log("g.days_per_mon=" + g.days_per_mon + " g.e20=" + g.e20 + " g.Qa=" + g.Qa + " g.Qb=" + g.Qb + " d.nrel=" + d.nrel + " d.daylight=" + d.daylight + " g.rhoAir=" + g.rhoAir + " g.lambda=" + g.lambda + " g.VPDconv=" + g.VPDconv + " c.VPD=" + c.VPD + " g.BLcond=" + g.BLcond + " c.CanCond=" + c.CanCond);
  c.Transp = Transp(g.days_per_mon, g.e20, g.Qa, g.Qb, d.nrel, d.daylight, g.rhoAir, g.lambda, g.VPDconv, c.VPD, g.BLcond, c.CanCond);
  c.pS = pS(p.WS, g.StockingDensity, g.StemConst, g.StemPower, c.pR, g.pfsConst, g.pfsPower);
  c.pF = pF(c.pR, c.pS);
  
  Logger.log("DEBUGGIN: irrigFrac= " + g.irrigFrac + "; Transp=" + c.Transp + "; c.Intcptn=" + c.Intcptn + "; d.ppt=" + d.ppt);
  c.Irrig = Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
  c.CumIrrig = CumIrrig(p.CumIrrig, c.Irrig);
  
  Logger.log("DEBUGGIN: maxAWS= " + s.maxAWS + "; ASW=" + p.ASW + "; d.ppt=" + d.ppt + "; c.Transp=" + c.Transp + "; c.Intcptn= " + c.Intcptn + "; c.Irrig= " + c.Irrig);
  c.ASW = ASW(s.maxAWS, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxAWS
  c.WF = WF(c.pF, p.WF, c.NPP, c.litterfall);
  c.WR = WR(p.WR, c.NPP, c.pR, g.Rttover);
  c.WS = WS(p.WS, c.NPP, c.pS);
  c.W = W(c.WF, c.WR, c.WS);
  c.lastCoppiceAge = p.lastCoppiceAge;
  return c;
}

function testArray(){
  initialize();
  
  //planed in May, offset = 5;
  avgMonthVal(ppt, 13);
}

/** gets the previous month's value of the variable requested */
function prevMonthVal(array, index){
  if (index>=array.length || index<0){
    Logger.log("Problem with the index of array, array=" + array  + "; index=" + index + "; previousIndex=" + (index-1));
    return null;
  }
  var value = array[index-1];
  Logger.log("value to return = " + value);
  return value;  
}

/** gets the current month's value of the variable requested */
function curMonthVal(array, index){
  if (index>=array.length|| index<0){
    Logger.log("Problem with the index of array, array=" + array + "; curMonth= " + curMonth + "; index=" + index);
    return null;
  }
  var value = array[index];
  Logger.log("value to return = " + value);
  return value;  
}


//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var functions = "";
		var fList = ["runModel", "initializeModel","singleStep","singleStepCoppiced", "singleStepSincePlanting",
		             "testArray", "prevMonthVal", "curMonthVal"];
		
		for( var i = 0; i < fList.length; i++ ) {
			functions += eval('('+fList[i]+'.toString())');
		}
		return functions;
	}
}