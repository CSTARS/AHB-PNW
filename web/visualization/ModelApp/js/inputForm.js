app.inputForm = (function(){
	
	var INPUT_TEMPLATE = 
		'<div class="col-lg-6"><div class="form-group">'+
			'<label for="{{id}}" class="col-lg-4 control-label">{{label}}</label>'+
			'<div class="col-lg-8">'+
				'<input type="{{type}}" class="form-control" id="{{id}}" style="width:200px;display:inline-block">&nbsp;&nbsp;{{units}}'+
				'<p class="help-block">{{description}}</p>' +
			'</div>'+
		'</div></div>';
	
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
					table += "<td><input class='form-control' id='weather-"+cols[j]+"-"+i+"' type='text' /></td>";
				}
			}
			table += "</tr>";
		}
		return table+"</table>";
		
	}
	
	function _setWeatherData() {
		var ll = qs("ll");
		if( ll ) {
			var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToWeather("+ll+",8192)"
			var q = new google.visualization.Query(url);
			q.setQuery('SELECT *');
			q.send(function(response){
				var table = JSON.parse(response.getDataTable().toJSON());
				
				for( var i = 0; i < table.rows.length; i++ ) {
					for( var j = 1; j < table.cols.length; j++ ) {
						$("#weather-"+cols[j]+"-"+i).val(table.rows[i].c[j].v);
					}
				}
				
			});
			
			var url = "http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest?view=pointToSOIL("+ll+",8192)"
			var q = new google.visualization.Query(url);
			q.setQuery('SELECT *');
			q.send(function(response){
				var table = JSON.parse(response.getDataTable().toJSON());
				for( var i = 0; i < table.cols.length; i++ ) {
					$("#soil-"+table.cols[i].id).val(table.rows[0].c[i].v);
				}
				

			});
			
			
		}
	}
	
	function create(ele) {
		var model, m, attr, config;
		
		for( model in app.model ) {
			m = app.model[model];
			for( attr in m ) {
				config = m[attr];
				
				if( typeof config == 'object' ) {
					_addInput({
						model        : model,
						label           : attr,
						description : config.description,
						value          : config.value,
						units           : config.units
					});
				} else {
					_addInput({
						model        : model,
						label           : attr
					});
				}
			}
		}
		
		
		for( model in inputs ) {
			if( model == "plantation_state" ) continue;
			
			tabHeader += '<li><a href="#inputs_'+model+'" id="tab_inputs_'+model+'" data-toggle="tab">'+model+'</a></li>';
			var attributes = inputs[model];
			
			content += ' <div class="tab-pane" id="inputs_'+model+'">'
			
			var row1 = "";
			var row2 = "<div class='col-lg-6>";

			if( model == 'weather' ) {
				content += _createWeatherInputs();
			} else {
				
				var row = "<div class='row'>";
				var c = 0;
				
				for( var i = 0; i < attributes.length; i++) {
					var attr = attributes[i];
					
					if( typeof attr.value == 'object' ) {
						var arrInputs = "";
						for( var key in attr.value ) {
							arrInputs += key+' <input type="number" class="form-control" id="{'+model+"_"+attr.label+"_"+key+
													'" style="width:60px;display:inline-block">&nbsp;&nbsp;';
						}
						arrInputs += attr.units ? attr.units : '';
						
						row += ARRAY_INPUT_TEMPLATE
							.replace(/{{id}}/g, model+"_"+attr.label)
							.replace(/{{inputs}}/g, arrInputs)
							.replace(/{{label}}/g, attr.label)
							.replace(/{{description}}/g, attr.description ? attr.description : '');
						
						
					} else {
						var type = "number";
						if( typeof attr.value == "string" ) type = "text";
						
						row += INPUT_TEMPLATE
							.replace(/{{id}}/g, model+"_"+attr.label)
							.replace(/{{label}}/g, attr.label)
							.replace(/{{type}}/g, type)
							.replace(/{{units}}/g, attr.units ? attr.units : '')
							.replace(/{{description}}/g, attr.description ? attr.description : '');
					}
					
					c++;
					if( c == 2 ) {
						c = 0;
						content += row+"</div>";
						row = "<div class='row'>";
					}
				}
				
				if( c == 1) content += row+"</div>";
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
		
		_setWeatherData();
	}
	
	return {
		create : create
	}
	
})();
