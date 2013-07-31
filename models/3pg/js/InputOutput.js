var m3PGIO = {
  
  config : {
    // spreadsheet or table where the input contstants are stored
    constansts : "input_constants",
    
    // spreadsheet or table where the input weather/soil/planted data is stored
    weather    : "Weather",
    
    // for the spreadsheet, these are the row headers of the planted, coppice and soil
    // data input parameters
    spreadsheet : {
      plantedDateHeader     : "Planted Date:",
      coppiceDateHeader     : "Coppice Date:",
      coppiceIntervalHeader : "Coppice Interval Years:",
      soilDataHeader        : "Soil Data:"
    },
    
    // for spreadsheet only, this is the sheet to write the results to
    // NOTE: postgres will just dump the table as output
    output : "Output"
  },
  
  readAllConstants : function(keyValMap) {
    if( env() == "appscript" ) return m3PGIO._readAllConstantsAppscript(keyValMap);
    else if( env() == "plv8" ) return m3PGIO._readAllConstantsPlv8(keyValMap);
    
    // badness
    log("Error: unknown env in 3PG.io.readAllConstants - "+env());
    return null;
  },
  
  _readAllConstantsAppscript : function(keyValMap) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //Hardcoded 3PG spreadsheet id
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName(m3PGIO.config.constansts); 
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
    
    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      keyValMap[rowData[0]] = rowData[3];
    } 
    
    //log(keyValMap);
    
    return keyValMap;
  },
  
  _readAllConstantsPlv8 : function(keyValMap) {
    // TODO
  },
  
  testReadWeather : function() {
    var weatherMap = {};
    var soilMap = {};
    var dateMap = {};
    readWeather(weatherMap, soilMap, dateMap);
  },
  
  readWeather : function(weatherMap, soilMap, dateMap) {
    if( env() == "appscript" ) return m3PGIO._readWeatherAppScript(weatherMap, soilMap, dateMap);
    else if( env() == "plv8" ) return m3PGIO._readWeatherPlv8(weatherMap, soilMap, dateMap);
    
    // badness
    log("Error: unknown env in 3PG.io.readWeather - "+env());
    return null;
  },
  
  _readWeatherAppScript : function(weatherMap, soilMap, dateMap) {
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
          //NOTICE: Order matters! TODO: make it not matter (read order from sheet)
          soilMap["maxaws"] = rowData[1];
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
  },
  
  _readWeatherPlv8 : function() {
    // TODO
  },
  
  dump : function(rows, sheet) {
    if (sheet==null || sheet==undefined) sheet = m3PGIO.config.output; //default sheet
    if( env() == "appscript" ) return m3PGIO._writeRowsToSheet(rows, sheet);
    else if( env() == "plv8" ) return m3PGIO._setResponse(rows);
    
    // badness
    log("Error: unknown env in 3PG.io.dump - "+env());
    return null;
  },
  
  _writeRowsToSheet : function(rows, sheet){
    var spreadsheet =
        SpreadsheetApp.getActiveSpreadsheet();
    var resultSheet = spreadsheet.getSheetByName(sheet); //TODO: decide on where this can be taken out into. Output       
    var range = resultSheet.getRange(1, 1,
                                     rows.length, rows[0].length);
    range.setValues(rows);
  },
  
  writeRowsToNewSheet : function(array, newSheetName){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var existingSheet = spreadsheet.getSheetByName(newSheetName);
    var resultSheet;
    if (existingSheet!=null && existingSheet != undefined && existingSheet!=""){
      resultSheet = existingSheet;
    }
    else {
      spreadsheet.insertSheet(newSheetName); 
      resultSheet = spreadsheet.getSheetByName(newSheetName);
    }
    var range = resultSheet.getRange(1, 1,
                                     array.length, array[0].length);
    range.setValues(array);
  },
  
  writeRowsToSheetWithOffset : function(array, sheet, offsetFromTheLeft, offsetFromTheTop){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var resultSheet = spreadsheet.getSheetByName(sheet); //TODO: decide on where this can be taken out into. Output         
    var range = resultSheet.getRange(offsetFromTheTop, offsetFromTheLeft,
                                     array.length, array[0].length);
    range.setValues(array);
  },
  
  readTestInputs : function(sheetName){
    var keyValMap = {};
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); 
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName(sheetName); //Switch to testSetup when ready (the code is not ready for it yet) 
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
    
    for (var keyNum = 0; keyNum < keys.length; keyNum++){
      keyValMap[keys[keyNum]] = [];
    }
    
    for (var rowNumber = 1; rowNumber < data.length; rowNumber++) { //start from second row, value is in the forth column, index 3
      //Logger.log(data[rowNumber]);
      var rowData = data[rowNumber];
      for (var keyNum = 0; keyNum < keys.length; keyNum++){
        keyValMap[keys[keyNum]].push(rowData[keyNum]);
      }
    } 
    
    //Logger.log(keyValMap);
    
    return keyValMap;
  }, 
  
  getResponseJSON : function(location, requestType){
    //location
    var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointTo"+requestType+"("+location[0]+","+location[1]+",8192)&tq=SELECT%20*&tqx=reqId%3A6";
    Logger.log(url);
    var responseRaw = UrlFetchApp.fetch(url).getContentText();  
    //Is this a hack? is there a better way to do this? will the string ever change?
    var responseBeforeJSON = responseRaw.replace("google.visualization.Query.setResponse(", "").replace(");","");
    var responseJSON = JSON.parse(responseBeforeJSON);
    
    return responseJSON;
    
  },
  
  readWeatherFromRequest : function(weatherMap, soilMap, dateMap, location) { //not from spreadsheet
    //TODO: put into input-output 
    var weatherJSON = m3PGIO.getResponseJSON(location, "Weather");
    var headersInOrder = [];
    for (var i=0; i< weatherJSON.table.cols.length; i++){
      headersInOrder.push(weatherJSON.table.cols[i].id);
    }  
    var keys = headersInOrder; //can use same function?
    
    //The months are 0 indexed in date utility
    
    //Scope is global of a variable after a loop. carefully name inde vars
    for (var row = 0; row < weatherJSON.table.rows.length; row++) { //indexed form 0, because no the spreadsheet rows, but th ereturned rows
      var rowData = weatherJSON.table.rows[row].c;    
      var item = {};
      for (var column = 0; column < rowData.length; column++) {      
        item[keys[column]] = rowData[column].v;
        if (keys[column] == "rad"){
          item["nrel"] = rowData[column].v / 0.0036;
        }      
      }
      //WHat is this? - referring to the commented out part
      //if (Object.getOwnPropertyNames(item).length>0){
      weatherMap[item.month-1] = item; //to start indexing at 0
      //}
    }     
    
    var soilJSON = m3PGIO.getResponseJSON(location, "Soil");
    headersInOrder = [];
    for (var i=0; i< soilJSON.table.cols.length; i++){
      headersInOrder.push(soilJSON.table.cols[i].id);
    }
    keys = headersInOrder;
    
    for (var row = 0; row < soilJSON.table.rows.length; row++) {//should be indexed from 0 when not in the context of spreadsheet row, but json row instead
      var rowData = soilJSON.table.rows[row].c;   
      var item = {};
      for (var column = 0; column < rowData.length; column++) {
        soilMap[keys[column]] = rowData[column].v;      
      }
    }
    
    return weatherMap;
  }
  
}



//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
  exports.dump = function() {
    var objStr = "m3PGIO={";
    for( var key in m3PGIO ) {
      if( typeof m3PGIO[key] == 'function' ) {
        objStr += key+":"+m3PGIO[key].toString()+",";
      } else {
        objStr += key+":"+JSON.stringify(m3PGIO[key])+",";
      }
    }
    return objStr.replace(/,$/,'')+"};";
  }
}