var INIT_MAP_OPTIONS = {
	centerX: -121,
	centerY: 35,
	zoom: 5
}

var KML_GRID_URL = "";

ahb.map = (function() {
	
	var gmap = null;
	var marker = null;
	
	var chartMarker = null;
	var fusionLayer = null;
	
	function init() {
		
		INIT_MAP_OPTIONS.center = new google.maps.LatLng(INIT_MAP_OPTIONS.centerY, INIT_MAP_OPTIONS.centerX);
		INIT_MAP_OPTIONS.mapTypeId = google.maps.MapTypeId.ROADMAP;
		delete INIT_MAP_OPTIONS.centerY;
		delete INIT_MAP_OPTIONS.centerX;
		
		gmap = new google.maps.Map($("#map")[0], INIT_MAP_OPTIONS);
		
		
		$(window).resize(function(){
			_resize()
		});
		
		$(window).on('centerzoom-map-event', function(e, latlng){
			gmap.setZoom(10);
			_setCenterMarker(latlng);
		});
		
		$(window).on('center-map-event', function(e, latlng){
			_setCenterMarker(latlng);
		});
		
		$(window).on('change-type-event', function(){
			_updateLayer();
			if( chartMarker != null ) chartMarker.setMap(null);
		});
		
		_updateLayer();
		setTimeout(function(){
			_resize();
		}, 1000);
		
	}
	
	function _updateLayer() {
		if( fusionLayer != null ) fusionLayer.setMap(null);
		
		if( ahb.type == 'weather' ) {
			fusionLayer = new google.maps.FusionTablesLayer({
				  query: {
				    select: 'boundary',
				    from: '1hV9vQG3Sc0JLPduFpWJztfLK-ex6ccyMg_ptE_s'
				  },
				  suppressInfoWindows : true
				});
		} else {
			fusionLayer = new google.maps.FusionTablesLayer({
				  query: {
				    select: 'Boundary',
				    from: '1aYDFxFdD6xXIyS6ZAxGXjz85ENqeya9Uh4sYVQ8'
				  },
				  suppressInfoWindows : true
			 });
		}
		
		fusionLayer.opacity = .8;
		fusionLayer.setMap(gmap);
		
		google.maps.event.addListener(fusionLayer, 'click', function(e) {
			if( chartMarker != null ) chartMarker.setMap(null);
						
			var id = "";
			if( e.row && e.row.economy ) id = e.row.economy.value;
			
			chartMarker = new google.maps.Marker({
				map: gmap,
				position: e.latLng
			});
			
			$(window).trigger('query-map-event', [e.latLng, id]);
		});
		
		
	}
	
	
	function _setCenterMarker(latlng){
		if( marker != null ) marker.setMap(null);
		
		gmap.panTo(latlng);
		
		marker = new google.maps.Marker({
			map: gmap,
			position: latlng
		});	
	}	
	
	function _resize() {
		var map = $("#map");
		var div = $("#search-panel");
		
		var w = map.parent().width();
		map.width(w);
		w = w / 2;
		map.height(w);
		
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