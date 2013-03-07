ahb.chart = (function() {
	
	var vizSourceUrl = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest";
	
	var cUrl = "";
	var cUrl2 = "";
	var cId = "";
	var datatable = null;
	var datatable2 = null;
	var chart = null;
	var chart2 = null;
	var cll = null;
	
	// chart options
    var optionsWeather = {
    	title : 'Climate Chart',
    	vAxes: [{
    		title: "Radiation (MJ/day); Temperature (^C); Due Point (^C)",
    	    minValue : -5,
    	    maxValue : 35
  		},{
  			title: "Precipitation; Water balance (mm)",
  			minValue : -50,
  			maxValue : 350
  		}],
  		hAxis: {title: ""},
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
   };
    
    var optionsPrice = {
		  title : 'Poplar Adoption',
		  legend : {
			  position : 'right'
		  },
		  vAxis: {title: "Acres"},
		  hAxis: {title: "Price for Poplar ($/bdt)"},
	  	  animation : {
	  		  duration: 1000,
	  		  easing: 'out'
	  	  }
    }
    
    var optionsPoplar = {
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
       };
    
    var optionsWaterUse = {
    		  title : 'Poplar Adoption',
    		  legend : {
    			  position : 'right'
    		  },
    		  vAxis: {title: "Acres"},
    		  hAxis: {title: "Price for Poplar ($/bdt)"},
    	  	  animation : {
    	  		  duration: 1000,
    	  		  easing: 'out'
    	  	  }
      }
	
	function init() {
		google.setOnLoadCallback(onApiLoad);
	}
	
	function onApiLoad() {

		
		$(window).resize(function() {
			if( chart == null ) return;
			_remake();
			_remake2();
		});
		
		$(window).on('change-irtype-event', function(e){
			_query2(cll, null);
		});
		
		$(window).on('query-map-event', function(e, latlng, id){
			_query(latlng, id);
			_query2(latlng, id);
		});
		
		$(window).on('change-type-event', function(){
			$('#chart-panel').html("");
			$('#poplar-chart-panel').html("");
			$("#download-panel").html("");
			$("#poplar-download-panel").html("");
			chart = null;
			chart2 = null;
		});
		
		$('#chart-panel').html("");
		$('#poplar-chart-panel').html("");
	}
	
	function _query(latLng, id) {
		var queryUrl;
	
		if( ahb.type == 'weather' ) {
			queryUrl = vizSourceUrl+'?view=pointToWeather('+latLng.lng()+','+latLng.lat()+',8192)';
		} else {
			queryUrl = vizSourceUrl+"?view=bcam_commodity_predictions('"+id+"')";
	        $('#poplar-chart-panel').hide();
	        $("#poplar-download-panel").hide();
		}
			
		var query = new google.visualization.Query(queryUrl);

	    // Apply query language statement.
	    query.setQuery('SELECT *');
	    
	    cUrl = queryUrl;
	    cId = id;
	    cll = latLng;
	    
	    // Send the query with a callback function.
	    query.send(handleQueryResponse);
	}
	
	function _query2(latLng, id) {
		var query2Url = null;
		var query2 = null;
		
		if( ahb.type == 'weather' ) {
			query2Url = vizSourceUrl+'?view=pointTo3pg('+latLng.lng()+','+latLng.lat()+',8192,\''+ahb.irType+'\')';
		} else {
			return;
		}	

		query2 = new google.visualization.Query(query2Url);
	    query2.setQuery('SELECT *');

	    cUrl2 = query2Url;
	    
	    query2.send(handleQueryResponse2);
	}
	
	function _createDownload(url, id) {
		$("#download-panel").html("");
		
		$("#download-panel").append($('<a class="btn pull-left" href="'+url+'&tq=select *&tqx=out:csv;outFileName:'+id+'"><i class="icon-download-alt"></i>&nbspDownload CSV</a>'));
		$("#download-panel").append($('<a class="btn pull-right" href="'+url+'&tq=select *" target="_blank"><i class="icon-link"></i>&nbspSource</a>'));
	}
	

	function _createDownload2(url, id) {
		$("#poplar-download-panel").html("");
		
		$("#poplar-download-panel").append($('<a class="btn pull-left" href="'+url+'&tq=select *&tqx=out:csv;outFileName:'+id+'"><i class="icon-download-alt"></i>&nbspDownload CSV</a>'));
		$("#poplar-download-panel").append($('<a class="btn pull-right" href="'+url+'&tq=select *" target="_blank"><i class="icon-link"></i>&nbspSource</a>'));
	}
	
	function handleQueryResponse(response) {
		datatable = null;
		
	    if (response.isError()) {
	      alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
	      return;
	    }

	    datatable = response.getDataTable();
	    
	    // create download url 
	    if( ahb.type == 'weather' ) {
	    	var id = _formatLL(cll.lng())+'__'+_formatLL(cll.lat());
	    	_createDownload(cUrl, id);
	    } else {
	    	_createDownload(cUrl, cId);
	    }
	    
	    if( chart == null ) _remake();
	    else _redraw();
	}
	
	function handleQueryResponse2(response) {
		datatable2 = null;
		
	    if (response.isError()) {
	      alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
	      return;
	    }

	    datatable2 = response.getDataTable();
	    
	    // create download url 
	    if( ahb.type == 'weather' ) {
	    	var id = _formatLL(cll.lng())+'__'+_formatLL(cll.lat());
	    	_createDownload2(cUrl2, id);
	    } else {
	    	_createDownload2(cUrl2, cId);
	    }
	    
	    if( chart2 == null ) _remake2();
	    else _redraw2();
	}
	
	function _formatLL(val) {
		val = val+"";
		var parts = val.split(".");
		if( parts[1] && parts[1] > 3 ) parts[1] = parts[1].substring(0,3);
		val = parts[0]+"_"+parts[1];
		return val.replace(/-/g, 'n');
	}
	
	// remake the chart
	function _remake() {
		
		$('#chart-panel').html("");
		
		// make sure the width is correct
		var w = $('#chart-panel').parent().width();
		$('#chart-panel').width(w);
		if( w < 250 ) w = 250;
		if( ahb.type != "weather" ) w = w / 2;
		$('#chart-panel').height(w);


        if( ahb.type == 'weather' ) chart = new google.visualization.ComboChart($('#chart-panel')[0]);
        else chart = new google.visualization.LineChart($('#chart-panel')[0]);
        
        _redraw();
	}
	
	function _remake2() {
		
		$('#poplar-chart-panel').html("");
		
		// make sure the width is correct
		var w = $('#poplar-chart-panel').parent().width();
		$('#poplar-chart-panel').width(w);
		if( w < 250 ) w = 250;
		$('#poplar-chart-panel').height(w);


        if( ahb.type == 'weather' ) chart2 = new google.visualization.ComboChart($('#poplar-chart-panel')[0]);
        else chart2 = new google.visualization.LineChart($('#poplar-chart-panel')[0]);
        
        _redraw2();
	}
	
	function _redraw() {
		if( datatable == null ) return;
		
		var options;
		if( ahb.type == 'weather' ) options = optionsWeather;
		else options = optionsPrice;
		
        chart.draw(datatable, options);
	}
	
	function _redraw2() {
		if( datatable2 == null ) return;
		
		var options;
		options = optionsPoplar;

		var view = new google.visualization.DataView(datatable2);
		view.hideColumns([2,4]);
		
        chart2.draw(view, options);
        $('#poplar-chart-panel').show();
        $("#poplar-download-panel").show();
	}
	
	
	return {
		init : init
	};
	
})();