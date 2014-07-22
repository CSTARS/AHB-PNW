define(['require','offline'],function(require,offline){
    var app = null;
    var gdrive = null;
    var charts = null;

    var weatherAverageChart = null;
    var weatherAverageChartData = {};

    var SETUP_TEMPLATE = 
    	'<div>'+
    	'<h4>Chart Options</h4>'+
	    '<div>'+
	        '<table class="table">'+
	            '<tr>'+
	                '<td style="width:50%">Output variable(s) to chart </td>'+
	                '<td> <a id="select-charts-btn" class="btn btn-default">Select Charts</a></td>'+
	            '</tr>'+
	            '<tr>'+
	                '<td style="width:50%">Variation analysis parameter(s) </td>'+
	                '<td><div id="variationAnalysisStatus">None</div></td>'+
	            '</tr>'+
	        '</table>'+
	    '</div>'+
	    '<h4>Location</h4>'+
	     '<div style="border-top:1px solid #ddd;padding:8px;height:60px">'+
	       '<span id="current-location" style="color:#888"></span>'+
	       '<a class="btn btn-default pull-right select-weather-location"><i class="icon-map-marker"></i> Select Location</a>'+
         '</div>'+
         '<div>';

    var GOOLEDRIVE_TREE_TEMPLATE =
    	'<div style="padding:15px 0 5px 0;margin-bottom:5px;height: 50px">'+
    		'<div class="btn-group pull-right" id="tree-sub-menu">'+
  				'<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">'+
    				'<span id="loaded-tree-name">Default Tree</span> <span class="caret"></span>'+
  				'</button>'+
  				'<ul class="dropdown-menu" role="menu">'+
    				'<li><a id="gdrive-treepanel-load"><i class="icon-cloud-download"></i> Load Tree</a></li>'+
    				'<li><a id="gdrive-treepanel-save"><i class="icon-cloud-upload"></i> Save Tree</a></li>'+
    				'<li style="display:none"><a id="share-tree-btn" class="btn btn-default" style="display:none;margin-left:10px"><i class="icon-share"></i> Share Tree</a></li>'+
  				'</ul>'+
			'</div>'+
			'<div style="display:none"><input type="checkbox" id="compare-trees" /> Compare Trees</div>'+
		'</div>';

	var INPUT_TEMPLATE = 
		'<div class="form-group">'+
			'<label for="{{id}}" class="col-lg-4 control-label">{{label}}</label>'+
			'<div class="col-lg-8">'+
				'<input type="{{type}}" class="form-control" id="{{id}}" style="width:200px;display:inline-block" value="{{value}}">&nbsp;&nbsp;{{units}}'+
				'<p class="help-block">{{description}}</p>' +
			'</div>'+
		'</div>';
	
	var ARRAY_INPUT_TEMPLATE = 
		'<div class="col-lg-6"><div class="form-group">'+
			'<label for="{{id}}" class="col-lg-4 control-label">{{label}}</label>'+
			'<div class="col-lg-8">'+
				'{{inputs}}'+
				'<p class="help-block">{{description}}</p>' +
			'</div>'+
		'</div></div>';
	
	var tabHeader = '<ul class="nav nav-pills" id="input_pills">';
	var content = '<div class="pill-content">';
	
	var treeHeader = '<div class="panel-group" id="tree-accordion">';
	var TREE_PANEL_TEMPLATE = '<div class="panel panel-default">'+
	        '<div class="panel-heading">'+
	            '<h4 class="panel-title">'+
	                '<a class="accordion-toggle" data-toggle="collapse" data-parent="#tree-accordion" href="#collapse{{id}}">'+
	                    '{{title}}'+
	                '</a>'+
	            '</h4>'+
	        '</div>'+
	        '<div id="collapse{{id}}" class="panel-collapse collapse">'+
	            '<div class="panel-body">{{body}}</div>'+
	        '</div>'+
	     '</div>';   
	
	var inputs = {};
	
	// for weather data
	var cols = [];
	
	var map = null;
	
	/**
	 * Options : 
	 *   model - type of model to append to
	 *   label - attribute label
	 *   value - default value
	 *   description - description of attribute
	 *   units - attribute units
	 */
	function _addInput(options) {
		if( !inputs[options.model] ) inputs[options.model] = [];
		inputs[options.model].push(options);
	}
	
	function _createWeatherInputs() {
		for( var attr in app.getModel().weather ) {
			if( attr != "nrel" ) cols.push(attr);
		}
		
		var table = '<div style="padding-top:25px"><a class="btn btn-default pull-right" id="load-weather-btn"><i class="icon-upload-alt"></i> Upload</a>'+
					'<div class="btn-group" id="weather-input-toggle">'+
						'<button type="button" class="btn btn-default active">Averages</button>'+
						'<button type="button" class="btn btn-default">Actual</button>'+
					'</div>'+
					'</div>'+
					'<div id="custom-weather-panel" style="display:none;margin-top:20px"></div>'+
					'<div id="average-weather-panel">'+
					'<div style="padding:10px;color:#888">Select location to set the average weather data</div>'+
					'<table class="table table-striped table-condensed weather-table" style="margin-top:20px">';

		table += "<tr>";
		for( var i = 0; i < cols.length; i++ ) {
			table += "<td>"+cols[i]+"</td>";
		}
		table += "</tr>";
		
		for( var i = 0; i < 12; i++ ) {
			table += "<tr>";
			for( var j = 0; j < cols.length; j++ ) {
				if( j == 0 ) {
					table += "<td>"+(i+1)+"</td>";
				} else {
					table += "<td><input class='form-control' id='input-weather-"+cols[j]+"-"+i+"' type='text' /></td>";
				}
			}
			table += "</tr>";
		}
		return table+'</table><div id="average-weather-chart"></div></div>';
		
	}
	
	function _setWeatherData() {
		var ll = app.qs("ll");
		if( ll ) {
			ll = ll.split(",");
			_queryWeatherData(ll[0], ll[1], function() {
			    app.runModel();
			});
		} else {
			$("#current-location").html("Not Set");  
		}
	}
	
	function _queryWeatherData(lng, lat, callback) {
		ga('send', 'event', 'ui', 'interaction', 'weather-data-query', 1);

		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToWeather("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		var resps = 0;
		
		function checkDone() {
		    resps++;
		    if( resps == 2 && callback ) callback();
		}
		
		q.setQuery('SELECT *');
		q.send(function(response){
			var table = JSON.parse(response.getDataTable().toJSON());

			for( var i = 0; i < table.rows.length; i++ ) {
				var m = i+'';
				weatherAverageChartData[m] = {};
				for( var j = 1; j < table.cols.length; j++ ) {
					$("#input-weather-"+cols[j]+"-"+i).val(table.rows[i].c[j] ? table.rows[i].c[j].v : "");
				}
			}

			updateAverageChart();
			checkDone();
		});
		
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToSOIL("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			var error = false;
			var table = JSON.parse(response.getDataTable().toJSON());
			for( var i = 0; i < table.cols.length; i++ ) {
				if( table.rows[0] == null ) {
					error = true;
					alert("Invalid location selected");
					break;
				}
				$("#input-soil-"+table.cols[i].id).val(table.rows[0].c[i].v);
			}

			if( !error ) checkDone();
		});
		
		$("#current-location").html(lng+", "+lat+" <a href='"+window.location.href.replace(/#.*/,'')+
		                            "?ll="+lng+","+lat+"' target='_blank'><i class='icon-link'></i></a>");
	}

	function updateAverageChart() {
		weatherAverageChartData = {};

		for( var i = 0; i < 12; i++ ) {
			weatherAverageChartData[i+''] = {};
			for( var j = 1; j < cols.length; j++ ) {
				var val = $("#input-weather-"+cols[j]+"-"+i).val();
				if( val && val.length > 0 ) weatherAverageChartData[i+''][cols[j]] = parseInt(val);
				else weatherAverageChartData[i+''][cols[j]] = 0;
			}
		}
		weatherAverageChart = charts.createWeatherChart($('#average-weather-chart')[0], weatherAverageChartData);
	}
	
	function _selectWeatherLocation() {
		if( !map ) {
			$("#select-weather-modal").modal({});
			
			$("#locate-button").on('click', _getLocation);
			
			
			// wait for the modal to init
			setTimeout(function(){
				if( offlineMode ) return;
				
				map = new google.maps.Map($("#gmap")[0], {
					center : new google.maps.LatLng(35, -121),
					zoom: 5,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				});
				
				var defaultStyle = {
		        	polygonOptions: {
		        		strokeColor   : "#0000FF",
		        		strokeOpacity : 0.5,
		        		fillColor     : '#FEFEFE',
		        		fillOpacity   : 0.2
		        	},
				};


				var defaultOptions = {
					  query: {
					    select: 'boundary',
					    from: '1hV9vQG3Sc0JLPduFpWJztfLK-ex6ccyMg_ptE_s'
					  },
					  styles: [defaultStyle],
					  suppressInfoWindows : true
				};

				var fusionLayer = new google.maps.FusionTablesLayer(defaultOptions);
				fusionLayer.opacity = .8;
				fusionLayer.setMap(map);
				
				google.maps.event.addListener(map, 'click', function(e) {
					if( $('#locate-cache-mode').is(':checked') ) {
						alert('You must click on a geometry to cache');
						return;
					}

					_queryWeatherData(e.latLng.lng(), e.latLng.lat(), function() {
		                app.runModel();
		            });
					$("#select-weather-modal").modal('hide');
				});
				google.maps.event.addListener(fusionLayer, 'click', function(e) {
					if( $('#locate-cache-mode').is(':checked') ) {
						offline.cacheTile(e, fusionLayer, defaultOptions, defaultStyle);
						return;
					}

					_queryWeatherData(e.latLng.lng(), e.latLng.lat(), function() {
		                app.runModel();
		            });
					$("#select-weather-modal").modal('hide');
				});

				// setup input for clearing cache
		        $('#clear-cached-tiles').on('click', function(){
		            offline.clearCache();
		            offline.renderCachedTilesOnMap(fusionLayer, defaultOptions, defaultStyle);
		        });

				offline.renderCachedTilesOnMap(fusionLayer, defaultOptions, defaultStyle);
				
			},500);
		} else {
			$("#select-weather-modal").modal('show');
			
			// we seem to be hanging sometimes....
			setTimeout(function(){
				google.maps.event.trigger(map, "resize");
			}, 500);
		}
	}
	
	function _getLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(showPosition);
			$("#locate-button").addClass("btn-warning");
		} else{
			window.alert("Geolocation is not supported by this browser.");
		}
		function showPosition(position) { 
			$("#locate-button").removeClass("btn-warn").addClass("btn-success");
			map.setZoom(10);
			map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
			//_queryWeatherData(position.coords.longitude, position.coords.latitude);
		}
	}
	
	function _generateInputs(i, type, prefix, name, attrs) {
		var id = prefix.length > 0 ? prefix+'-'+name : 'input-'+name;
		var input = '<div class="form-group" style="margin-left:'+(i*20)+'px;margin-top:0px;margin-right:5px">';
		
		var treebody = "";
		
		if( !(i == 1) ) {
		    if( i != 0 ) input += '<label for="'+id+'" class="control-label">'+name +'</label>';
		    input += '<div>';
		}


        if ( typeof attrs.value == 'object' && i == 1  ) { // && type == 'tree' ) {
		    for( var key in attrs.value ) {
                treebody += _generateInputs(i+1, type, id, key, attrs.value[key]);
            }
		} else if ( typeof attrs.value == 'object' ) {
		    if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
            for( var key in attrs.value ) {
                input += _generateInputs(i+1, type, id, key, attrs.value[key]);
            }
		} else if ( (typeof attrs.value == 'number' || typeof attrs.value == 'string') && i == 1 ) { // && type == 'tree' ) {
		    
		    treebody += 
		        '<div><input type="'+(attrs.value == '_date_' ? 'date' : 'text')+'" '+
		        (type=='constants'?'disabled':'')+' class="form-control '+type+'" id="'+
		        id+'" style="width:200px;display:inline-block" value="'
                +(attrs.value == '_date_' ? '' : attrs.value)+'">&nbsp;&nbsp;'
                +(attrs.units ? attrs.units : '')+'</div>';
		    
		} else if (  typeof attrs.value == 'string' || typeof attrs.value == 'number' ) {

			input += '<div><input type="'+(attrs.value == '_date_' ? 'date' : 'text')+'" '
						+(type=='constants'?'disabled':'')+' class="form-control '+type+
					 	'" id="'+id+'" style="width:200px;display:inline-block" value="'
						+(attrs.value == '_date_' ? '' : attrs.value)+'">&nbsp;&nbsp;'
						+(attrs.units ? attrs.units : '')+'</div>';

			if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
		}
			
		if( !(i == 1 /*&& type == 'tree'*/) ) {
		    input += '</div></div>';
		} else {
		    input += TREE_PANEL_TEMPLATE
		                .replace(/{{id}}/g,id)
		                .replace('{{title}}',name+" <span style='color:#888;font-size:12px'> - "+attrs.description+"</span>")
		                .replace('{{body}}',treebody)+'</div>'
		}
		
		return input;
	}
	
	function create(ele) {
        app = require('app');
        gdrive = require('gdrive');
        charts = require('charts');

        var weatherFileReader = require('weatherFileReader');

        weatherFileReader.init();


		var model, m, attr, config;
		
        var inputs = $.extend(true, {}, app.getModel());

        inputs['setup'] = {};
		for( model in inputs ) {
			m = inputs[model];
			for( attr in m ) {
				config = m[attr];
				
				if( typeof config == 'object' ) {
					_addInput({
						model       : model,
						label       : attr,
						description : config.description,
						value       : config.value,
						units       : config.units
					});
				} else {
					_addInput({
						model       : model,
						label       : attr
					});
				}
			}
		}
		
		
		for( model in inputs ) {
			if( model == "plantation_state" ) continue;
			
			tabHeader += '<li><a href="#inputs_'+model+'" id="tab_inputs_'+model+'" data-toggle="pill">'
			            +model.substr(0,1).toUpperCase()+model.substr(1).toLowerCase()+'</a></li>';
			var attributes = inputs[model];
			
			content += ' <div class="pill-pane" id="inputs_'+model+'">';
			
			var row1 = "";
			var row2 = "<div class='col-lg-6>";

			if( model == 'weather' ) {
				content += _createWeatherInputs();
			} else if( model == 'setup' ) {
				content += SETUP_TEMPLATE;
			} else {
			    content += treeHeader;

			    // add the google drive btn from trees
			    if( model =='tree' ) {
			    	content += _createTreeInput(model, inputs);
			    } else {
			    	content += _generateInputs(0, model, '', model, inputs[model]);
			    }

				content += '</div>';
			}
			
			
			content += '</div>';
		}
		content += '</div>';
		tabHeader += "</ul>";
		
		ele.html(tabHeader+"<div class='form-horizontal'>"+content+"</div>");

		// run the model whenever some hits 'enter'
		ele.find('input').on('keyup',function(e){
			if( e.which == 13 ) app.runModel();
		});

		// add click handler for loading a tree
		ele.find("#gdrive-treepanel-load").on('click', function(){
			gdrive.showLoadTreePanel();
		});
		ele.find("#gdrive-treepanel-save").on('click', function(){
			gdrive.showSaveTreePanel();
		});

		// set tree input handlers
		$("#compare-trees").on('click', function(){
			if( $(this).is(':checked') ) {
				$("#single-tree-content").hide();
				$("#compare-tree-content").show();
				$("#tree-sub-menu").hide();
			} else {
				$("#single-tree-content").show();
				$("#compare-tree-content").hide();
				$("#tree-sub-menu").show();
			}
		});

		// set pill click handlers
		$('#input_tabs a').click(function (e) {
			  e.preventDefault()
			  $(this).tab('show')
		});
		$('#tab_inputs_weather').tab('show');
		
		$('.select-weather-location').on('click', _selectWeatherLocation);


		$('#weatherReader-modal').modal({show:false});
		$('#load-weather-btn').on('click', function(){
			$('#weatherReader-modal').modal('show');
		});
		
		$("#weather-input-toggle .btn").on('click', function(){
			$('#weather-input-toggle .btn.active').removeClass('active');
			$(this).addClass('active');

			if( $(this).html() == 'Averages' ) {
				$('#average-weather-panel').show();
				$('#custom-weather-panel').hide();
			} else {
				app.setWeather();
				$('#average-weather-panel').hide();
				$('#custom-weather-panel').show();
			}
		});

		$(window).on('resize', function(){
			if( weatherAverageChart ){
				weatherAverageChart = charts.createWeatherChart($('#average-weather-chart')[0], weatherAverageChartData);
			} 
		});
		
		_setWeatherData();	
	}

	function _createTreeInput(model, inputs) {
		var content = "";
		content += GOOLEDRIVE_TREE_TEMPLATE;

		content += '<div id="single-tree-content">';
		content += _generateInputs(0, model, '', model, inputs[model]);
		content += '</div>';

		content += '<div id="compare-tree-content" style="display:none">'+
					'<ul class="nav nav-tabs">'+
						'<li class="active"><a href="#tree1" data-toggle="tab">Tree 1</a></li>'+
  						'<li><a href="#tree2" data-toggle="tab">Tree 2</a></li>'+
					'</ul>'+
					'<div class="tab-content">'+
	  					'<div class="tab-pane active" id="tree1">'+
	  						'<div class="well" style="text-align:center;margin-top:10px">'+
	  							'<div class="btn-group">'+
									'<button type="button" class="btn btn-default active">Custom</button>'+
									'<button type="button" class="btn btn-default">Select Tree</button>'+
								'</div>'+
	  						'</div>'+
	  						_generateInputs(0, model, 't1', model, inputs[model])+
	  					'</div>'+
	  					'<div class="tab-pane active" id="tree2">'+
	  						'<div class="well" style="text-align:center;margin-top:10px" >'+
	  							'<div class="btn-group">'+
									'<button type="button" class="btn btn-default active">Custom</button>'+
									'<button type="button" class="btn btn-default">Select Tree</button>'+
								'</div>'+
	  						'</div>'+
	  						_generateInputs(0, model, 't2', model, inputs[model])+
	  					'</div>'+
  					'</div>'+
  				 '</div>';

		return content;
	}

	
	return {
		create : create,
		updateAverageChart: updateAverageChart
	}	
});
