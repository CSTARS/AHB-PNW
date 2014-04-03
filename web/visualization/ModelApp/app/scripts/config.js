define(["require"],function(require) {

	var init = {
		gmap : false
	}
	var map;


	function show() {
		$('#root-main').hide();
		$('#root-config').show();
		initAndResizeMap();
	}

	function hide() {
		$('#root-main').show();
		$('#root-config').hide();
	}

	function initAndResizeMap() {
		if( !init.gmap ) {
			map = new google.maps.Map($("#gmap-2")[0], {
				center : new google.maps.LatLng(35, -121),
				zoom: 5,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			});
				
			var fusionLayer = new google.maps.FusionTablesLayer({
				  query: {
				    select: 'boundary',
				    from: '1hV9vQG3Sc0JLPduFpWJztfLK-ex6ccyMg_ptE_s'
				  },
				  styles: [{
			         polygonOptions: {
			           strokeColor   : "#0000FF",
			           strokeOpacity : 0.5,
			           fillColor     : '#FEFEFE',
			           fillOpacity   : 0.2
			         }
			      }],
				  suppressInfoWindows : true
			});
			fusionLayer.opacity = .8;
			fusionLayer.setMap(map);
			
			google.maps.event.addListener(map, 'click', function(e) {
				_queryWeatherData(e.latLng.lng(), e.latLng.lat(), function() {
	                app.runModel();
	            });
				$("#select-weather-modal").modal('hide');
			});
			google.maps.event.addListener(fusionLayer, 'click', function(e) {
				_queryWeatherData(e.latLng.lng(), e.latLng.lat(), function() {
	                app.runModel();
	            });
				$("#select-weather-modal").modal('hide');
			});
			init.gmap = true;
		} else {
			setTimeout(function(){
				google.maps.event.trigger(map, "resize");
			}, 100);
		}
	}

	return {
		show : show,
		hide : hide
	}

});