var ahbChart = (function() {
	
	var vizSourceUrl = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest";
	
	var datatable = null;
	var chart = null;
	
	// chart options
    var options = {
    	title : 'Temperate, broad-level evergreen',
    	vAxes: [{
    		title: "Radiation (MJ/day); Temperature (^C)",
    	    minValue : -10,
    	    maxValue : 30
  		},{
  			title: "Precipitation; Water balance (mm)",
  			minValue : -100,
  			maxValue : 300
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
  		  easing: 'out',
  	  },
   };
	
	function init() {
		google.setOnLoadCallback(onApiLoad);
	}
	
	function onApiLoad() {
		_remake();
		
		$(window).resize(function() {
			_remake();
		});
		
		$(window).on('query-map-event', function(e, latlng){
			_query(latlng);
		});
	}
	
	function _query(latLng) {
		var query = new google.visualization.Query(vizSourceUrl+'?view=pointToPrismAvgs('+latLng.lng()+','+latLng.lat()+',8192)');

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
	    _redraw();
	 }
	
	// remake the chart
	function _remake() {
		
		$('#chart-panel').html("");
		
		// make sure the width is correct
		var w = $('#chart-panel').parent().width();
		$('#chart-panel').width(w);
		if( w < 250 ) w = 250;
		$('#chart-panel').height(w);


        chart = new google.visualization.ComboChart($('#chart-panel')[0]);
        _redraw();
	}
	
	function _redraw() {
		if( datatable == null ) return;
        chart.draw(datatable, options);
	}
	
	
	return {
		init : init
	};
	
})();