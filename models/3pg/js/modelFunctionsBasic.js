function getEnv() {
	return plv8 ? "plv8" : "ss";
}


/**
lengthOfGrowth is in months
*/

function runModel(lengthOfGrowth){
  //work with offsets and weather data later
  
  //Global Variables Array
  var g = readAllConstants(); //global variables are an array of key-value pairs. INCLUDES SOIL DEPENDENT ONES - Separate?
 
  //calculate fNutr and add here;
  g.fNutr=fNutr(g.fN0, g.FR);
  var yearWeather = readWeather();
  
  var offset = 2; //(plant in march)
  
  var step = 1;
  
  var d = avgMonthVal(yearWeather, step, offset);
  
  log(d);
  
  var keysInOrder = ["VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS"];    

             
  var firstMonthResults = initializeModel(g,d);
  
  var rows = []; //these will become rows
  
  log("Results of the first month: " +firstMonthResults);
  var thisRow = [];
  for (var i = 0; i < keysInOrder.length; i++){
    var key = keysInOrder[i];
    log(key  + ": " + firstMonthResults[key]);
    thisRow.push(firstMonthResults[key]);
  }
  
  rows.push(thisRow);

  var currentMonthResults = firstMonthResults;
  var nextMonthResults;
  
  for (var step = 2; step <= lengthOfGrowth; step++){
    d = avgMonthVal(yearWeather, step, offset); //increment the month
    nextMonthResults = singleStep(g,currentMonthResults,d);
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
  
  writeRowsToSheet(rows);
  
  //init all - will be p,
  //then each step returned from singleStep will be p to feed back into
  //Weather?
}

function writeRowsToSheet(rows){
  var spreadsheet =
      SpreadsheetApp.openById("0AmgH34NLQLU-dHA0QkViSnE2WV9tZGdXX2JRVC1ISEE");
  var resultSheet = spreadsheet.getSheetByName("Output"); //TODO: decide on where this can be taken out into
  //below start with second row, leave first one untouched
  
  var range = resultSheet.getRange(2, 2,
      rows.length, rows[0].length);
  range.setValues(rows);
  
}

function initializeModel(g,d){
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
  c.ASW = init_ASW(g.maxAWS);
  c.fSW =  init_fSW(c.ASW, g.maxAWS, g.swconst, g.swpower);
  c.fAge = fAge(c.StandAge, g.maxAge, g.rAge, g.nAge);
  c.fFrost = fFrost(d.tmin);
  c.PAR = PAR(d.rad, g.molPAR_MJ);
  c.xPP = xPP(g.y, c.PAR, g.gDM_mol);
  c.PhysMod = PhysMod(c.fVPD, c.fSW, c.fAge);
  c.Intcptn = init_Intcptn(g.MaxIntcptn, c.LAI, g.LAImaxIntcptn);
  c.CanCond = CanCond(g.MaxCond, c.PhysMod, c.LAI, g.LAIgcx);
  c.pR = pR(g.pRx, g.pRn, c.PhysMod, g.m0, g.FR);
  log("DEBUGGIN: tmin= " + d.tmin + "; tmax=" + d.tmax + "; Tmin=" + g.Tmin + "; Tmax=" + g.Tmax + "; Topt= " + g.Topt);
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


function singleStep(g,p,d){
  var c = new Object();
  c.StandAge = StandAge(p.StandAge);
  c.LAI = LAI(p.WF, g.SLA1, g.SLA0, p.StandAge, g.tSLA);
  c.VPD = VPD(d.tmin, d.tmax, d.tdmean);
  c.fVPD = fVPD(g.kG, c.VPD);
  
  c.fSW = fSW(p.ASW, g.maxAWS, g.swconst, g.swpower);
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
  c.litterfall = litterfall(g.gammaFx, g.gammaF0, p.StandAge, g.tgammaF);
  
  log("g.days_per_mon=" + g.days_per_mon + " g.e20=" + g.e20 + " g.Qa=" + g.Qa + " g.Qb=" + g.Qb + " d.nrel=" + d.nrel + " d.daylight=" + d.daylight + " g.rhoAir=" + g.rhoAir + " g.lambda=" + g.lambda + " g.VPDconv=" + g.VPDconv + " c.VPD=" + c.VPD + " g.BLcond=" + g.BLcond + " c.CanCond=" + c.CanCond);
  c.Transp = Transp(g.days_per_mon, g.e20, g.Qa, g.Qb, d.nrel, d.daylight, g.rhoAir, g.lambda, g.VPDconv, c.VPD, g.BLcond, c.CanCond);
  c.pS = pS(p.WS, g.StockingDensity, g.StemConst, g.StemPower, c.pR, g.pfsConst, g.pfsPower);
  
  log("DEBUGGIN: irrigFrac= " + g.irrigFrac + "; Transp=" + c.Transp + "; c.Intcptn=" + c.Intcptn + "; d.ppt=" + d.ppt);
  c.Irrig = Irrig(g.irrigFrac, c.Transp, c.Intcptn, d.ppt);
  c.CumIrrig = CumIrrig(p.CumIrrig, c.Irrig);
  
  log("DEBUGGIN: maxAWS= " + g.maxAWS + "; ASW=" + p.ASW + "; d.ppt=" + d.ppt + "; c.Transp=" + c.Transp + "; c.Intcptn= " + c.Intcptn + "; c.Irrig= " + c.Irrig);
  c.ASW = ASW(g.maxAWS, p.ASW, d.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxAWS
  c.WF = WF(c.pR, c.pS, p.WF, c.NPP, c.litterfall);
  c.WR = WR(p.WR, c.NPP, c.pR, g.Rttover);
  c.WS = WS(p.WS, c.NPP, c.pS);
  c.W = W(c.WF, c.WR, c.WS);
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
    log("Problem with the index of array, array=" + array  + "; index=" + index + "; previousIndex=" + (index-1));
    return null;
  }
  var value = array[index-1];
  log("value to return = " + value);
  return value;  
}

/** gets the current month's value of the variable requested */
function curMonthVal(array, index){
  if (index>=array.length|| index<0){
    log("Problem with the index of array, array=" + array + "; curMonth= " + curMonth + "; index=" + index);
    return null;
  }
  var value = array[index];
  log("value to return = " + value);
  return value;  
}

/** gets the average month's value of the variable requested using the offset. Offset is used to account for the month when the tree is planted */
function avgMonthVal(array, index, Offset){
  //index needs to be modulo 12, because index is always the timestep index of growth, while the indexOnYearBasis is the month of the year index (jan=0,.. dec=11);
  var indexOnYearBasis = index % 12 + Offset;
  if (indexOnYearBasis>=array.length || indexOnYearBasis<0){
    log("Problem with the index of array, array=" + array + "; curMonth= " + curMonth + "; indexOnYearBasis=" + indexOnYearBasis);
    return null;
  }
  var value = array[indexOnYearBasis];
  log("value to return = " + value);
  return value;  
}


function log(msg) {
	if( Logger ) Logger.log(msg);
	if( plv8 ) plv8.elog(NOTICE, msg);
}

//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var functions = "";
		var fList = ["log", "runModel", "writeRowsToSheet", "initializeModel","singleStep",
		             "testArray", "prevMonthVal", "curMonthVal", "avgMonthVal"];
		
		for( var i = 0; i < fList.length; i++ ) {
			funcitons += eval('('+fList[i]+'.toString())');
		}
		return functions;
	}
}