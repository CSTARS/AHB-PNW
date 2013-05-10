CREATE OR REPLACE FUNCTION run3pgModel(lengthOfGrowth integer) RETURNS
VOID AS $$

function log(msg) {
	if( Logger ) Logger.log(msg);
	if( plv8 ) plv8.elog(NOTICE, msg);
}function runModel(lengthOfGrowth){
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
}function writeRowsToSheet(rows){
  var spreadsheet =
      SpreadsheetApp.openById("0AmgH34NLQLU-dHA0QkViSnE2WV9tZGdXX2JRVC1ISEE");
  var resultSheet = spreadsheet.getSheetByName("Output"); //TODO: decide on where this can be taken out into
  //below start with second row, leave first one untouched
  
  var range = resultSheet.getRange(2, 2,
      rows.length, rows[0].length);
  range.setValues(rows);
  
}function initializeModel(g,d){
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
}function singleStep(g,p,d){
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
}function testArray(){
  initialize();
  
  //planed in May, offset = 5;
  avgMonthVal(ppt, 13);
}function prevMonthVal(array, index){
  if (index>=array.length || index<0){
    log("Problem with the index of array, array=" + array  + "; index=" + index + "; previousIndex=" + (index-1));
    return null;
  }
  var value = array[index-1];
  log("value to return = " + value);
  return value;  
}function curMonthVal(array, index){
  if (index>=array.length|| index<0){
    log("Problem with the index of array, array=" + array + "; curMonth= " + curMonth + "; index=" + index);
    return null;
  }
  var value = array[index];
  log("value to return = " + value);
  return value;  
}function avgMonthVal(array, index, Offset){
  //index needs to be modulo 12, because index is always the timestep index of growth, while the indexOnYearBasis is the month of the year index (jan=0,.. dec=11);
  var indexOnYearBasis = index % 12 + Offset;
  if (indexOnYearBasis>=array.length || indexOnYearBasis<0){
    log("Problem with the index of array, array=" + array + "; curMonth= " + curMonth + "; indexOnYearBasis=" + indexOnYearBasis);
    return null;
  }
  var value = array[indexOnYearBasis];
  log("value to return = " + value);
  return value;  
}function readWeather(){
    var spreadsheet = SpreadsheetApp.openById("0AmgH34NLQLU-dHA0QkViSnE2WV9tZGdXX2JRVC1ISEE"); //Hardcoded 3PG spreadsheet id
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName("weather_Davis"); 
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
    var keyValMap = {};
  
  
    for (var row = 1; row < data.length; row++) {
      var rowData = data[row];
      
      var item = {};
      for (var column = 1; column < keys.length; column++) {
        item[keys[column]] = rowData[column];
        if (keys[column] == "rad"){
          item["nrel"] = rowData[column] / 0.0036;
        }
      }
      keyValMap[rowData[0]] = item;
    }
  
    
    //var nrel = keyValMap.rad / 0.0036;
  
   // log(nrel);
  
   
      
    log(keyValMap);


    return keyValMap;
}function readAllConstants(){
    var spreadsheet = SpreadsheetApp.openById("0AmgH34NLQLU-dHA0QkViSnE2WV9tZGdXX2JRVC1ISEE"); //Hardcoded 3PG spreadsheet id
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName("input_constants"); 
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
    var keyValMap = {};

    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      keyValMap[rowData[0]] = rowData[3];
    } 
    
    log(keyValMap);

    return keyValMap;
}function defaultOrUser(defaultVal, userVal) {
  if (userVal == undefined || userVal==""){
   return defaultVal;
  } else {
    return userVal;
  }
}function log(msg) {
	if( Logger ) Logger.log(msg);
	if( plv8 ) plv8.elog(NOTICE, msg);
}function Intcptn(MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if (LAImaxIntcptn<=0){
    return MaxIntcptn;    
  }else {
    return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn);
  }
}function init_Intcptn(MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if(LAImaxIntcptn <= 0){
     return MaxIntcptn;
  } else {
     return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn );
  }
}function ASW(maxASW, prev_ASW, date_ppt, cur_Transp, cur_Intcptn, cur_Irrig){
  return Math.min(maxASW*10, Math.max(prev_ASW + date_ppt - (cur_Transp + cur_Intcptn * date_ppt) + cur_Irrig, 0));
}function init_ASW(maxAWS){
  return 0.8 * 10 * maxAWS;
}function VPD(date_tmin, date_tmax, date_tdmean){
  return (0.6108 / 2 * (Math.exp(date_tmin * 17.27 / (date_tmin + 237.3) ) + Math.exp(date_tmax * 17.27 / (date_tmax + 237.3) ) ) ) - (0.6108 * Math.exp(date_tdmean * 17.27 / (date_tdmean + 237.3) ) );
}function fVPD(kG, cur_VPD){
  return Math.exp(-1 * kG * cur_VPD); 
}function fFrost(date_tmin) {
  var tempVar = -1.0;
  if (date_tmin >= 0){
    tempVar = 1.0;
  } //else -1.0
  
  return 0.5 * (1.0 + tempVar * Math.sqrt(1 - Math.exp(-1 * Math.pow((0.17 * date_tmin) , 2) * (4 / 3.14159 + 0.14 * Math.pow( (0.17 * date_tmin) , 2) ) / (1 + 0.14 * Math.pow((0.17 * date_tmin) , 2) ) ) ) ); 
}function fT(date_tmin, date_tmax, Tmin, Tmax, Topt){
  var tavg = (date_tmin + date_tmax) / 2;
  if (tavg <= Tmin || tavg >= Tmax){
     return 0;
  }else {
     return  ( (tavg - Tmin) / (Topt - Tmin) )  *  Math.pow ( ( (Tmax - tavg) / (Tmax - Topt) )  , ( (Tmax - Topt) / (Topt - Tmin) ) );
  }
}function Irrig(irrigFrac, cur_Transp, cur_Intcptn, date_ppt){
   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );
}function CumIrrig(prev_CumIrrig, cur_Irrig){
   return prev_CumIrrig + cur_Irrig;
}function init_CumIrrig(){
  return 0; 
}function fAge(prev_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (prev_StandAge / maxAge) / rAge) , nAge) ) );
  }
}function init_fAge(cur_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (cur_StandAge / maxAge) / rAge) , nAge) ) );
  }
}function fSW(prev_ASW, maxAWS, swconst, swpower){
   return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (prev_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
}function init_fSW(cur_ASW, maxAWS, swconst, swpower){
  return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (cur_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
}function fNutr(fN0, FR){
  return fN0 + (1 - fN0) * FR;
}function PhysMod(cur_fVPD, cur_fSW, cur_fAge){
   return Math.min(cur_fVPD , cur_fSW) * cur_fAge;
}function LAI(prev_WF, SLA1, SLA0, prev_StandAge, tSLA){
   return prev_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (prev_StandAge / tSLA) , 2) ) );
}function init_LAI(cur_WF, SLA1, SLA0, cur_StandAge, tSLA){
  return cur_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (cur_StandAge / tSLA) , 2) ) ); 
}function CanCond(MaxCond, cur_PhysMod, cur_LAI, LAIgcx){
   return Math.max(0.0001 , MaxCond * cur_PhysMod * Math.min(1 , cur_LAI / LAIgcx) );
}function Transp(days_per_mon, e20, Qa, Qb, date_nrel, date_daylight, rhoAir, lambda, VPDconv, cur_VPD, BLcond, cur_CanCond){
   return days_per_mon * ( (e20 * (Qa + Qb * (date_nrel / date_daylight) ) + (rhoAir * lambda * VPDconv * cur_VPD * BLcond) ) / (1 + e20 + BLcond / cur_CanCond) ) * date_daylight * 3600 / lambda;
}function NPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost){
  var CanCover = 1;
  if (prev_StandAge < fullCanAge){
    CanCover = prev_StandAge / fullCanAge;
  } //else CanCover = 1;
  return cur_xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(cur_fVPD , cur_fSW) * cur_fAge * alpha * fNutr * cur_fT * cur_fFrost;
}function init_NPP(cur_StandAge, fullCanAge, cur_xPP, k, cur_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost){
 return 0;
}function litterfall(gammaFx, gammaF0, prev_StandAge, tgammaF){
  return gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * prev_StandAge / tgammaF) );
}function init_litterfall(gammaFx, gammaF0, cur_StandAge, tgammaF){
  
  var result = gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * cur_StandAge / tgammaF) );
  return result;
}function pS(prev_WS, StockingDensity, StemConst, StemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (prev_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
}function init_pS(cur_WS, StockingDensity, StemConst, StemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (cur_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
}function pR(pRx, pRn, cur_PhysMod, m0, FR){
  return (pRx * pRn) / (pRn + (pRx - pRn) * cur_PhysMod * (m0 + (1 - m0) * FR) );
}function WF(cur_pR, cur_pS, prev_WF, cur_NPP, cur_litterfall){
   var pF = 1 - cur_pR - cur_pS;
   return prev_WF + cur_NPP * pF - cur_litterfall * prev_WF;
}function init_WF(StockingDensity, SeedlingMass){
  return 0.5 * StockingDensity * SeedlingMass; 
}function WR(prev_WR, cur_NPP, cur_pR, Rttover){
   return prev_WR + cur_NPP * cur_pR - Rttover * prev_WR;
}function init_WR(StockingDensity, SeedlingMass){
  return 0.25 * StockingDensity * SeedlingMass; 
}function WS(prev_WS, cur_NPP, cur_pS){
   return prev_WS + cur_NPP * cur_pS;
}function init_WS(StockingDensity, SeedlingMass){
  return 0.25 * StockingDensity * SeedlingMass; 
}function W(cur_WF, cur_WR, cur_WS){
  return cur_WF + cur_WR + cur_WS;
}function StandAge(prev_StandAge){
  return prev_StandAge + 1.0/12;
}function init_StandAge(){
  return 1.0 / 12; 
}function PAR(date_rad, molPAR_MJ){
  return date_rad * 30.4 * molPAR_MJ;
}function xPP(y, cur_PAR, gDM_mol){
  return y * cur_PAR * gDM_mol / 100;
}
runModel(lengthOfGrowth);

$$ LANGUAGE plv8 IMMUTABLE STRICT;