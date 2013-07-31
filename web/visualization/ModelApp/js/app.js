function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

app.loadModelCode = function(version, callback) {
	if( typeof version === 'function' ) callback = version;
	if( !version || typeof version != 'string' ) version = "master";
	
	$.ajax({
		url : "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/Model3PG.js?ref="+version,
		success: function(data, status, xhr) {
			// clean then base64 decode file content
			// finally, eval js
			eval(atob(data.content.replace(/[\s\n]/g,'')));
			
			// set m3PG object to window scope
			window.m3PG = m3PG;
			
			$.ajax({
				url : "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/SingleRunFunctions.js?ref="+version,
				success: function(data, status, xhr) {
					eval(atob(data.content.replace(/[\s\n]/g,'')));
					window.m3PGFunc = m3PGFunc;
					callback();
				},
				error : function() {
					alert("Failed to load SingleRunFunctions.js from github");
				}
			});
		},
		error : function() {
			alert("Failed to load Model3PG.js from github");
		}
	});
}



app.loadSpreadsheetData = function(callback) {
	
	var rootUrl = "https://docs.google.com/spreadsheet/tq?key="+app.spreadsheet.id+"&gid=";
	var loadCount = 0;
	
	var metadataQuery = new google.visualization.Query(rootUrl+app.spreadsheet.worksheets.metadata);
	var constantsQuery = new google.visualization.Query(rootUrl+app.spreadsheet.worksheets.constants);
	
	metadataQuery.setQuery('');
	constantsQuery.setQuery('');
	
	metadataQuery.send(function(response){
		app.spreadsheet.dataTables["metadata"] = response;
		check();
	});
	
	constantsQuery.send(function(response){
		app.spreadsheet.dataTables["constants"] = response;
		check();
	});
	
	function check() {
		loadCount++;
		if( loadCount == 2 && callback ) callback(); 
	}
	
}

app.init = function(callback) {
	
	var metaTable = new google.visualization.Table($("#metadata")[0]);
	metaTable.draw(app.spreadsheet.dataTables.metadata.getDataTable(), {});

	app.createConstantInputs(app.spreadsheet.dataTables.constants.getDataTable().toJSON(),
			app.spreadsheet.dataTables.metadata.getDataTable().toJSON());
	app.createInputs(function(){
		
		$(".minput").on('blur', function(){
			app.runModel();
		});
		
		$('a[data-toggle=tooltip]').tooltip({})
		
		callback();
	});
		
}

app.createConstantInputs = function(table, metadata) {
	table = JSON.parse(table);
	metadata = JSON.parse(metadata);
	
	var ele = $("#constants");
	
	var nameCol = 0;
	var inputCol = 0;
	for( var i = 0; i < table.cols.length; i++ ) {
		if( table.cols[i].label == "constant" ) nameCol = i;
		else if( table.cols[i].label == "default_value" ) inputCol = i;
	}
	
	var metadataMap = app.getMetadataMap(metadata);
	
	var variationAnalysisInput = $("#variationAnalysisInput");
	var html = "<table class='table table-striped'>";
	for( var i = 0; i < table.rows.length; i++ ) {
		var val = table.rows[i].c[nameCol].v;
		html += "<tr><td>"+( metadataMap[val.toLowerCase()] ? "<a data-toggle='tooltip' title data-original-title='"+metadataMap[val.toLowerCase()]+"'>"+val+"</a>" : val)+"</td>"+
				"<td><input id='input-const-"+val+"' class='minput const' style='height:30px' placeholder='"+
				table.rows[i].c[inputCol].v+"' value='"+table.rows[i].c[inputCol].v+"' type='text'  /></td></tr>";
		variationAnalysisInput.append($("<option value='"+val+"'>"+val+"</option>"))
	}
	ele.html(html+"</table>");
	
}

app.getMetadataMap = function(metadata) {
	var map = {};
	var mKeyCol = 0;
	var mValCal = 0;
	
	for( var i = 0; i < metadata.cols.length; i++ ) {
		if( metadata.cols[i].label.match(/3PGpjs.*/) ) mKeyCol = i;
		else if( metadata.cols[i].label.match(/Parameter description.*/) ) mValCal = i;
	}
	
	for( var i = 0; i < metadata.rows.length; i++ ) {
		map[metadata.rows[i].c[mKeyCol].v.toLowerCase()] = metadata.rows[i].c[mValCal].v;
	}
	
	return map;
}

app.createInputs = function(callback) {
	var ele = $("#inputs");
	
	var cols = app.inputs.weather;
	var table = "<table class='table table-striped'>";

	table += "<tr>";
	for( var i = 0; i < cols.length; i++ ) {
		table += "<td>"+cols[i]+"</td>";
	}
	table += "</tr>";
	
	for( var i = 0; i < 12; i++ ) {
		table += "<tr>";
		for( var j = 0; j < cols.length; j++ ) {
			if( j == 0 ) {
				table += "<td>"+(i+1)+"</td>";
			} else {
				table += "<td><input class='minput' id='input-weather-"+cols[j]+"-"+i+"' type='text' style='width:50px;height:40px' /></td>";
			}
		}
		table += "</tr>";
	}
	table = $(table+"</table>");
	ele.append(table);
	
	var chartTypeSelector = $("#chartTypeInput");
	for( var i = 0; i < app.outputs.length; i++ ) {
		chartTypeSelector.append($("<option value='"+app.outputs[i]+"' "+(i==0 ? 'selected' : '')+">"+app.outputs[i]+"</option>"));
	}
	
	// multiselect
	chartTypeSelector.multiselect({
      buttonClass: 'btn',
      buttonWidth: 'auto',
      buttonContainer: '<div class="btn-group" />',
      maxHeight: false,
      buttonText: function(options) {
        if (options.length == 0) {
          return 'None selected <b class="caret"></b>';
        }
        else if (options.length > 3) {
          return options.length + ' selected  <b class="caret"></b>';
        }
        else {
          var selected = '';
          options.each(function() {
            selected += $(this).text() + ', ';
          });
          return selected.substr(0, selected.length -2) + ' <b class="caret"></b>';
        }
      }
    });
	
	var variationAnalysisInput = $("#variationAnalysisInput");
	variationAnalysisInput.on('change', function(){
		var val = variationAnalysisInput.val();
		
		if( val == "" || val == "None" ) {
			$("#multiRunVarInputs-outer").hide();
			return;
		}
		
		$("#multiRunVarInputs-outer").show();
		$("#multiRunVarInputs").val($("#input-const-"+val).val());
	});
	
	// load the lat lng data if it exsits
	var ll = qs("ll");
	if( ll ) {
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToWeather("+ll+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			var table = JSON.parse(response.getDataTable().toJSON());
			
			for( var i = 0; i < table.rows.length; i++ ) {
				for( var j = 1; j < table.cols.length; j++ ) {
					$("#input-weather-"+cols[j]+"-"+i).val(table.rows[i].c[j].v);
				}
			}
			
			check();
		});
		
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToSOIL("+ll+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			var table = JSON.parse(response.getDataTable().toJSON());
			for( var i = 0; i < table.cols.length; i++ ) {
				$("#input-soil-"+table.cols[i].id).val(table.rows[0].c[i].v);
			}
			
			check();
		});
		
		
	} else {
		callback();
	}
	
	var loaded = 0;
	function check() {
		loaded++;
		if( loaded == 2 && callback ) callback();
	}
	
}

app.runComplete = function(rows) {
	if( app.runCallback ) app.runCallback(rows);
	app.runCallback = null;
}

app.runModel = function() {
	
	var variation = $("#variationAnalysisInput").val();
	var runCount = 0;
	
	if( variation == "" || variation == "None" ) {
		
		app.runCallback = function(rows) {
			app.showResults(rows);
		}
		m3PG.run(parseInt($("#monthsToRun").val()));
		
	} else {

		app.runVariation(0, [], variation, $("#multiRunVarInputs").val().replace(/\s/g,'').split(","));
		
	}
}

app.runVariation = function(index, rows, type,  variations) {
	
	$("#input-const-"+type).val(variations[index]);
	
	app.runCallback = function(data) {
		rows.push(data);
		index++;
		if( variations.length == index ) {
			// reset the constant to the first value
			$("input-const-"+type).val(variations[0]);
			app.showResults(rows);
		} else {
			app.runVariation(index, rows, type, variations);
		}
	}
	
	m3PG.run(parseInt($("#monthsToRun").val()));
}


app.showResults = function(rows) {
	if( typeof rows[0][0] != "object" ) rows = [rows];
	
	app.showRawOutput(rows);
	
	$("#chart").html("");
	var types = $("#chartTypeInput").val();
	for( var i = 0; i < types.length; i++ ){
		app.showChart(types[i], rows);
	}
	
}

app.showChart = function(type, rows) {
	var panel = $("<div />");
	$("#chart").append(panel);
	
	var col = 0;
	var data = [["month"]];
	
	var vType = $("#variationAnalysisInput").val();
	var variations = $("#multiRunVarInputs").val().replace(/\s/g,'').split(",");
	
	for( var i = 0; i < rows.length; i++ ) {
		data[0].push(type+" "+(vType != "None" ? "("+vType+"="+variations[i]+")" : ""));
	}
	
	for( var i = 0; i < rows[0][0].length; i++ ) {
		if( rows[0][0][i] == type ) {
			col = i;
			break;
		}
	}

	for( var i = 1; i < rows[0].length; i++ ) {
		if( typeof rows[0][i][col] === 'string' ) continue;
		var row = [i];
		for( var j = 0; j < rows.length; j++ ) {
			row.push(rows[j][i][col]);
		}
		data.push(row);
	}

	var dt = google.visualization.arrayToDataTable(data);
	
	var chart =  new google.visualization.LineChart(panel[0]);
	chart.draw(dt, {});
}


app.showRawOutput = function(data) {
	
	var tabs = $('<ul class="nav nav-tabs" id="rawOutputTabs"  data-tabs="tabs"></ul>');
	var contents = $('<div class="tab-content"></div>');
	
	var vType = $("#variationAnalysisInput").val();
	var variations = $("#multiRunVarInputs").val().replace(/\s/g,'').split(",");
	
	for( var i = 0; i < data.length; i++ ) {
		tabs.append($('<li '+(i == 0 ? 'class="active"' : "")+'><a href="#rawout'+i+'" data-toggle="tab">Output '+
				(vType == 'None' ? '' : '('+vType+'='+variations[i]+')')+'</a></li>'));
		contents.append($('<div class="tab-pane '+(i == 0 ? 'active' : "")+'" id="rawout'+i+'"></div>'));
	}
	$("#output").html("").append(tabs).append(contents);
	$("#rawOutputTabs").tab();
	
	for( var i = 0; i < data.length; i++ ) {
		// remove 'string' rows
		var clean = [data[i][0]];
		for( var j = 1; j < data[i].length; j++ ) {
			if( typeof data[i][j][1] != "string" ) clean.push(data[i][j]);
		}
		
		var dt = google.visualization.arrayToDataTable(clean);
		var table = new google.visualization.Table($("#rawout"+i)[0]);
		table.draw(dt, {});
	}
}


// using our own m3PGIO lib
m3PGIO = {
		readAllConstants : function(keyValMap) {
			var constants = $(".const");
			
			for( var i = 0; i < constants.length; i++ ) {
				var ele = $(constants[i]);
				keyValMap[ele.attr("id").replace("input-const-","")] = parseFloat(ele.val());
				// TODO: make sure all constants are set
			}
			return keyValMap;
		},
		readWeather : function(weatherMap, soilMap, dateMap) {
			// TODO: implement
		    soilMap.maxaws = parseFloat($("#input-soil-maxaws").val());
	        soilMap.swpower = parseFloat($("#input-soil-swpower").val());
	        soilMap.swconst = parseFloat($("#input-soil-swconst").val());
	        
	        var datePlanted = $("#input-date-datePlanted").val();
	        if( datePlanted && datePlanted != "" ) {
	        	dateMap.datePlanted = new Date($("#input-date-datePlanted").val());
	        } else {
	        	dateMap.datePlanted = new Date();
	        }
	        
	        var dateCoppiced = $("#input-date-dateCoppiced").val();
	        if( dateCoppiced && dateCoppiced != "" ) {
	        	dateMap.dateCoppiced = new Date($("#input-date-dateCoppiced").val());
	        }
	        
	        var yearsPerCoppice = $("#input-date-yearsPerCoppice").val();
	        if( yearsPerCoppice && yearsPerCoppice != "" ) {
	        	dateMap.yearsPerCoppice = parseInt($("#input-date-yearsPerCoppice").val());
	        }
			
			for( var i = 0; i < 12; i++ ) {
				var item = {
					month : (i+1)
				};
				for( var j = 1; j < app.inputs.weather.length; j++ ) {
					var c = app.inputs.weather[j];
					item[c] = parseFloat($("#input-weather-"+c+"-"+i).val());	
				}
				item.nrel = item.rad / 0.0036;
				
				weatherMap[i] = item;
			}
			
			return weatherMap;
		},
		dump : function(rows, sheet) {
		    // set the raw output
			app.runComplete(rows);
		}
};