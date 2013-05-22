

function readAllConstants(keyValMap){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //Hardcoded 3PG spreadsheet id
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName("input_constants"); 
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  

    for (var row = 1; row < data.length; row++) { //start from second row, value is in the forth column, index 3
      var rowData = data[row];
      keyValMap[rowData[0]] = rowData[3];
    } 
    
    log(keyValMap);

    return keyValMap;
} 

function test_readWeather(){
  var weatherMap = {};
  var soilMap = {};
  var dateMap = {};
  readWeather(weatherMap, soilMap, dateMap);
  
}

function readWeather(weatherMap, soilMap, dateMap){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //Hardcoded 3PG spreadsheet id
    //var columns = spreadsheet.getLastColumn();
    var sheet = spreadsheet.getSheetByName("Weather"); //weather_Davis
    var data = sheet.getDataRange().getValues();
    var keys = data[0];  
  
  //The months are 0 indexed in date utility
  
  //TODO: compare the expected column names!
  
    for (var row = 1; row < data.length; row++) {
      var rowData = data[row];
      
      var item = {};
      for (var column = 0; column < keys.length; column++) {
        if (rowData[0]=="Planted Date:"){
          dateMap["datePlanted"] = rowData[1];
          break;
        } else if (rowData[0]=="Coppice Date:"){
          dateMap["dateCoppiced"] = rowData[1];
          break;
        } else if (rowData[0]=="Coppice Interval Years:"){
          dateMap["yearsPerCoppice"] = rowData[1];
          break;
        } else if (rowData[0]=="Soil Data:"){
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
}


function writeRowsToSheet(rows){
  var spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();
  var resultSheet = spreadsheet.getSheetByName("Output"); //TODO: decide on where this can be taken out into. Output
  //below start with second row, leave first one untouched
  
  var range = resultSheet.getRange(1, 1,
      rows.length, rows[0].length);
  range.setValues(rows);
  
}

//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var functions = "";
		var fList = ["readWeather", "readAllConstants", "writeRowsToSheet"];
		
		for( var i = 0; i < fList.length; i++ ) {
			functions += eval('('+fList[i]+'.toString())');
		}
		return functions;
	}
}