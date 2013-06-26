
// this is required to be copied inside spreadsheet
// ie.. it cannot be side loaded
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries;
  menuEntries = [
                  {name: "Run Tests", functionName: "runModel31Test"},
                  {name: "Model 4 Months", functionName: "runModel4"},
                  {name: "Model 2 Years", functionName: "runModel24"},
                  {name: "Model 5 Years", functionName: "runModel60"},
                  {name: "Model 10 Years", functionName: "runModel120"}];
  ss.addMenu("Action", menuEntries);
}

function runModel4(){
    m3PG.run(4);
}  

function runModel24(){
   m3PG.run(24);
}

function runModel31Test(){
  var lengthOfGrowth = 31;//growth for 31 month (2 years planted in march, cut in september assumption)
  var allTestValues = readTestInputs();

  //loop over var names, values, output var names
  
  //column names are assumed, and the lack of whitespace between comma-separated values.
  var inputVarNameArray = allTestValues["Input Variable"];
  var inputVarValsArray = allTestValues["Input Values"];
  var outputVarNamesArray = allTestValues["Output Variables"];
  
  //////////Set up the original version of the model:////////////

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

  
  
  ////////////////loop over different scenarios////////////////
  
  for (var testNum = 0; testNum<inputVarNameArray.length; testNum++){
    var inputVarName = inputVarNameArray[testNum];
    var inputVarValsAsText = inputVarValsArray[testNum];
    inputVarValsAsText.replace(/\s/g, "");
    var inputVarVals = inputVarValsAsText.split(',');
    Logger.log(inputVarVals);
    var outputVarNamesAsText = outputVarNamesArray[testNum];
    Logger.log(outputVarNamesAsText);
    outputVarNamesAsText.split(" ").join(""); //FOR some reason nothing works in removing white spaces?? FIXME: make this work later
    var outputVarNames = outputVarNamesAsText.split(',');
    Logger.log(outputVarNames);
    for (var ind = 0; ind<outputVarNames.length; ind++){
      Logger.log("||" + outputVarNames[ind] + "||");
    }
    
    //TODO: deal with output variables - AKA get only them and then print them
       
    
    var sheetName = "Test Outputs: " + inputVarName;
    runFirstTime31Test(sheetName,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap);
    for (var k = 0; k<inputVarVals.length; k++){
      runSubsequentTimes31Test(inputVarName,inputVarVals[k], k, sheetName,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap);
    }
  }
  /*
  var inputVarName = "StockingDensity";
  var inputVarVals = ["1000", "2000", "3000"];
  
  runFirstTime31Test(inputVarName);
  for (var k = 0; k<inputVarVals.length; k++){
    runSubsequentTimes31Test(inputVarName,inputVarVals[k], k);
  }*/
}  

function runFirstTime31Test(sheetName,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap){
    //assume cutting in september
  var resultRows =  m3PG.runCurrentSetup(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap);
        
      //problem: runs model one extra time
  
  //init main data structure
  var rows = [];
  var dateIndex = resultRows[0].indexOf("Date");
  for (var i = 0; i < resultRows.length; i++) {       
      Logger.log("resultRows[i][dateIndex] = " + resultRows[i][dateIndex]);
      var newRow = [];
      newRow.push(resultRows[i][dateIndex]);
      rows.push(newRow);
    }

  writeRowsToNewSheet(rows, sheetName);
}


function runSubsequentTimes31Test(inputVarName, inputVarValue, indexToPrint, sheetName,lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap){

   //NOTE: only constant variables are modifiable for now (AKA globals "g")
  g[inputVarName] = inputVarValue;
  
  //big loop here
  
   //only one variable supported at the moment - need to change writing to rows for more
  var outputVariable = "NPP"
  var header = outputVariable + "," + inputVarName + "=" + inputVarValue; //TODO: deal with upper/lower cases?

  //TODO: take out computation part (wher you replace x values)
  
  var resultRows = m3PG.runCurrentSetup(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap);
  
  var index = resultRows[0].indexOf(outputVariable);
  
  
  //TODO write in above function
  
    var rows = [];
  // key => var inputVar = inputVars[k];
  // index = k = column to print into
  //write out test results
  
  var currentRow = [];
  currentRow.push(header);
  rows.push(currentRow); //the header is set,
  //now loop over actual results
  for (var i = 1; i < resultRows.length; i++) {       
    Logger.log("resultRows[i][index] = " + resultRows[i][index]);
    currentRow = [];
    currentRow.push(resultRows[i][index]);
    rows.push(currentRow);
  }
  
  //PROBLEM HERE (make column offset?)
  //big loop here
  writeRowsToSheetWithOffset(rows, sheetName, indexToPrint+2);
}

function writeRowsToNewSheet(array, newSheetName){
  //TODO: place into IO code
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var existingSheet = spreadsheet.getSheetByName(newSheetName);
  var resultSheet;
  if (existingSheet != undefined || existingSheet!=""){
    resultSheet = existingSheet;
  }
  else {
    resultSheet = spreadsheet.insertSheet(newSheetName);        
  }
  var range = resultSheet.getRange(1, 1,
                                   array.length, array[0].length);
  range.setValues(array);
}

function writeRowsToSheetWithOffset(array, sheet, offsetFromTheLeft){
  //TODO: place into IO code
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var resultSheet = spreadsheet.getSheetByName(sheet); //TODO: decide on where this can be taken out into. Output         
  var range = resultSheet.getRange(1, offsetFromTheLeft,
                                   array.length, array[0].length);
  range.setValues(array);
}


//TODO: place this in IO code

function readTestInputs(){
  var keyValMap = {};
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); 
  //var columns = spreadsheet.getLastColumn();
  var sheet = spreadsheet.getSheetByName("Form Responses 1"); 
  var data = sheet.getDataRange().getValues();
  var keys = data[0];  
  
  for (var keyNum = 0; keyNum < keys.length; keyNum++){
    keyValMap[keys[keyNum]] = [];
  }
  
  for (var rowNumber = 1; rowNumber < data.length; rowNumber++) { //start from second row, value is in the forth column, index 3
    Logger.log(data[rowNumber]);
    var rowData = data[rowNumber];
    for (var keyNum = 0; keyNum < keys.length; keyNum++){
      keyValMap[keys[keyNum]].push(rowData[keyNum]);
    }
  } 
  
  Logger.log(keyValMap);
  
  return keyValMap;
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
  
