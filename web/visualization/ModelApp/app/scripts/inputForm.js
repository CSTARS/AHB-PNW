define(['require'],function(require){
    var app = null;

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
		
		
		var table = "<table class='table table-striped table-condensed weather-table' style='margin-top:20px'>";

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
		return table+"</table>";
		
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
				for( var j = 1; j < table.cols.length; j++ ) {
					$("#input-weather-"+cols[j]+"-"+i).val(table.rows[i].c[j] ? table.rows[i].c[j].v : "");
				}
			}
			
			checkDone();
		});
		
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToSOIL("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			var table = JSON.parse(response.getDataTable().toJSON());
			for( var i = 0; i < table.cols.length; i++ ) {
				$("#input-soil-"+table.cols[i].id).val(table.rows[0].c[i].v);
			}
			
			checkDone();
		});
		
		$("#current-location").html(lng+", "+lat+" <a href='"+window.location.href.replace(/#.*/,'')+
		                            "?ll="+lng+","+lat+"' target='_blank'><i class='icon-link'></i></a>");
		
		
	}
	
	function _selectWeatherLocation() {
		if( !map ) {
			$("#select-weather-modal").modal({});
			
			$("#locate-button").on('click', _getLocation);
			
			
			// wait for the modal to init
			setTimeout(function(){
				map = new google.maps.Map($("#gmap")[0], {
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
		
		if( !(i == 1 /*&& type == 'tree'*/) ) {
		    if( i != 0 ) input += '<label for="'+id+'" class="control-label">'+name +'</label>';
		    input += '<div>';
		}

		//if( typeof attrs.value == 'string' ) {
		//	input += '<input type="text" class="form-control '+type+'" id="'+id+'" style="width:200px;display:inline-block" value="'
		//		+attrs.value+'">&nbsp;&nbsp;'+(attrs.units ? attrs.units : '');
		//	if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
		//} else 
        if ( typeof attrs.value == 'object' && i == 1  ) { // && type == 'tree' ) {
		    for( var key in attrs.value ) {
                treebody += _generateInputs(i+1, type, id, key, attrs.value[key]);
            }
		} else if ( typeof attrs.value == 'object' ) {
		    if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
            for( var key in attrs.value ) {
                input += _generateInputs(i+1, type, id, key, attrs.value[key]);
            }
		} else if ( (typeof attrs.value == 'number' || typeof attrs.value == 'string')  && i == 1 ) { // && type == 'tree' ) {
		    
		    treebody += 
		        '<input type="text" '+(type=='constants'?'disabled':'')+' class="form-control '+type+'" id="'+id+'" style="width:200px;display:inline-block" value="'
                +attrs.value+'">&nbsp;&nbsp;'+(attrs.units ? attrs.units : '');
		    
		} else if (  typeof attrs.value == 'string' || typeof attrs.value == 'number' ) {
			input += '<input type="text" '+(type=='constants'?'disabled':'')+' class="form-control '+type+'" id="'+id+'" style="width:200px;display:inline-block" value="'
				+attrs.value+'">&nbsp;&nbsp;'+(attrs.units ? attrs.units : '');
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
		var model, m, attr, config;
		
        var inputs = app.getModel();
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
			} else {
			    /*if( model == 'tree' )*/ content += treeHeader;
				content += _generateInputs(0, model, '', model, inputs[model]);
				/*if( model == 'tree' )*/ content += '</div>';
			}
			
			
			content += '</div>';
		}
		content += '</div>';
		tabHeader += "</ul>";
		
		ele.html(tabHeader+"<div class='form-horizontal'>"+content+"</div>");
		
		$('#input_tabs a').click(function (e) {
			  e.preventDefault()
			  $(this).tab('show')
		});
		$('#tab_inputs_weather').tab('show');
		
		$('.select-weather-location').on('click', _selectWeatherLocation);
		
		_setWeatherData();
		
	}

	
	return {
		create : create
	}	
});
