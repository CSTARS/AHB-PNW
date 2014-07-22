define([],function() {

	var cachedTileStyle = {
	  where: "pid in ()",
	  polygonOptions: {
	    fillColor: "#000000",
	    strokeColor: "#FF0000",
	    strokeWeight: 3
	  }
	}
	
	var cachedTiles = [];
	var cachedTilesLoaded = false;
	var cachedTilePrefix = 'cached_title_';
	var caching = false;
	var saveCacheOnClickSet = false;
	var cMapData = {};

	var cols = [];
	var app = null;

	function init() {
		_loadFromCache();
		_loadCachedTiles();
	}

	function clearCache() {
		if( !confirm('Are you sure you want to clear all tile data from the cache?') ) return;

		for( var key in window.localStorage ) {
			if( key.indexOf(cachedTilePrefix) > -1 ) {
				window.localStorage.removeItem(key);
			}
		}
		cachedTiles = [];
	}

	// e is the event object from google maps
	function cacheTile(e, fusionLayer, defaultOptions, defaultStyle) {
		if( !saveCacheOnClickSet ) {
			saveCacheOnClickSet = true;
			$('#locate-cache-save-btn').on('click', function(){
				_saveTile();
			});
			$('#locate-cache-mode').on('click', function(){
				if( !$(this).is('checked') ) $('#locate-cache-save-panel').hide();
			});
		}

		if( caching ) return;
		caching = true;

		cMapData = {
			fusionLayer : fusionLayer,
			defaultOptions : defaultOptions,
			defaultStyle : defaultStyle,
			pid :  e.row.pid.value
		}

		$('#locate-cache-save-name').val('');
		$('#locate-cache-mode-loading').show();
		$('#locate-cache-save-panel').hide();

		_loadTile(e.latLng.lng(), e.latLng.lat(), function(data){
			$('#locate-cache-save-panel').show();
			$('#locate-cache-mode-loading').hide();

			$('#locate-cache-save-pid').html(cMapData.pid);
			cMapData.data = data;
			caching = false;
		});
	}

	function render() {
		app = require('app');
		for( var attr in app.getModel().weather ) {
			if( attr != "nrel" ) cols.push(attr);
		}

		// the about modal link is created below, so why not...
		$("#about-modal").modal({
			show : false
		});

		// the about modal link is created below, so why not...
		$("#help-modal").modal({
			show : false
		});

		_createNavMenu();

		// hide the select tree button
		$('#tree-sub-menu').parent().hide();

		// hide the selector for uploading weather data from a google spreadsheet
		$('#weatherReader-spreadsheet').parent().hide();

		// show the cache version of the location selector
		$('#select-location-online').hide();
		$('#select-location-offline').show();

		// set the location selector ui list based on cached tiles
		_updateCacheTileUiList();
	}

	function renderCachedTilesOnMap(fusionLayer, defaultOptions, defaultStyle) {
		if( !cachedTilesLoaded ) _loadCachedTiles();

		defaultOptions.styles = [defaultStyle];

		if( cachedTiles.length > 0 ) {
			cachedTileStyle.where = 'pid in ('+cachedTiles.join(',')+')';
			defaultOptions.styles.push(cachedTileStyle);
		}

		fusionLayer.setOptions(defaultOptions);
	}

	function _saveTile() {
		var name = $('#locate-cache-save-name').val();
		if( name.length == 0 ) return alert('Please provide a name');

		cMapData.data.name = name;
		
		window.localStorage.setItem(cachedTilePrefix+cMapData.pid, JSON.stringify(cMapData.data));

		cachedTiles.push(cMapData.pid);
		renderCachedTilesOnMap(cMapData.fusionLayer, cMapData.defaultOptions, cMapData.defaultStyle);
		$('#locate-cache-save-panel').hide();
	}

	function _loadTile(lng, lat, callback) {
		ga('send', 'event', 'ui', 'interaction', 'tile-data-cache', 1);

		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToWeather("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		var resps = 0;
		var weatherTable = {};
		var soilTable = {};
		
		function checkDone() {
		    resps++;
		    if( resps == 2 && callback ) callback({weather:weatherTable, soil:soilTable});
		}
		
		q.setQuery('SELECT *');
		q.send(function(response){
			weatherTable = JSON.parse(response.getDataTable().toJSON());
			checkDone();
		});
		
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToSOIL("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			soilTable = JSON.parse(response.getDataTable().toJSON());
			checkDone();
		});
	}

	function _updateCacheTileUiList() {
		if( cachedTiles.length == 0 ) {
			$('#select-location-offline-none').show();
			return;
		}

		var listEle = $('#select-location-offline-list').html('<div>Select Cached Tile</div>'), ele;
		$('#select-location-offline-none');
		for( var i = 0; i < cachedTiles.length; i++ ) {
			var json = window.localStorage.getItem(cachedTilePrefix+cachedTiles[i]);
			json = JSON.parse(json);

			ele = $('<div><a cacheid="'+i+'" style="cursor:pointer">'+cachedTiles[i]+': '+json.name+'</a></div>');
			ele.find('a').on('click', function() {
				_runCachedTile(parseInt($(this).attr('cacheid')));
			});
			listEle.append(ele)
		}
	}

	function _runCachedTile(index) {
		var json = window.localStorage.getItem(cachedTilePrefix+cachedTiles[index]);
		json = JSON.parse(json);

		for( var i = 0; i < json.weather.rows.length; i++ ) {
			var m = i+'';
			for( var j = 1; j < json.weather.cols.length; j++ ) {
				$("#input-weather-"+cols[j]+"-"+i).val(json.weather.rows[i].c[j] ? json.weather.rows[i].c[j].v : "");
			}
		}


		for( var i = 0; i < json.soil.cols.length; i++ ) {
			if( json.soil.rows[0] == null ) continue;
			$("#input-soil-"+json.soil.cols[i].id).val(json.soil.rows[0].c[i].v);
		}

		$("#select-weather-modal").modal('hide');

		setTimeout(function(){
			app.runModel();
		}, 500);
	}

	function _loadCachedTiles() {
		cachedTiles = [];
		for( var key in window.localStorage ) {
			if( key.indexOf(cachedTilePrefix) > -1 ) {
				cachedTiles.push(key.replace(cachedTilePrefix,''));
			}
		}
		cachedTilesLoaded = true;
	}

	function _createNavMenu() {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle">OFFLINE MODE<b class="caret"></b></a>'
				+ '<ul class="dropdown-menu">'
				+ '<li><a id="help"><i class="icon-question-sign"></i> Help</a></li>'
				+ '<li><a id="about"><i class="icon-info-sign"></i> About</a></li>'
				+ '</ul></li>');

		// set click handlers for popup
		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		// about click handler
		btn.find('#about').on('click', function() {
			btn.toggleClass('open');
			$("#about-modal").modal('show');
		});

		btn.find('#help').on('click', function() {
			btn.toggleClass('open');
			showHelp();
		});

		// add menu
		$("#login-header").html("").append(btn);
	};

	function _loadFromCache() {
        $.ajax({
          url: 'cache/jsapi',
          dataType: "script",
          cache : true,
          success: function(){
            $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'cache/chart.css') );
            $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'cache/annotatedtimeline.css') );
            $.ajax({
              url: 'cache/chart.js',
              dataType: "script",
              cache : true,
              success: function(){
                chartsLoaded = true;
                if( chartsCallback ) chartsCallback();
              }
            });
          }
        });
	}

	return {
		init : init,
		render : render,
		cacheTile : cacheTile,
		renderCachedTilesOnMap : renderCachedTilesOnMap,
		clearCache : clearCache
	}

});