
// this is required to be copied inside spreadsheet
// ie.. it cannot be side loaded

// this is required to be copied inside spreadsheet
// ie.. it cannot be side loaded
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries;
  menuEntries = [
    {name: "Run tests from sheet TestSetup", functionName: "runModelXTest"},
    {name: "2 years like GreenWood", functionName: "runModel31"},
    {name: "Model 4 Months", functionName: "runModel4"},
    {name: "Model 2 Years", functionName: "runModel24"},
    {name: "Model 5 Years", functionName: "runModel60"},
    {name: "Model 10 Years", functionName: "runModel120"}];
  ss.addMenu("Action", menuEntries);
}


function runModel31(){
  m3PG.run(31);  
}

function runModel4(){
  m3PG.run(4);
}  

function runModel24(){
  m3PG.run(24);
}


function runModelXTest(){
  // assume planted in march, cut in september
  //var allTestValues = readTestInputs("Form Responses 1");
  var allTestValues = m3PGIO.readTestInputs("TestSetup");
  var locationAsString = allTestValues["Location"][0] + "";
  
  //loop over var names, values, output var names
  
  //column names are assumed, and the lack of whitespace between comma-separated values.
  var inputVarNameArray = allTestValues["Input Variable"];
  var inputVarValsArray = allTestValues["Input Values"];
  var outputVarName = allTestValues["Output Variable"];
  
  //////////Set up the original version of the model:////////////
  
  //work with offsets and weather data later
  
  var yearToCoppice;
  var coppiceInterval;
  var monthToCoppice;
  //Global Variables Array
  
  var g = {};
  m3PGIO.readAllConstants(g); //global variables are an array of key-value pairs. INCLUDES SOIL DEPENDENT ONES - Separate?
  
  var experimentParams = {};
  experimentParams.columnOffset = 0;
  experimentParams.rowOffset = 0;
  
  Logger.log("experimentParams= " + experimentParams);
  
  //calculate fNutr and add here;
  g.fNutr=m3PGFunc.fNutr(g.fN0, g.FR);
  
  ////////////////loop over different scenarios////////////////
  for (var testNum = 0; testNum<inputVarNameArray.length; testNum++){
    var inputVarName = inputVarNameArray[testNum];
    var inputVarValsAsText = inputVarValsArray[testNum] + ""; //important hack to make sure this value is a string even when it's a single number
    inputVarValsAsText.replace(/\s/g, "");
    var inputVarVals = inputVarValsAsText.split(',');
    
    var outputVarNameAsText = outputVarName[testNum];
    outputVarNameAsText.split(" ").join(""); //FOR some reason nothing works in removing white spaces?? FIXME: make this work later
    var outputVarName = outputVarNameAsText;
    
    var weatherMap = {};
    var s = {}; //soilMap
    var dateMap = {};
    m3PGIO.readWeatherFromRequest(weatherMap, s, dateMap, locationAsString.split(","));
    //add dates of the experiment setup
    dateMap["datePlanted"] = allTestValues["Planted Date"][testNum];
    dateMap["dateCoppiced"] = allTestValues["Coppice Date"][testNum];
    dateMap["yearsPerCoppice"] = allTestValues["Coppice Interval Years"][testNum];
    var dateEnd = new Date(allTestValues["Grow Until Date"][testNum]);
    var dateStart = new Date(dateMap["datePlanted"]);
    //Logger.log(allTestValues["Grow Until Date"][testNum]);
    //Logger.log("dateStart="+dateStart+"; dateEnd=" + dateEnd+"; passed=" + ((dateEnd.getYear()-dateStart.getYear())*12 + dateEnd.getMonth()-dateStart.getMonth()));
    
    var lengthOfGrowth = ((dateEnd.getYear()-dateStart.getYear())*12 + dateEnd.getMonth()-dateStart.getMonth()); //in months
    var currentDate = new Date(dateMap["datePlanted"]);
    
    //TODO: deal with output variables - AKA get only them and then print them
    
    
    var sheetName = "Test: " + allTestValues["Test Name"][testNum];
    runFirstTimeXTest(sheetName,lengthOfGrowth,currentDate,experimentParams);
    for (var k = 0; k<inputVarVals.length; k++){
      var willCoppice = false;
      var isCoppiced = false;
      currentDate = new Date(dateMap["datePlanted"]);
      
      var plantedMonth = currentDate.getMonth();
      var currentMonth = currentDate.getMonth();
      
      if (dateMap["dateCoppiced"] != undefined){
        yearToCoppice = dateMap["dateCoppiced"].getYear();
        monthToCoppice = dateMap["dateCoppiced"].getMonth();
        coppiceInterval = dateMap["yearsPerCoppice"];
        willCoppice = true;
      }
      
      //log("Month of Planting = " + currentMonth);
      
      var step = 0;
      
      var d = weatherMap[currentMonth];
      
      //log(d);
      
      var keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS", "W"];    
      
      runSubsequentTimesXTest(inputVarName,inputVarVals[k], experimentParams, sheetName,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap,outputVarName);
    }
    
    //here we'll write the test setup at the bottom of the results so that the same setup can be rerun when we need it.
    recordTestSetupForFutureReference(allTestValues, experimentParams, sheetName, g);
  }
  
}  

function recordTestSetupForFutureReference(allTestValues, experimentParams, sheetName, g){
  var row1 = [];
  var row2 = [];
  var rows = [];
  for (var key in allTestValues){
    row1.push(key);
    row2.push(allTestValues[key]);
  }
  rows.push(row1);
  rows.push(row2);
  
  experimentParams.rowOffset = experimentParams.rowOffset + 2;
  m3PGIO.writeRowsToSheetWithOffset(rows, sheetName, 1, experimentParams.rowOffset);//write columns on the right from the last one. but on the same rows
  experimentParams.rowOffset = experimentParams.rowOffset + rows.length + 1;
  
  rows = [];
  //var row = [];
  //row.push(?? headers ??)
  for (var key in g){ //iterate over global variables
    var row = [];
    row.push(key);
    row.push(g[key]);
    rows.push(row);
  }
  
  m3PGIO.writeRowsToSheetWithOffset(rows, sheetName, 1, experimentParams.rowOffset);//write columns on the right from the last one. but on the same rows
  experimentParams.rowOffset = experimentParams.rowOffset + rows.length + 1;
  
  /**Weather/soil aren't needed = they are fetched from location. Plant copice date are also in the test setup
  var weatherMapKeys = ["month","tmin","tmax","tdmean","ppt","rad","daylight"];
  rows = []; //init rows for weather
  rows.push(weatherMapKeys);
  log(weatherMap);
  log("starts here");
  for (var monthId in weatherMap){
    log(monthId);
    var monthWeather = weatherMap[monthId];
    log(monthWeather);
    var row = [];
    for (var k=0; k<weatherMapKeys.length; k++){
      var key = weatherMapKeys[k];
      log(key);
      row.push(monthWeather[key]);
    }
    rows.push(row);
  }
  
  m3PGIO.writeRowsToSheetWithOffset(rows, sheetName, 1, experimentParams.rowOffset);//write columns on the right from the last one. but on the same rows
  experimentParams.rowOffset = experimentParams.rowOffset + rows.length + 1;
  */
}

function runFirstTimeXTest(sheetName,lengthOfGrowth,currentDate,experimentParams){
  
  //init main data structure
  var rows = [];
  var newRow = [];
  newRow.push("Date");
  newRow.push("Month Of Growth");
  //2 columns added
  experimentParams.columnOffset = 2;
  rows.push(newRow);
  experimentParams.rowOffset = experimentParams.rowOffset + 1;
  
  for (var i = 0; i < lengthOfGrowth; i++) {     
    newRow = [];
    newRow.push((currentDate.getMonth()+1) + "/" + currentDate.getYear());
    newRow.push(i);
    rows.push(newRow);
    experimentParams.rowOffset = experimentParams.rowOffset + 1;
    
    currentDate.setMonth(currentDate.getMonth() + 1);      
  }
  
  m3PGIO.writeRowsToNewSheet(rows, sheetName); 
}


function runSubsequentTimesXTest(inputVarName, inputVarValue, experimentParams, sheetName,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap,outputVariable){
  //NOTE: only constant variables are modifiable for now (AKA globals "g")
  g[inputVarName] = inputVarValue;
  
  //big loop here
  var header = outputVariable + "," + inputVarName + "=" + inputVarValue; //TODO: deal with upper/lower cases?
  
  //TODO: take out computation part (wher you replace x values)  
  var reprintHeaders = false;
  var resultRows = m3PG.runCurrentSetup(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap,reprintHeaders);  
  var index = resultRows[0].indexOf(outputVariable);
  
  var rows = [];
  // key => var inputVar = inputVars[k];
  // index = k = column to print into
  //write out test results
  
  var currentRow = [];
  currentRow.push(header);
  rows.push(currentRow); //the header is set,
  //now loop over actual results
  for (var i = 1; i < resultRows.length; i++) {       
    // Logger.log("resultRows[i][index] = " + resultRows[i][index]);
    currentRow = [];
    currentRow.push(resultRows[i][index]);
    rows.push(currentRow);
  }
  
  //PROBLEM HERE (make column offset?)
  //big loop here
  experimentParams.columnOffset = experimentParams.columnOffset + 1;
  m3PGIO.writeRowsToSheetWithOffset(rows, sheetName, experimentParams.columnOffset,1);//write columns on the right from the last one. but on the same rows
}


function runModel60(){
  m3PG.run(60);
} 

function runModel120(){
  m3PG.run(120);
}  

/** this function with use default value when user value not provided. Otherwhise NA? */
function defaultOrUser(defaultVal, userVal) {
  if (userVal == undefined || userVal==""){
    return defaultVal;
  } else {
    return userVal;
  }
}

try {
  var source = UrlFetchApp.fetch("https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/InputOutput.js").getContentText();
  eval(source);
  
  source = UrlFetchApp.fetch("https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/Model3PG.js").getContentText();
  eval(source);
  
  source = UrlFetchApp.fetch("https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/SingleRunFunctions.js").getContentText();
  eval(source);
  
}catch (e){
  Logger.log(e);
}
