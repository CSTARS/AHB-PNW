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
	    
	    log(keyValMap);

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
	},
	
	_readWeatherPlv8 : function() {
		// TODO
	},
	
	dump : function(rows) {
		if( env() == "appscript" ) return m3PGIO._writeRowsToSheet(rows);
		else if( env() == "plv8" ) return m3PGIO._setResponse(rows);
		
		// badness
		log("Error: unknown env in 3PG.io.dump - "+env());
		return null;
	},
	
	_writeRowsToSheet : function(rows){
		  var spreadsheet =
		      SpreadsheetApp.getActiveSpreadsheet();
		  var resultSheet = spreadsheet.getSheetByName(m3PGIO.config.output); //TODO: decide on where this can be taken out into. Output
		  //below start with second row, leave first one untouched
		  
		  var range = resultSheet.getRange(1, 1,
		      rows.length, rows[0].length);
		  range.setValues(rows);
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