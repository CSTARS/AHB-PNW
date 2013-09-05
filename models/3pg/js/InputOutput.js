var m3PGIO = {
  
  config : {
    //spreadsheet or table where the managements choices are stored
    manage_sheet : "manage_params",
    
    // spreadsheet or table where the plantation contstants are stored
    plantation_sheet : "plantation_params",
    
    // spreadsheet or table where planted tree constants are stored
    seedlingTree_sheet : "seedlingTree_params",
    
    // spreadsheet or table where coppiced tree constants are stored
    coppicedTree_sheet : "coppicedTree_params",
    
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
  
  readAllConstants : function(plantation) {
    if( env() == "appscript" ) return m3PGIO._readAllConstantsAppscript(plantation);
    else if( env() == "plv8" ) return m3PGIO._readAllConstantsPlv8(keyValMap);//TODO: needs to change. keyValMap not available anymore
    
    // badness
    log("Error: unknown env in 3PG.io.readAllConstants - "+env());
    return null;
  },
  
  _readAllConstantsAppscript : function(plantation) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); 
    //var columns = spreadsheet.getLastColumn();
    
    //Read Plantation parameters
    
    sheet = spreadsheet.getSheetByName(m3PGIO.config.plantation_sheet); 
    data = sheet.getDataRange().getValues();
    keys = data[0];  
    
    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      plantation[rowData[0]] = rowData[3];
    } 
    
    log(plantation);
    
    //Read Tree parameters
    var sheet = spreadsheet.getSheetByName(m3PGIO.config.coppicedTree_sheet); 
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
    
    
    var tree = {}; //empty tree
    log("coppiced_tree");
    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      
      //TODO: do some error handling here
      //TODO: remove hard coded stuff - only here as a shortcut to get the code over to Justin quickly
      if (rowData[0]=="fT"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].opt = array[1];
        tree[rowData[0]].mx = array[2];
      } else if (rowData[0]=="fAge"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].f0 = array[0];
        tree[rowData[0]].f1 = array[1];
        tree[rowData[0]].tm = array[2];
        tree[rowData[0]].n = array[3];
      } else if (rowData[0]=="SLA"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].f0 = array[0];
        tree[rowData[0]].f1 = array[1];
        tree[rowData[0]].tm = array[2];
        tree[rowData[0]].n = array[3];
      } else if (rowData[0]=="Conductance"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].mx = array[1];
        tree[rowData[0]].lai = array[2];
      } else if (rowData[0]=="Intcptn"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].mx = array[1];
        tree[rowData[0]].lai = array[2];
      } else if (rowData[0]=="pR"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].mx = array[1];
        tree[rowData[0]].m0 = array[2];
      } else if (rowData[0]=="litterfall"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].f0 = array[0];
        tree[rowData[0]].f1 = array[1];
        tree[rowData[0]].tm = array[2];
        tree[rowData[0]].n = array[3];
      } else if (rowData[3]!=undefined && rowData[3]!=null && rowData[3]!=""){      
        tree[rowData[0]] = rowData[3];
        if (rowData[0]==="fullCanAge"){
         log("fullCanAge="+tree[rowData[0]]) ;
        }
      }
      log(rowData[0] + ": "  + tree[rowData[0]]);
    } 
    tree.fullCanAge = 0;
    plantation.coppicedTree = tree;
    
    spreadsheet.getSheetByName(m3PGIO.config.seedlingTree_sheet); 
    data = sheet.getDataRange().getValues();
    keys = data[0];  
    tree = {}; //empty tree object
    log("seedlingTree");
    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      
      //TODO: do some error handling here
      //TODO: remove hard coded stuff - only here as a shortcut to get the code over to Justin quickly
      if (rowData[0]=="fT"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].opt = array[1];
        tree[rowData[0]].mx = array[2];
      } else if (rowData[0]=="fAge"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].f0 = array[0];
        tree[rowData[0]].f1 = array[1];
        tree[rowData[0]].tm = array[2];
        tree[rowData[0]].n = array[3];
      } else if (rowData[0]=="SLA"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].f0 = array[0];
        tree[rowData[0]].f1 = array[1];
        tree[rowData[0]].tm = array[2];
        tree[rowData[0]].n = array[3];
      } else if (rowData[0]=="Conductance"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].mx = array[1];
        tree[rowData[0]].lai = array[2];
      } else if (rowData[0]=="Intcptn"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].mx = array[1];
        tree[rowData[0]].lai = array[2];
      } else if (rowData[0]=="pR"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].mn = array[0];
        tree[rowData[0]].mx = array[1];
        tree[rowData[0]].m0 = array[2];
      } else if (rowData[0]=="rootP"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].frac = array[0];
        tree[rowData[0]].LAITarget = array[1];
        tree[rowData[0]].efficiency = array[2];
      } else if (rowData[0]=="litterfall"){
        var array = rowData[3].split(',');
        tree[rowData[0]]={};
        tree[rowData[0]].f0 = array[0];
        tree[rowData[0]].f1 = array[1];
        tree[rowData[0]].tm = array[2];
        tree[rowData[0]].n = array[3];
      } else{      
        tree[rowData[0]] = rowData[3];
        if (rowData[0]==="fullCanAge"){
         log("fullCanAge="+tree[rowData[0]]) ;
        }
      }
      log(rowData[0] + ": "  + tree[rowData[0]]);
    } 
    tree.fullCanAge = 0; //TOF\DO fix reading from SJ!!!
    plantation.seedlingTree = tree;
    

    
    //Read Manage parameters
    
    sheet = spreadsheet.getSheetByName(m3PGIO.config.manage_sheet); 
    data = sheet.getDataRange().getValues();
    keys = data[0];  
    
    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      manage[rowData[0]] = rowData[3];
    } 
    
    log(manage);
    
  },
  
  _readAllConstantsPlv8 : function(keyValMap) {
    // TODO
  },
  
  readWeather : function(weatherMap, plantingParams) {
    
    if( env() == "appscript" ) return m3PGIO._readWeatherAppScript(weatherMap, plantingParams);
    else if( env() == "plv8" ) return m3PGIO._readWeatherPlv8(weatherMap, soilMap, dateMap);//TODO: this needs to be rewritten, because soilMap doesn't exist enymor
    
    // badness
    log("Error: unknown env in 3PG.io.readWeather - "+env());
    return null;
  },
  
  _readWeatherAppScript : function(weatherMap, plantingParams) {
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //Hardcoded 3PG spreadsheet id
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName(m3PGIO.config.weather); //weather_Davis
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
    
    //The months are 0 indexed in date utility
    
    //TODO: compare the expected column names!
    
    for (var row = 1; row < data.length; row++) {
      var rowData = data[row];
      
      var monthOfWeather = clone(weather);//new weather object
      for (var column = 0; column < keys.length; column++) {
        if ( rowData[0] == m3PGIO.config.spreadsheet.plantedDateHeader ){
          plantingParams["datePlanted"] = rowData[1];
          break;
        } else if ( rowData[0] == m3PGIO.config.spreadsheet.coppiceDateHeader ){
          plantingParams["dateCoppiced"] = rowData[1];
          break;
        } else if ( rowData[0]== m3PGIO.config.spreadsheet.coppiceIntervalHeader ){
          plantingParams["yearsPerCoppice"] = rowData[1];
          break;
        } else if ( rowData[0] == m3PGIO.config.spreadsheet.soilDataHeader ){
          //NOTICE: Order matters! TODO: make it not matter (read order from sheet)
          soil.maxAWS = rowData[1];
          soil.swpower = rowData[2];
          soil.swconst = rowData[3];
          break;
        }
        
        if (rowData[column] != undefined && rowData[column] != null && rowData[column] != ""){
          monthOfWeather[keys[column]] = rowData[column];
          if (keys[column] == "rad"){
            monthOfWeather["nrel"] = rowData[column] / 0.0036;
          }
        }
      }
      
      if (Object.getOwnPropertyNames(monthOfWeather).length>0){ //TODO: do something with the nulls that are extra months?
        weatherMap[row-1] = monthOfWeather; //to start indexing at 0
      }
    }       
    //var nrel = keyValMap.rad / 0.0036;
    
    log(weatherMap);
    log(plantation);
    log(soil);
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