function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

app.loadModelCode = function(version, callback) {
	
	// load script from a this server
	// scripts should be in /jslib
	if( app.devmode ) {
		$.getScript("jslib/Model3PG.js", function(){
			$.getScript("jslib/SingleRunFunctions.js", function(){
				$.getScript("jslib/DataModel.js", function(){
					callback();
				});
			});
		});
		return;
	}
	
	if( typeof version === 'function' ) callback = version;
	if( !version || typeof version != 'string' ) version = "master";
	
	app._requestModelCode("https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/Model3PG.js?ref="+version, function(data){
		// clean then base64 decode file content
		// finally, eval js
		eval(atob(data.content.replace(/[\s\n]/g,'')));
		
		// set m3PG object to window scope
		window.m3PG = m3PG;
		
		app._requestModelCode("https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/SingleRunFunctions.js?ref="+version, function(data){
			eval(atob(data.content.replace(/[\s\n]/g,'')));
			window.m3PGFunc = m3PGFunc;
				
			app._requestModelCode("https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/DataModel.js?ref="+version, function(data){
				eval(atob(data.content.replace(/[\s\n]/g,'')));
				app.model = model;
				callback();
			});
		});
	});
}

// github only allows 60 public requests per ip per hour.  so let's cache
// code in localstorage for one hour
app._requestModelCode = function(url, callback) {
	// see if it's cached
	if( localStorage[url] ) {
		var time = localStorage["_timestamp_"+url];
		// if the cache is less than an hour old, use cached copy
		if( new Date().getTime() - parseInt(time) < 60000 ) {
			console.log("Cache hit");
			return callback(JSON.parse(localStorage[url]));
		}
	}
	
	$.ajax({
		url : url,
		success: function(data, status, xhr) {
			// cache for later
			localStorage[url] = JSON.stringify(data);
			localStorage["_timestamp_"+url] = new Date().getTime();
			callback(data);
		},
		error : function() {
			alert("Failed to load "+url+" from github");
			callback();
		}
	});
}



app.loadSpreadsheetData = function(callback) {
	
	var rootUrl = "https://docs.google.com/spreadsheet/tq?key="+app.spreadsheet.id+"&gid=";
	var loadCount = 0;
	
	var metadataQuery = new google.visualization.Query(rootUrl+app.spreadsheet.worksheets.metadata);
	
	metadataQuery.setQuery('');

	
	metadataQuery.send(function(response){
		app.spreadsheet.dataTables["metadata"] = response;
		callback(); 
	});
	
}

app.init = function(callback) {
	
	var ele = $("#inputs-content");
	app.inputForm.create(ele);
	
	$("#runbtn").on('click', function(){
		if( $(this).hasClass("disabled") ) return;
		$(this).addClass("disabled").html("Running...");
		app.runModel();
	});
	
	app.createInputs(function(){
		callback();
	});
		
}


app.createInputs = function(callback) {
	var ele = $("#inputs-content");
	
	
	
	var chartTypeSelector = $("#chartTypeInput");
	for( var i = 0; i < app.outputs.length; i++ ) {
		var val = app.outputs[i];
		chartTypeSelector.append($("<option value='"+val+"' "+(val=='WR'||val=='WS'||val=='WF'?'selected':'')+">"+val+"</option>"));
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
	// fix bootstrap 3 style
	$("button.multiselect.dropdown-toggle.btn").addClass("btn-default");
	
	var variationAnalysisInput = $("#variationAnalysisInput");
	variationAnalysisInput.on('change', function(){
		var val = variationAnalysisInput.val();
		
		if( val == "" || val == "None" ) {
			$("#multiRunVarInputs-outer").hide();
			return;
		}
		
		$("#multiRunVarInputs-outer").show();
		$("#multiRunVarInputs").val($("#input-"+val.replace(/\./g,"-")).val());
	});
	
	callback();
	
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
	$("#input-"+type.replace(/\./g,'-')).val(variations[index]);
	
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
	
	$("#chart-content").html("");
	var types = $("#chartTypeInput").val();
	for( var i = 0; i < types.length; i++ ){
		app.showChart(types[i], rows);
	}
	
	setTimeout(function(){
		$("#runbtn").removeClass("disabled").html("<i class='icon-play'></i> Play");
	},250);
	
}

app.showChart = function(type, rows) {
	var panel = $("<div />");
	$("#chart-content").append(panel);
	
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
	var contents = $('<div class="tab-content" style="overflow:auto"></div>');
	
	var vType = $("#variationAnalysisInput").val();
	var variations = $("#multiRunVarInputs").val().replace(/\s/g,'').split(",");
	
	for( var i = 0; i < data.length; i++ ) {
		tabs.append($('<li '+(i == 0 ? 'class="active"' : "")+'><a href="#rawout'+i+'" data-toggle="tab">Output '+
				(vType == 'None' ? '' : '('+vType+'='+variations[i]+')')+'</a></li>'));
		contents.append($('<div class="tab-pane '+(i == 0 ? 'active' : "")+'" id="rawout'+i+'"></div>'));
	}
	$("#output-content").html("").append(tabs).append(contents);
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
		readAllConstants : function(plantation) {
			console.log(1);
			this.readFromInputs();
			
			for( var key in window.plantation ) plantation[key] = window.plantation[key];
			plantation.coppicedTree = window.tree;
			plantation.seedlingTree = $.extend(true, {}, window.tree);
			plantation.seedlingTree.stemsPerStump = 1;
			
		},
		readWeather : function(weatherMap, plantingParams) {
			console.log(2);
	        var datePlanted = $("#input-date-datePlanted").val();
	        if( datePlanted && datePlanted != "" ) {
	        	plantingParams.datePlanted = new Date($("#input-date-datePlanted").val());
	        } else {
	        	plantingParams.datePlanted = new Date();
	        }
	        
	        var dateCoppiced = $("#input-date-dateCoppiced").val();
	        if( dateCoppiced && dateCoppiced != "" ) {
	        	plantingParams.dateCoppiced = new Date($("#input-date-dateCoppiced").val());
	        }
	        
	        var yearsPerCoppice = $("#input-date-yearsPerCoppice").val();
	        if( yearsPerCoppice && yearsPerCoppice != "" ) {
	        	plantingParams.yearsPerCoppice = parseInt($("#input-date-yearsPerCoppice").val());
	        }
	        window.plantingParams = plantingParams;
			
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
			
			window.weather = weatherMap;
			
			return weatherMap;
		},
		dump : function(rows, sheet) {
		    // set the raw output
			app.runComplete(rows);
		},
		readFromInputs : function() {
			// read soil
			window.soil = {};
			window.soil.maxAWS = parseFloat($("#input-soil-maxaws").val());
			window.soil.swpower = parseFloat($("#input-soil-swpower").val());
			window.soil.swconst = parseFloat($("#input-soil-swconst").val());
			
			// read manage
			window.manage = {
					coppice   : false
			};
			var eles = $(".manage");
			for( var i = 0; i < eles.length; i++ ) {
				var ele = $(eles[i]);
				window.manage[ele.attr("id").replace("input-manage-","")] = parseFloat(ele.val());
			}
			
			// read plantation
			window.plantation = {};
			eles = $(".plantation");
			for( var i = 0; i < eles.length; i++ ) {
				var ele = $(eles[i]);
				window.plantation[ele.attr("id").replace("input-plantation-","")] = parseFloat(ele.val());
			}
			
			
			// read tree
			var treeInputs = $(".tree");
			window.tree = {};
			for( var i = 0; i < treeInputs.length; i++ ) {
				var ele = $(treeInputs[i]);
				
				var parts = ele.attr("id").replace("input-tree-","").split("-");
				if( parts.length == 1 ) {
					window.tree[parts[0]] = parseFloat(ele.val());
				} else {
					if( !window.tree[parts[0]] ) window.tree[parts[0]] = {};
					window.tree[parts[0]][parts[1]] = parseFloat(ele.val());
				}
			}
			
			// read plantation state
			window.plantation_state = {};
			for( var key in app.model.plantation_state.value ) {
				window.plantation_state[key] = -1;
			}
			
		},
		exportSetup : function() {
			this.readFromInputs();
			this.readWeather([], {});
			
			var ex = {
				weather          : window.weather,
				tree             : window.tree,
				plantation       : window.plantation,
				manage           : window.manage,
				soil             : window.soil,
				plantingParams   : window.plantingParam,
				plantation_state : window.plantation_state,
				config           : {
					variationAnalysisInput : $("#variationAnalysisInput").val(),
					multiRunVarInputs      : $("#multiRunVarInputs").val(),
					chartTypeInput         : $("#chartTypeInput").val(),
					monthsToRun            : $("#monthsToRun").val(),
					currentLocation        : $("#current-weather-location").val(),
					version                : qs("version") ? qs("version") : "master"
				} 
			}
			
			return ex;
		}
};