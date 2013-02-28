ahb.chart = (function() {
	
	var vizSourceUrl = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest";
	
	var datatable = null;
	var chart = null;
	var latLng = null;
	
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
			  position : 'bottom'
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
			_remake();
		});
		
		$(window).on('query-map-event', function(e, latlng, id){
			_query(latlng, id);
		});
		
		$(window).on('change-type-event', function(){
			$('#chart-panel').html("");
			chart = null;
		});
		
		$('#chart-panel').html("");
	}
	
	function _query(latLng, id) {
		var queryUrl;
		
		if( ahb.type == 'weather' ) queryUrl = vizSourceUrl+'?view=pointToWeather('+latLng.lng()+','+latLng.lat()+',8192)';
		else queryUrl = vizSourceUrl+"?view=bcam_commodity_predictions('"+id+"')";
			
		var query = new google.visualization.Query(queryUrl);

	    // Apply query language statement.
	    query.setQuery('SELECT *');
	    
	    // Send the query with a callback function.
	    query.send(handleQueryResponse);
	}
	
	function handleQueryResponse(response) {
		datatable = null;
		
	    if (response.isError()) {
	      alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
	      return;
	    }

	    datatable = response.getDataTable();
	    
	    if( chart == null ) _remake();
	    else _redraw();
	 }
	
	// remake the chart
	function _remake() {
		
		$('#chart-panel').html("");
		
		// make sure the width is correct
		var w = $('#chart-panel').parent().width();
		$('#chart-panel').width(w);
		if( w < 250 ) w = 250;
		$('#chart-panel').height(w);


        if( ahb.type == 'weather' ) chart = new google.visualization.ComboChart($('#chart-panel')[0]);
        else chart = new google.visualization.LineChart($('#chart-panel')[0]);
        
        _redraw();
	}
	
	function _redraw() {
		if( datatable == null ) return;
		
		var options;
		if( ahb.type == 'weather' ) options = optionsWeather;
		else options = optionsPrice;
		
        chart.draw(datatable, options);
	}
	
	
	return {
		init : init
	};
	
})();