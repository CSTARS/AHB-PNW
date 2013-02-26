var INIT_MAP_OPTIONS = {
	centerX: -121,
	centerY: 35,
	zoom: 5
}

var KML_GRID_URL = "";

var ahbMap = (function() {
	
	var gmap = null;
	var marker = null;
	
	var chartMarker = null;
	
	function init() {
		
		INIT_MAP_OPTIONS.center = new google.maps.LatLng(INIT_MAP_OPTIONS.centerY, INIT_MAP_OPTIONS.centerX);
		INIT_MAP_OPTIONS.mapTypeId = google.maps.MapTypeId.ROADMAP;
		delete INIT_MAP_OPTIONS.centerY;
		delete INIT_MAP_OPTIONS.centerX;
		
		gmap = new google.maps.Map($("#map")[0], INIT_MAP_OPTIONS);
		
		// add kml overlay
		var fusionLayer = new google.maps.FusionTablesLayer({
			  query: {
			    select: 'boundary',
			    from: '1hV9vQG3Sc0JLPduFpWJztfLK-ex6ccyMg_ptE_s'
			  },
			  clickable : false
			});
		fusionLayer.opacity = .8;
		fusionLayer.setMap(gmap);
		
		google.maps.event.addListener(gmap, 'click', function(e) {
			if( chartMarker != null ) chartMarker.setMap(null);
			
			chartMarker = new google.maps.Marker({
				map: gmap,
				position: e.latLng
			});
			
			$(window).trigger('query-map-event', [e.latLng]);
		});
		
		
		$(window).resize(function(){
			_resize()
		});
		
		$(window).on('center-map-event', function(e, latlng){
			_setCenterMarker(latlng);
		});
		
		_resize();
	}
	
	
	function _setCenterMarker(latlng){
		if( marker != null ) marker.setMap(null);
		
		gmap.setCenter(latlng);
		
		marker = new google.maps.Marker({
			map: gmap,
			position: latlng
		});	
	}	
	
	function _resize() {
		var map = $("#map");
		var div = $("#search-panel");
		map.height($(window).height()-100);
		map.width(_getRatio(div.parent().width())-40);
		google.maps.event.trigger(gmap, "resize");
	}
	
	function _getRatio(size) {
		var unitSize = size / 5;
		return Math.floor( unitSize * 7 );
	}
	
	return {
		init : init
	}
})();