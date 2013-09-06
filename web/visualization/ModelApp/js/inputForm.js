app.inputForm = (function(){
	
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
	
	var tabHeader = '<ul class="nav nav-tabs" id="input_tabs">';
	var content = '<div class="tab-content">';
	
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
		for( var attr in app.model.weather ) {
			if( attr != "nrel" ) cols.push(attr);
		}
		
		
		var table = "<table class='table table-striped' style='margin-top:20px'>";

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
		return "<div style='margin-top:10px'><a class='btn btn-primary' id='select-weather-location'><i class='icon-map-marker'></i> Select Location</a> "+
					"<div class='pull-right'>Current Location: <span id='current-weather-location'></span></div></div>"+ 
					table+"</table>";
		
	}
	
	function _setWeatherData() {
		var ll = qs("ll");
		if( ll ) {
			ll = ll.split(",");
			_queryWeatherData(ll[0], ll[1]);
		} else {
			$("#current-weather-location").html("Not Set"); 
			$("#current-soil-location").html("Not Set"); 
		}
	}
	
	function _queryWeatherData(lng, lat) {
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToWeather("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			var table = JSON.parse(response.getDataTable().toJSON());
			
			for( var i = 0; i < table.rows.length; i++ ) {
				for( var j = 1; j < table.cols.length; j++ ) {
					$("#input-weather-"+cols[j]+"-"+i).val(table.rows[i].c[j] ? table.rows[i].c[j].v : "");
				}
			}
			
		});
		
		var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToSOIL("+lng+","+lat+",8192)"
		var q = new google.visualization.Query(url);
		q.setQuery('SELECT *');
		q.send(function(response){
			var table = JSON.parse(response.getDataTable().toJSON());
			for( var i = 0; i < table.cols.length; i++ ) {
				$("#input-soil-"+table.cols[i].id).val(table.rows[0].c[i].v);
			}
			

		});
		$("#current-weather-location").html(lng+", "+lat);
		$("#current-soil-location").html(lng+", "+lat);
	}
	
	function _selectWeatherLocation() {
		if( !map ) {
			$("#select-weather-modal").modal({});
			
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
					_queryWeatherData(e.latLng.lng(), e.latLng.lat())
					$("#select-weather-modal").modal('hide');
				});
				
			},500);
		} else {
			$("#select-weather-modal").modal('show');
		}
	}
	
	function _generateInputs(i, type, prefix, name, attrs) {
		var id = prefix.length > 0 ? prefix+'-'+name : 'input-'+name;
		var input = '<div class="form-group" style="margin-left:'+(i*25)+'px">';
		input += '<label for="'+id+'" class="control-label">'+name+'</label>';
		input += '<div>';
		
		if( typeof attrs.value == 'string' ) {
			input += '<input type="text" class="form-control '+type+'" id="'+id+'" style="width:200px;display:inline-block" value="'
				+attrs.value+'">&nbsp;&nbsp;'+(attrs.units ? attrs.units : '');
			if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
		} else if ( typeof attrs.value == 'object' ) {
			if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
			for( var key in attrs.value ) {
				input += _generateInputs(i+1, type, id, key, attrs.value[key]);
			}
		} else if ( typeof attrs.value == 'number' ) {
			input += '<input type="number" '+(type=='constants'?'disabled':'')+' class="form-control '+type+'" id="'+id+'" style="width:200px;display:inline-block" value="'
				+attrs.value+'">&nbsp;&nbsp;'+(attrs.units ? attrs.units : '');
			if( attrs.description ) input += '<p class="help-block">'+attrs.description+'</p>';
		}
			
		input += '</div></div>';
		return input;
	}
	
	function create(ele) {
		var model, m, attr, config;
		
		for( model in app.model ) {
			m = app.model[model];
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
			
			tabHeader += '<li><a href="#inputs_'+model+'" id="tab_inputs_'+model+'" data-toggle="tab">'+model+'</a></li>';
			var attributes = inputs[model];
			
			content += ' <div class="tab-pane" id="inputs_'+model+'">';
			
			if( model == 'soil' ) {
				content += "<div style='margin-top:10px'><a class='btn btn-primary' id='select-soil-location'><i class='icon-map-marker'></i> Select Location</a> "+
					"<div class='pull-right'>Current Location: <span id='current-soil-location'></span></div></div>";
			}
			
			var row1 = "";
			var row2 = "<div class='col-lg-6>";

			if( model == 'weather' ) {
				content += _createWeatherInputs();
			} else {
				content += _generateInputs(0, model, '', model, app.model[model]);
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
		
		$('#select-weather-location').on('click', _selectWeatherLocation);
		$('#select-soil-location').on('click', _selectWeatherLocation);
		
		_setWeatherData();
		
		// now add variation analysis data
		var variationModels = ["tree", "plantation", "manage"];
		for( var i = 0; i < variationModels.length; i++ ) {
			var eles = $("."+variationModels[i]);
			for( var j = 0; j < eles.length; j++ ) {
				var val = $(eles[j]).attr("id").replace("input-","").replace(/-/g,".");
				$("#variationAnalysisInput").append("<option value='"+val+"'>"+val+"</option>");
			}
		}
	}

	
	return {
		create : create
	}
	
})();
