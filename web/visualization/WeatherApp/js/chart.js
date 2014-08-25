ahb.chart = (function() {
	
	var vizSourceUrl = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest";
	
	var cUrl = {
		price   : "",
		weather : "",
		poplar  : "",
		soil    : ""
	}
		
	
	var cId = {
		price   : "",
		weather : "",
		poplar  : "",
		soil    : ""
	}
	
	var datatable = {
		price   : null,
		weather : null,
		poplar  : null,
		soil    : null
	}
	
	var chart = {
		price   : null,
		weather : null,
		poplar  : null,
		soil    : null
	}
	
	var cll = null;
	
	// map id's to nice labels
	var attrMap = {
		tmin     : "Min Temp",
		tmax     : "Max Temp",
		tdmean   : "Mean Dewpoint Temp",
		ppt      : "Precipitation",
		rad      : "Radiation",
		daylight : "Daylight",
		asw      : "Available Soil Water",
		irrig    : "Required Irrigation",
		trans    : "Canopy Monthly Transpiration",
		wf       : "Foliage Biomass",
		wr       : "Root Biomass",
		ws       : "Stem Biomass",
		maxaws   : "Max Available Soil Water (maxaws)",
		swpower  : "Power of Moisture Ratio Deficit (swpower)",
		swconst  : "Moisture Ratio Deficit (swconst)"
	}
	
	// chart options
    var options = {
    	weather : {
	    	title : 'Climate Chart',
	    	vAxes: [{
	    		title: "Radiation (MJ/day); Temperature (^C); Due Point (^C); Daylight (h)",
	    	    minValue : -5,
	    	    maxValue : 35
	  		},{
	  			title: "Precipitation; Water balance (mm)",
	  			minValue : -50,
	  			maxValue : 350
	  		}],
	  		hAxis: {title: "Month"},
	  		seriesType: "bars",
	  		series: {
	  			0: {type: "line", targetAxisIndex:0},
	  			1: {type: "line", targetAxisIndex:0},
	  			2: {type: "line", targetAxisIndex:1},
	  			3: {type: "area", targetAxisIndex:1},
	  			4: {targetAxisIndex:0}
	  	  },
	  	  animation:{
      		  duration: 1000,
      		  easing: 'out'
      	  },
	   },
       price : {
		  title : 'Poplar Adoption',
		  legend : {
			  position : 'right'
		  },
		  vAxis: {title: "Acres"},
		  hAxis: {title: "Poplar Price ($ / Green Ton)"},
	  	  animation : {
	  		  duration: 1000,
	  		  easing: 'out'
	  	  }
       },	
       poplar : {
        	title : 'Poplar Yields',
        	vAxes: [{
        		title: "Yield [bdt/ha]",
        	    minValue : 0,
        	    maxValue : 20
      		},{
      			title: "Transpiration [mm/mo]",
      			minValue : 0,
      			maxValue : 200
      		}],
      		hAxis: {title: ""},
      		seriesType: "line",
      		series: {
      			0: {type: "line", targetAxisIndex:1},
      			1: {type: "line", targetAxisIndex:1},
      			2: {type: "line", targetAxisIndex:1},
      			3: {type: "line", targetAxisIndex:0},
      			4: {type: "line", targetAxisIndex:0},
      			4: {type: "line", targetAxisIndex:0}
      	  	},
      	  	animation:{
      		  duration: 1000,
      		  easing: 'out'
      	 	},
      	  	// TODO: get this working
      	  	//,explorer: {
      	  	//	axis: 'horizontal'
      	  	//}
 
       },
       soil : {}
    }    

	
	function init() {
		google.setOnLoadCallback(onApiLoad);
		
		$("#weather-export-btn").on('click', function(){
			if( !datatable.weather ) return;

			var key = $("#spreadsheet-key").html();
			
			if( key.length == 0 ) {
				return alert("You must provide a spreadsheet url");
			}
			
			$(window).trigger("weather-export-event",[datatable.weather, datatable.soil, key]);
		});

	}
	
	function onApiLoad() {

		
		$(window).resize(function() {
			_resize();
		});
		
		$(window).on('change-irtype-event', function(e){
			_onIrTypeChange();
		});
		
		$(window).on('query-map-event', function(e, latlng, id){
			_query(latlng, id);
		});
		
		$(window).on('change-type-event', function(){
			$('#outer-chart-panel').hide();
			$('#bottom-charts').css("visibility", "hidden");
			$('#chart-panel').html("");
			chart = {
				price   : null,
				weather : null,
				poplar  : null,
				soil    : null
			};
			_resize();
		});
		
		$('#chart-panel').html("");
	}
	
	function _resize() {
		if( chart == null ) return;
		if( ahb.type == "weather" ) {
			_remake('poplar');
			_remake('weather');
			_remake('soil');
		} else {
			_remake('price');	
		}
	}
	
	function _query(latLng, id) {
		cId = id;
	    cll = latLng;
		
	    $('#outer-chart-panel').show();

		if( ahb.type == 'weather' ) {
			$('#chart-panel-loading').show();

			$('#bottom-charts').css("visibility", "visible");
			$('#outer-weather-chart-panel').show();
			$('#outer-soil-chart-panel').show();
			_resize();

			cUrl.weather = vizSourceUrl+'?view=pointToWeather('+latLng.lng()+','+latLng.lat()+',8192)';
			cUrl.poplar = vizSourceUrl+'?view=pointTo3pg('+latLng.lng()+','+latLng.lat()+',8192,\''+ahb.irType+'\')';
			cUrl.soil = vizSourceUrl+'?view=pointToSOIL('+latLng.lng()+','+latLng.lat()+',8192)';
		
			var wQuery = new google.visualization.Query(cUrl.weather);
			var pQuery = new google.visualization.Query(cUrl.poplar);
			var sQuery = new google.visualization.Query(cUrl.soil);
			
			wQuery.setQuery('SELECT *');
			pQuery.setQuery('SELECT *');
			sQuery.setQuery('SELECT *');
			
			wQuery.send(function(response){
				handleQueryResponse("weather", response)
			});
			pQuery.send(function(response){
				handleQueryResponse("poplar", response)
			});
			sQuery.send(function(response){
				handleQueryResponse("soil", response)
			});

			$("#weather-nav").show();
            $("#soil-nav").show();
            $("#data-nav").show();
			
		} else {
			$('#bottom-charts').css("visibility", "hidden");
			_resize();
			
			cUrl.price = vizSourceUrl+"?view=bcam_commodity_predictions('"+id+"')";
			
			var pQuery = new google.visualization.Query(cUrl.price);
	       
			pQuery.setQuery('SELECT *');
			
			pQuery.send(function(response){
				handleQueryResponse("price", response)
			});

			$("#weather-nav").hide();
            $("#soil-nav").hide();
            $("#data-nav").show();
		}
		
		$('html, body').animate({
			scrollTop: $("#outer-chart-panel").offset().top-55
		}, 700);
		
	}
	
	function _onIrTypeChange() {
		if( cll == null ) return;

		$('#chart-panel-loading').show();

		cUrl.poplar = vizSourceUrl+'?view=pointTo3pg('+cll.lng()+','+cll.lat()+',8192,\''+ahb.irType+'\')';

		var query = new google.visualization.Query(cUrl.poplar);
	    query.setQuery('SELECT *');
	    
	    query.send(function(response){
			handleQueryResponse("poplar", response)
		});
	}
	
	function _createDownload(type, filename) {
		var id = "download-panel";
		if( type == "soil" ) id = type+"-"+id;
		else if( type == "weather" ) id = type+"-"+id;
		
		var panel = $("#"+id);
		panel.html("");
		
		filename = type+"_"+filename;
		
		panel.append($('<a class="btn btn-default pull-left" href="'+cUrl[type]+'&tq=select *&tqx=out:csv;outFileName:'+filename+'"><i class="icon-table"></i><span class="hidden-xs">&nbspDownload CSV</span></a>'));
		
		if( type != "soil") {
			var print = $('<a class="btn btn-default pull-left" style="margin-left:5px"><i class="icon-print"></i><span class="hidden-xs">&nbspPrintable Version</span></a>')
				.on('click', function(){
					window.open(chart[type].getImageURI());
				});
			panel.append(print);
		}


		panel.append($('<a class="btn btn-default pull-right" href="'+cUrl[type]+'&tq=select *" target="_blank"><i class="icon-link"></i><span class="hidden-xs">&nbspSource</span></a>'));
	}
	
	function handleQueryResponse(type, response) {
		datatable[type] = null;
		$('#chart-panel-loading').hide();
		
	    if (response.isError()) {
	      alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
	      return;
	    }

	    datatable[type] = _setLabels(response.getDataTable());
	    
	    // create download url 
	    var id = cId;
	    if( ahb.type == 'weather' ) {
	    	id = _formatLL(cll.lng())+'__'+_formatLL(cll.lat());
	    }
	    
	    _createDownload(type, id);
	    
	    if( chart[type] == null ) _remake(type);
	    else _redraw(type);
	}
	
	function _setLabels(dt) {
		for( var i = 0; i < dt.getNumberOfColumns(); i++ ) {
			if( attrMap[dt.getColumnId(i)] ) {
				dt.setColumnLabel(i, attrMap[dt.getColumnId(i)]);
			}
		}
		return dt;
	}

	function _formatLL(val) {
		val = val+"";
		var parts = val.split(".");
		if( parts[1] && parts[1] > 3 ) parts[1] = parts[1].substring(0,3);
		val = parts[0]+"_"+parts[1];
		return val.replace(/-/g, 'n');
	}
	

	function _remake(type) {
		var id = "chart-panel";
		if( type == "soil" ) id = type+"-"+id;
		else if( type == "weather" ) id = type+"-"+id;
		
		var panel = $("#"+id);
		
		panel.html("");
		
		// make sure the width is correct
		if( type != 'soil' ){
			var w = panel.parent().width();
			var h = w / 2;
			if( type == 'soil') h -= 40;
			
			panel.width(w).height(h);
		}
		
        if( type == 'weather' ) {
        	chart[type] = new google.visualization.ComboChart(panel[0]);
        } else if ( type == "soil" ) {
        	chart[type] = new google.visualization.Table(panel[0]);
        } else {
        	chart[type] = new google.visualization.LineChart(panel[0]);
        } 
        
        _redraw(type);
	}
	
	function _redraw(type) {
		if( datatable[type] == null || chart[type] == null ) return;
		
		if( type == "poplar" ) {
			var view = new google.visualization.DataView(datatable[type]);
			view.hideColumns([2,4]);
			chart[type].draw(view, options[type]);
		} else {
			chart[type].draw(datatable[type], options[type]);
		}
	}
	
	return {
		init : init
	};
	
})();