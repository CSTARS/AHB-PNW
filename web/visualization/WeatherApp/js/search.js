ahb.search = (function(){
	
	var geocoder = null;
	var geocodeResults = null;
	
	var searchExtent = new google.maps.LatLngBounds();
	
	function init() {
		
		geocoder = new google.maps.Geocoder();
		
		// set dom event handlers
		$("#search-button").on('click', _search);
		$("#search-text").on('keyup', function(e){
			if(e.which == 13) _search();
		});
	}
	
	function _search() {
		geocoder.geocode({
			address : $("#search-text").val()
		}, _onGeocodeResponse);
	}
	
	function _onGeocodeResponse(results, status) {
		var resultsPanel = $("#search-results").html("");
		
		// add close handler
		var close = $('<button type="button" class="close" style="margin:-15px -5px 0 0">&times;</button>');
		close.on('click', function(){
			resultsPanel.hide('blind');
		});
		resultsPanel.append(close);
		
		// fill the panel
		for( var i = 0; i < results.length; i++ ) {
			var ele = $("<div><a id='geo-result-"+i+"' style='cursor:pointer'>"+results[i].formatted_address+"</a></div>");
			ele.on('click', function(e){
				try {
					var index = parseInt(e.target.id.replace("geo-result-",""));
					console.log(results[index].geometry.location);
					$(window).trigger('center-map-event', [results[index].geometry.location]);
				} catch (e) {
					console.log(e);
				}
			});
			resultsPanel.append(ele);
		}
		
		if( resultsPanel.css("display") == 'none' ) {
			resultsPanel.show('blind');
		}
	}
	
	return {
		init : init
	};
	
})();