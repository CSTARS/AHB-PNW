CREATE OR REPLACE FUNCTION run3pgModel(lengthOfGrowth integer) RETURNS
VOID AS $$

m3PG={run:function (lengthOfGrowth) {
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
		  
		  m3PGIO.dump(rows)
		  
		  //init all - will be p,
		  //then each step returned from singleStep will be p to feed back into
		  //Weather?
	},init:function (g,d,s) {
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
		
	},singleStep:function (g,p,d,s,isCoppiced){
		  log("isCoppiced? = " + isCoppiced);
		  if (isCoppiced) {
		    return this.singleStepCoppiced(g,p,d,s);
		  } else {
		    return this.singleStepSincePlanting(g,p,d,s);
		  }
	},singleStepCoppiced:function (g,p,d,s){
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
	},singleStepSincePlanting:function (g,p,d,s){
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
	}};m3PGIO={config:{"constansts":"input_constants","weather":"Weather","spreadsheet":{"plantedDateHeader":"Planted Date:","coppiceDateHeader":"Coppice Date:","coppiceIntervalHeader":"Coppice Interval Years:","soilDataHeader":"Soil Data:"},"output":"Output"},readAllConstants:function (keyValMap) {
		if( env() == "appscript" ) return m3PGIO._readAllConstantsAppscript(keyValMap);
		else if( env() == "plv8" ) return m3PGIO._readAllConstantsPlv8(keyValMap);
		
		// badness
		log("Error: unknown env in 3PG.io.readAllConstants - "+env());
		return null;
	},_readAllConstantsAppscript:function (keyValMap) {
		var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //Hardcoded 3PG spreadsheet id
	    //var columns = spreadsheet.getLastColumn();
	    var sheet = spreadsheet.getSheetByName(m3PGIO.config.constansts); 
	    var data = sheet.getDataRange().getValues();
	    var keys = data[0];  

	    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
	      var rowData = data[row];
	      keyValMap[rowData[0]] = rowData[3];
	    } 
	    
	    log(keyValMap);

	    return keyValMap;
	},_readAllConstantsPlv8:function (keyValMap) {
		// TODO
	},testReadWeather:function () {
		  var weatherMap = {};
		  var soilMap = {};
		  var dateMap = {};
		  readWeather(weatherMap, soilMap, dateMap);
	},readWeather:function (weatherMap, soilMap, dateMap) {
		if( env() == "appscript" ) return m3PGIO._readWeatherAppScript(weatherMap, soilMap, dateMap);
		else if( env() == "plv8" ) return m3PGIO._readWeatherPlv8(weatherMap, soilMap, dateMap);
		
		// badness
		log("Error: unknown env in 3PG.io.readWeather - "+env());
		return null;
	},_readWeatherAppScript:function (weatherMap, soilMap, dateMap) {
	    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //Hardcoded 3PG spreadsheet id
	    //var columns = spreadsheet.getLastColumn();
	    var sheet = spreadsheet.getSheetByName(m3PGIO.config.weather); //weather_Davis
	    var data = sheet.getDataRange().getValues();
	    var keys = data[0];  
	  
	  //The months are 0 indexed in date utility
	  
	  //TODO: compare the expected column names!
	  
	    for (var row = 1; row < data.length; row++) {
	      var rowData = data[row];
	      
	      var item = {};
	      for (var column = 0; column < keys.length; column++) {
	        if ( rowData[0] == m3PGIO.config.spreadsheet.plantedDateHeader ){
	          dateMap["datePlanted"] = rowData[1];
	          break;
	        } else if ( rowData[0] == m3PGIO.config.spreadsheet.coppiceDateHeader ){
	          dateMap["dateCoppiced"] = rowData[1];
	          break;
	        } else if (rowData[0]== m3PGIO.config.spreadsheet.coppiceIntervalHeader ){
	          dateMap["yearsPerCoppice"] = rowData[1];
	          break;
	        } else if ( rowData[0] == m3PGIO.config.spreadsheet.soilDataHeader ){
	          //NOTICE: Order matters! 
	          soilMap["maxAWS"] = rowData[1];
	          soilMap["swpower"] = rowData[2];
	          soilMap["swconst"] = rowData[3];
	          break;
	        }
	        
	        if (rowData[0] != null && rowData[0] != ""){
	          item[keys[column]] = rowData[column];
	          if (keys[column] == "rad"){
	            item["nrel"] = rowData[column] / 0.0036;
	          }
	        }
	      }
	      if (Object.getOwnPropertyNames(item).length>0){
	        weatherMap[row-1] = item; //to start indexing at 0
	      }
	    }	    
	    //var nrel = keyValMap.rad / 0.0036;
  
	    log(weatherMap);
	    log(dateMap);
	    log(soilMap);
	    return weatherMap;
	},_readWeatherPlv8:function () {
		// TODO
	},dump:function (rows) {
		if( env() == "appscript" ) return m3PGIO._writeRowsToSheet(rows);
		else if( env() == "plv8" ) return m3PGIO._setResponse(rows);
		
		// badness
		log("Error: unknown env in 3PG.io.dump - "+env());
		return null;
	},_writeRowsToSheet:function (rows){
		  var spreadsheet =
		      SpreadsheetApp.getActiveSpreadsheet();
		  var resultSheet = spreadsheet.getSheetByName(m3PGIO.config.output); //TODO: decide on where this can be taken out into. Output
		  //below start with second row, leave first one untouched
		  
		  var range = resultSheet.getRange(1, 1,
		      rows.length, rows[0].length);
		  range.setValues(rows);
	}};m3PGFunc={Intcptn:function (MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if (LAImaxIntcptn<=0){
    return MaxIntcptn;    
  }else {
    return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn);
  }
},init_Intcptn:function (MaxIntcptn, cur_LAI, LAImaxIntcptn){
  if(LAImaxIntcptn <= 0){
     return MaxIntcptn;
  } else {
     return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn );
  }
},ASW:function (maxASW, prev_ASW, date_ppt, cur_Transp, cur_Intcptn, cur_Irrig){
  return Math.min(maxASW*10, Math.max(prev_ASW + date_ppt - (cur_Transp + cur_Intcptn * date_ppt) + cur_Irrig, 0));
},init_ASW:function (maxAWS){
  return 0.8 * 10 * maxAWS;
},VPD:function (date_tmin, date_tmax, date_tdmean){
  return (0.6108 / 2 * (Math.exp(date_tmin * 17.27 / (date_tmin + 237.3) ) + Math.exp(date_tmax * 17.27 / (date_tmax + 237.3) ) ) ) - (0.6108 * Math.exp(date_tdmean * 17.27 / (date_tdmean + 237.3) ) );
},fVPD:function (kG, cur_VPD){
  return Math.exp(-1 * kG * cur_VPD); 
},fFrost:function (date_tmin) {
  var tempVar = -1.0;
  if (date_tmin >= 0){
    tempVar = 1.0;
  } //else -1.0
  
  return 0.5 * (1.0 + tempVar * Math.sqrt(1 - Math.exp(-1 * Math.pow((0.17 * date_tmin) , 2) * (4 / 3.14159 + 0.14 * Math.pow( (0.17 * date_tmin) , 2) ) / (1 + 0.14 * Math.pow((0.17 * date_tmin) , 2) ) ) ) ); 
},fT:function (date_tmin, date_tmax, Tmin, Tmax, Topt){
  var tavg = (date_tmin + date_tmax) / 2;
  if (tavg <= Tmin || tavg >= Tmax){
     return 0;
  }else {
     return  ( (tavg - Tmin) / (Topt - Tmin) )  *  Math.pow ( ( (Tmax - tavg) / (Tmax - Topt) )  , ( (Tmax - Topt) / (Topt - Tmin) ) );
  }
},Irrig:function (irrigFrac, cur_Transp, cur_Intcptn, date_ppt){
   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );
},CumIrrig:function (prev_CumIrrig, cur_Irrig){
   return prev_CumIrrig + cur_Irrig;
},init_CumIrrig:function (){
  return 0; 
},fAge:function (prev_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (prev_StandAge / maxAge) / rAge) , nAge) ) );
  }
},init_fAge:function (cur_StandAge, maxAge, rAge, nAge){
  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (cur_StandAge / maxAge) / rAge) , nAge) ) );
  }
},fSW:function (prev_ASW, maxAWS, swconst, swpower){
   return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (prev_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
},init_fSW:function (cur_ASW, maxAWS, swconst, swpower){
  return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (cur_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );
},fNutr:function (fN0, FR){
  return fN0 + (1 - fN0) * FR;
},PhysMod:function (cur_fVPD, cur_fSW, cur_fAge){
   return Math.min(cur_fVPD , cur_fSW) * cur_fAge;
},LAI:function (prev_WF, SLA1, SLA0, prev_StandAge, tSLA){
   return prev_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (prev_StandAge / tSLA) , 2) ) );
},init_LAI:function (cur_WF, SLA1, SLA0, cur_StandAge, tSLA){
  return cur_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (cur_StandAge / tSLA) , 2) ) ); 
},CanCond:function (MaxCond, cur_PhysMod, cur_LAI, LAIgcx){
   return Math.max(0.0001 , MaxCond * cur_PhysMod * Math.min(1 , cur_LAI / LAIgcx) );
},Transp:function (days_per_mon, e20, Qa, Qb, date_nrel, date_daylight, rhoAir, lambda, VPDconv, cur_VPD, BLcond, cur_CanCond){
   return days_per_mon * ( (e20 * (Qa + Qb * (date_nrel / date_daylight) ) + (rhoAir * lambda * VPDconv * cur_VPD * BLcond) ) / (1 + e20 + BLcond / cur_CanCond) ) * date_daylight * 3600 / lambda;
},NPP:function (prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost){
  var CanCover = 1;
  if (prev_StandAge < fullCanAge){
    CanCover = prev_StandAge / fullCanAge;
  } //else CanCover = 1;
  return cur_xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(cur_fVPD , cur_fSW) * cur_fAge * alpha * fNutr * cur_fT * cur_fFrost;
},init_NPP:function (cur_StandAge, fullCanAge, cur_xPP, k, cur_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost){
 return 0;
},litterfall:function (gammaFx, gammaF0, prev_StandAge, tgammaF, prev_lastCoppiceAge){
  var prev_realStandAge = prev_StandAge - prev_lastCoppiceAge;
  Logger.log("DEBUGGING COPPICE: prev_StandAge=" + prev_StandAge +"; prev_realStandAge=" + prev_realStandAge);
  return gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * prev_realStandAge / tgammaF) );
},init_litterfall:function (gammaFx, gammaF0, cur_StandAge, tgammaF){
  
  var result = gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * cur_StandAge / tgammaF) );
  //Logger.log("DEBUGGING: " + result);
  return result;
},pS:function (prev_WS, StockingDensity, StemConst, StemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (prev_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
},init_pS:function (cur_WS, StockingDensity, StemConst, StemPower, cur_pR, pfsConst, pfsPower){
  var avDBH = Math.pow( ( (cur_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );
},pR:function (pRx, pRn, cur_PhysMod, m0, FR){
  return (pRx * pRn) / (pRn + (pRx - pRn) * cur_PhysMod * (m0 + (1 - m0) * FR) );
},pF:function (cur_pR, cur_pS){
  return 1 - cur_pR - cur_pS;
},WF:function (cur_pF, prev_WF, cur_NPP, cur_litterfall){
   return prev_WF + cur_NPP * cur_pF - cur_litterfall * prev_WF;
},init_WF:function (StockingDensity, SeedlingMass){
  return 0.5 * StockingDensity * SeedlingMass; 
},WR:function (prev_WR, cur_NPP, cur_pR, Rttover){
   return prev_WR + cur_NPP * cur_pR - Rttover * prev_WR;
},init_WR:function (StockingDensity, SeedlingMass){
  return 0.25 * StockingDensity * SeedlingMass; 
},WS:function (prev_WS, cur_NPP, cur_pS){
   return prev_WS + cur_NPP * cur_pS;
},init_WS:function (StockingDensity, SeedlingMass){
  return 0.25 * StockingDensity * SeedlingMass; 
},W:function (cur_WF, cur_WR, cur_WS){
  return cur_WF + cur_WR + cur_WS;
},StandAge:function (prev_StandAge){
  return prev_StandAge + 1.0/12;
},init_StandAge:function (){
  return 1.0 / 12; 
},PAR:function (date_rad, molPAR_MJ){
  return date_rad * 30.4 * molPAR_MJ;
},xPP:function (y, cur_PAR, gDM_mol){
  return y * cur_PAR * gDM_mol / 100;
},coppice_pfs:function (prev_WS,StockingDensity, cpStemsPerStump, cpStemConst, cpStemPower, cpPfsConst, cpPfsPower,cpMaxPfs) {
  var avDOB = Math.pow( ( (prev_WS * 1000 / StockingDensity / cpStemsPerStump) / cpStemConst) , (1 / cpStemPower) );
  var ppfs= cpPfsConst * Math.pow(avDOB , cpPfsPower);
  return Math.min(cpMaxPfs,ppfs);
},coppice_pS:function (cur_pR,pfs) {
  return (1 - cur_pR) / (1 + 1/pfs );
},coppice_pF:function (cur_pR,pfs) {
    return (1 - cur_pR) / (1 + 1/pfs );
},coppice_RootPP:function (cur_npp, cur_nppTarget, WR,W,pRx,cpRootStoragePct,cpRootLAITarget) {
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
},coppice_NPP:function (cur_npp,coppice_RootPP) {
  //var npp = NPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost);
//  var rootPP = coppice_RootPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost,WR,W,pRx,cpRootStoragePct);
  return cur_npp+coppice_RootPP;
},coppice_WR:function (prev_WR, cur_NPP, cur_pR, Rttover,coppice_RootPP){
  //Logger.log("DEBUGGING COPPICE: prev_WR=" + prev_WR + "; cur_NPP=" + cur_NPP + "; cur_pR=" + cur_pR + "; Rttover=" + Rttover+ "; coppice_RootPP=" + coppice_RootPP);
   return prev_WR, prev_WR + cur_NPP * cur_pR - Rttover * prev_WR - coppice_RootPP;
}};
runModel(lengthOfGrowth);

$$ LANGUAGE plv8 IMMUTABLE STRICT;
CREATE OR REPLACE FUNCTION Intcptn("MaxIntcptn" float, "cur_LAI" float, "LAImaxIntcptn" float) RETURNS
float AS $$

  if (LAImaxIntcptn<=0){
    return MaxIntcptn;    
  }else {
    return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn);
  }

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_Intcptn("MaxIntcptn" float, "cur_LAI" float, "LAImaxIntcptn" float) RETURNS
float AS $$

  if(LAImaxIntcptn <= 0){
     return MaxIntcptn;
  } else {
     return MaxIntcptn * Math.min(1 , cur_LAI / LAImaxIntcptn );
  }

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION ASW("maxASW" float, "prev_ASW" float, "date_ppt" float, "cur_Transp" float, "cur_Intcptn" float, "cur_Irrig" float) RETURNS
float AS $$

  return Math.min(maxASW*10, Math.max(prev_ASW + date_ppt - (cur_Transp + cur_Intcptn * date_ppt) + cur_Irrig, 0));

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_ASW("maxAWS" float) RETURNS
float AS $$

  return 0.8 * 10 * maxAWS;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION VPD("date_tmin" float, "date_tmax" float, "date_tdmean" float) RETURNS
float AS $$

  return (0.6108 / 2 * (Math.exp(date_tmin * 17.27 / (date_tmin + 237.3) ) + Math.exp(date_tmax * 17.27 / (date_tmax + 237.3) ) ) ) - (0.6108 * Math.exp(date_tdmean * 17.27 / (date_tdmean + 237.3) ) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION fVPD("kG" float, "cur_VPD" float) RETURNS
float AS $$

  return Math.exp(-1 * kG * cur_VPD); 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION fFrost("date_tmin" float) RETURNS
float AS $$

  var tempVar = -1.0;
  if (date_tmin >= 0){
    tempVar = 1.0;
  } //else -1.0
  
  return 0.5 * (1.0 + tempVar * Math.sqrt(1 - Math.exp(-1 * Math.pow((0.17 * date_tmin) , 2) * (4 / 3.14159 + 0.14 * Math.pow( (0.17 * date_tmin) , 2) ) / (1 + 0.14 * Math.pow((0.17 * date_tmin) , 2) ) ) ) ); 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION fT("date_tmin" float, "date_tmax" float, "Tmin" float, "Tmax" float, "Topt" float) RETURNS
float AS $$

  var tavg = (date_tmin + date_tmax) / 2;
  if (tavg <= Tmin || tavg >= Tmax){
     return 0;
  }else {
     return  ( (tavg - Tmin) / (Topt - Tmin) )  *  Math.pow ( ( (Tmax - tavg) / (Tmax - Topt) )  , ( (Tmax - Topt) / (Topt - Tmin) ) );
  }

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION Irrig("irrigFrac" float, "cur_Transp" float, "cur_Intcptn" float, "date_ppt" float) RETURNS
float AS $$

   return Math.max(0 , irrigFrac * (cur_Transp - (1 - cur_Intcptn) * date_ppt) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION CumIrrig("prev_CumIrrig" float, "cur_Irrig" float) RETURNS
float AS $$

   return prev_CumIrrig + cur_Irrig;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_CumIrrig() RETURNS
float AS $$

  return 0; 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION fAge("prev_StandAge" float, "maxAge" float, "rAge" float, "nAge" float) RETURNS
float AS $$

  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (prev_StandAge / maxAge) / rAge) , nAge) ) );
  }

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_fAge("cur_StandAge" float, "maxAge" float, "rAge" float, "nAge" float) RETURNS
float AS $$

  if (nAge==0){
    return 1;
  } else{
    return (1 / (1 + Math.pow( ( (cur_StandAge / maxAge) / rAge) , nAge) ) );
  }

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION fSW("prev_ASW" float, "maxAWS" float, "swconst" float, "swpower" float) RETURNS
float AS $$

   return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (prev_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_fSW("cur_ASW" float, "maxAWS" float, "swconst" float, "swpower" float) RETURNS
float AS $$

  return 1 / (1 + Math.pow( (Math.max(0.00001 , (1 - (cur_ASW / 10 / maxAWS) ) / swconst) ) , swpower) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION fNutr("fN0" float, "FR" float) RETURNS
float AS $$

  return fN0 + (1 - fN0) * FR;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION PhysMod("cur_fVPD" float, "cur_fSW" float, "cur_fAge" float) RETURNS
float AS $$

   return Math.min(cur_fVPD , cur_fSW) * cur_fAge;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION LAI("prev_WF" float, "SLA1" float, "SLA0" float, "prev_StandAge" float, "tSLA" float) RETURNS
float AS $$

   return prev_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (prev_StandAge / tSLA) , 2) ) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_LAI("cur_WF" float, "SLA1" float, "SLA0" float, "cur_StandAge" float, "tSLA" float) RETURNS
float AS $$

  return cur_WF * 0.1 * (SLA1 + (SLA0 - SLA1) * Math.exp(-0.693147180559945 * Math.pow( (cur_StandAge / tSLA) , 2) ) ); 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION CanCond("MaxCond" float, "cur_PhysMod" float, "cur_LAI" float, "LAIgcx" float) RETURNS
float AS $$

   return Math.max(0.0001 , MaxCond * cur_PhysMod * Math.min(1 , cur_LAI / LAIgcx) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION Transp("days_per_mon" float, "e20" float, "Qa" float, "Qb" float, "date_nrel" float, "date_daylight" float, "rhoAir" float, "lambda" float, "VPDconv" float, "cur_VPD" float, "BLcond" float, "cur_CanCond" float) RETURNS
float AS $$

   return days_per_mon * ( (e20 * (Qa + Qb * (date_nrel / date_daylight) ) + (rhoAir * lambda * VPDconv * cur_VPD * BLcond) ) / (1 + e20 + BLcond / cur_CanCond) ) * date_daylight * 3600 / lambda;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION NPP("prev_StandAge" float, "fullCanAge" float, "cur_xPP" float, "k" float, "prev_LAI" float, "cur_fVPD" float, "cur_fSW" float, "cur_fAge" float, "alpha" float, "fNutr" float, "cur_fT" float, "cur_fFrost" float) RETURNS
float AS $$

  var CanCover = 1;
  if (prev_StandAge < fullCanAge){
    CanCover = prev_StandAge / fullCanAge;
  } //else CanCover = 1;
  return cur_xPP * (1 - (Math.exp(-k * prev_LAI) ) ) * CanCover * Math.min(cur_fVPD , cur_fSW) * cur_fAge * alpha * fNutr * cur_fT * cur_fFrost;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_NPP("cur_StandAge" float, "fullCanAge" float, "cur_xPP" float, "k" float, "cur_LAI" float, "cur_fVPD" float, "cur_fSW" float, "cur_fAge" float, "alpha" float, "fNutr" float, "cur_fT" float, "cur_fFrost" float) RETURNS
float AS $$

 return 0;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION litterfall("gammaFx" float, "gammaF0" float, "prev_StandAge" float, "tgammaF" float, "prev_lastCoppiceAge" float) RETURNS
float AS $$

  var prev_realStandAge = prev_StandAge - prev_lastCoppiceAge;
  Logger.log("DEBUGGING COPPICE: prev_StandAge=" + prev_StandAge +"; prev_realStandAge=" + prev_realStandAge);
  return gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * prev_realStandAge / tgammaF) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_litterfall("gammaFx" float, "gammaF0" float, "cur_StandAge" float, "tgammaF" float) RETURNS
float AS $$

  
  var result = gammaFx * gammaF0 / (gammaF0 + (gammaFx - gammaF0) *  Math.exp(-12 * Math.log(1 + gammaFx / gammaF0) * cur_StandAge / tgammaF) );
  //Logger.log("DEBUGGING: " + result);
  return result;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION pS("prev_WS" float, "StockingDensity" float, "StemConst" float, "StemPower" float, "cur_pR" float, "pfsConst" float, "pfsPower" float) RETURNS
float AS $$

  var avDBH = Math.pow( ( (prev_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_pS("cur_WS" float, "StockingDensity" float, "StemConst" float, "StemPower" float, "cur_pR" float, "pfsConst" float, "pfsPower" float) RETURNS
float AS $$

  var avDBH = Math.pow( ( (cur_WS * 1000 / StockingDensity) / StemConst) , (1 / StemPower) );
  return (1 - cur_pR) / (1 + ( pfsConst * Math.pow(avDBH , pfsPower) ) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION pR("pRx" float, "pRn" float, "cur_PhysMod" float, "m0" float, "FR" float) RETURNS
float AS $$

  return (pRx * pRn) / (pRn + (pRx - pRn) * cur_PhysMod * (m0 + (1 - m0) * FR) );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION pF("cur_pR" float, "cur_pS" float) RETURNS
float AS $$

  return 1 - cur_pR - cur_pS;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION WF("cur_pF" float, "prev_WF" float, "cur_NPP" float, "cur_litterfall" float) RETURNS
float AS $$

   return prev_WF + cur_NPP * cur_pF - cur_litterfall * prev_WF;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_WF("StockingDensity" float, "SeedlingMass" float) RETURNS
float AS $$

  return 0.5 * StockingDensity * SeedlingMass; 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION WR("prev_WR" float, "cur_NPP" float, "cur_pR" float, "Rttover" float) RETURNS
float AS $$

   return prev_WR + cur_NPP * cur_pR - Rttover * prev_WR;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_WR("StockingDensity" float, "SeedlingMass" float) RETURNS
float AS $$

  return 0.25 * StockingDensity * SeedlingMass; 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION WS("prev_WS" float, "cur_NPP" float, "cur_pS" float) RETURNS
float AS $$

   return prev_WS + cur_NPP * cur_pS;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_WS("StockingDensity" float, "SeedlingMass" float) RETURNS
float AS $$

  return 0.25 * StockingDensity * SeedlingMass; 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION W("cur_WF" float, "cur_WR" float, "cur_WS" float) RETURNS
float AS $$

  return cur_WF + cur_WR + cur_WS;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION StandAge("prev_StandAge" float) RETURNS
float AS $$

  return prev_StandAge + 1.0/12;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION init_StandAge() RETURNS
float AS $$

  return 1.0 / 12; 

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION PAR("date_rad" float, "molPAR_MJ" float) RETURNS
float AS $$

  return date_rad * 30.4 * molPAR_MJ;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION xPP("y" float, "cur_PAR" float, "gDM_mol" float) RETURNS
float AS $$

  return y * cur_PAR * gDM_mol / 100;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION coppice_pfs("prev_WS" float, "StockingDensity" float, "cpStemsPerStump" float, "cpStemConst" float, "cpStemPower" float, "cpPfsConst" float, "cpPfsPower" float, "cpMaxPfs" float) RETURNS
float AS $$

  var avDOB = Math.pow( ( (prev_WS * 1000 / StockingDensity / cpStemsPerStump) / cpStemConst) , (1 / cpStemPower) );
  var ppfs= cpPfsConst * Math.pow(avDOB , cpPfsPower);
  return Math.min(cpMaxPfs,ppfs);

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION coppice_pS("cur_pR" float, "pfs" float) RETURNS
float AS $$

  return (1 - cur_pR) / (1 + 1/pfs );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION coppice_pF("cur_pR" float, "pfs" float) RETURNS
float AS $$

    return (1 - cur_pR) / (1 + 1/pfs );

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION coppice_RootPP("cur_npp" float, "cur_nppTarget" float, "WR" float, "W" float, "pRx" float, "cpRootStoragePct" float, "cpRootLAITarget" float) RETURNS
float AS $$

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

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION coppice_NPP("cur_npp" float, "coppice_RootPP" float) RETURNS
float AS $$

  //var npp = NPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost);
//  var rootPP = coppice_RootPP(prev_StandAge, fullCanAge, cur_xPP, k, prev_LAI, cur_fVPD, cur_fSW, cur_fAge, alpha, fNutr, cur_fT, cur_fFrost,WR,W,pRx,cpRootStoragePct);
  return cur_npp+coppice_RootPP;

$$ LANGUAGE plv8 IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION coppice_WR("prev_WR" float, "cur_NPP" float, "cur_pR" float, "Rttover" float, "coppice_RootPP" float) RETURNS
float AS $$

  //Logger.log("DEBUGGING COPPICE: prev_WR=" + prev_WR + "; cur_NPP=" + cur_NPP + "; cur_pR=" + cur_pR + "; Rttover=" + Rttover+ "; coppice_RootPP=" + coppice_RootPP);
   return prev_WR, prev_WR + cur_NPP * cur_pR - Rttover * prev_WR - coppice_RootPP;

$$ LANGUAGE plv8 IMMUTABLE STRICT;


CREATE TYPE weather as (tmin float,
tmax float,
tdmean float,
ppt float,
rad float,
daylight float
);
CREATE TYPE soil as (maxaws float,
swpower float,
swconst float
);
CREATE TYPE plantation_state as (Date float,
VPD float,
fVPD float,
fT float,
fFrost float,
PAR float,
xPP float,
Intcptn float,
ASW float,
CumIrrig float,
Irrig float,
StandAge float,
LAI float,
CanCond float,
Transp float,
fSW float,
fAge float,
PhysMod float,
pR float,
pS float,
litterfall float,
NPP float,
WF float,
WR float,
WS float,
W float
);
CREATE TYPE tree as (fullCanAge float,
kG float,
alpha float,
Tmax float,
Tmin float,
Topt float,
BLcond float,
maxAge float,
rAge float,
nAge float,
fN0 float,
FR float,
SLA0 float,
SLA1 float,
tSLA float,
MaxCond float,
LAIgcx float,
MaxIntcptn float,
LAImaxIntcptn float,
e20 float,
rhoAir float,
lambda float,
VPDconv float,
Qa float,
Qb float,
m0 float,
pRx float,
pRn float,
pfsPower float,
pfsConst float,
pfsMax float,
StemConst float,
StemPower float,
wSx1000 float,
thinPower float,
irrigFrac float,
StockingDensity float,
SeedlingMass float,
y float,
maxAWS float,
swpower float,
swconst float,
cpStemsPerStump float,
cpStemConst float,
cpStemPower float,
cpMaxPfs float,
cpPfsPower float,
cpPfsConst float,
cpRootStoragePct float,
cpRootLAITarget float
);
CREATE TYPE constants as (gammaFx float,
gammaF0 float,
tgammaF float,
Rttover float,
k float,
days_per_mon float,
gDM_mol float,
molPAR_MJ float
);
DROP TABLE trees;
CREATE TABLE trees OF tree;
INSERT INTO trees (fullCanAge, kG, alpha, Tmax, Tmin, Topt, BLcond, maxAge, rAge, nAge, fN0, FR, SLA0, SLA1, tSLA, MaxCond, LAIgcx, MaxIntcptn, LAImaxIntcptn, e20, rhoAir, lambda, VPDconv, Qa, Qb, m0, pRx, pRn, pfsPower, pfsConst, pfsMax, StemConst, StemPower, wSx1000, thinPower, irrigFrac, StockingDensity, SeedlingMass, y, maxAWS, swpower, swconst, cpStemsPerStump, cpStemConst, cpStemPower, cpMaxPfs, cpPfsPower, cpPfsConst, cpRootStoragePct, cpRootLAITarget) VALUES (0, 0.5, 0.0177, 40, 5, 20, 0.2, 50, 0.95, 4, 1, 0.7, 10.8, 10.8, 1, 0.02, 3.33, 0.15, 0, 2.2, 1.2, 2460000, 0.00622, -90, 0.8, 0, 0.8, 0.25, -1.161976, 1.91698, 5, 0.0771, 2.2704, 300, 1.5, 1, 2500, 0.001, 0.47, 15.4574230821395, 4.6, 0.48, 4.4, 0.18, 2.4, 5, -1.161976, 1.91698, 0.15, 4);
