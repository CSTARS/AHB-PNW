function getEnv() {
	return plv8 ? "plv8" : "ss";
}

/** this function with use default value when user value not provided. Otherwhise NA? */
function defaultOrUser(defaultVal, userVal) {
  if (userVal == undefined || userVal==""){
   return defaultVal;
  } else {
    return userVal;
  }
}


function readAllConstants(){
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
} 

function readWeather(){
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
}

// cross env logger
function log(msg) {
	if( Logger ) Logger.log(msg);
	if( plv8 ) plv8.elog(NOTICE, msg);
}

//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var functions = "";
		var fList = ["readWeather", "readAllConstants", "defaultOrUser", "log"];
		
		for( var i = 0; i < fList.length; i++ ) {
			functions += eval('('+fList[i]+'.toString())');
		}
		return functions;
	}
}