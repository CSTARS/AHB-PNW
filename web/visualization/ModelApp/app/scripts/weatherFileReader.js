define(["require"],function(require) {

    var app = null;

	function init() {
		var dropZone = document.getElementById('drop_zone');
		dropZone.addEventListener('dragover', _handleDragOver, false);
		dropZone.addEventListener('drop', _handleFileSelect, false);

		document.getElementById('files').addEventListener('change', _handleFileSelect, false);

        app = require('app');
	}

	function _handleFileSelect(evt) {
	    evt.stopPropagation();
	    evt.preventDefault();

	    var files = evt.dataTransfer ? evt.dataTransfer.files : evt.target.files; // FileList object.

	    // files is a FileList of File objects. List some properties.
	    var root = $("#file_list");
	    for (var i = 0, f; f = files[i]; i++) {
	    	var filePanel = new WeatherFile();
	    	filePanel.init(f, root);	
	    }
  	}

	function _handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  	}

  	var WeatherFile = function() {
  		var headers = {
            date     : {
                label : 'Date',
                units : 'Date',
                col   : -1
            },
            tmin     : {
                label : 'Min Temperature',
                units : 'C',
                col   : -1
            },
            tmax     : {
                label : 'Max Temperature',
                units : 'C',
                col   : -1
            },
            tdmean   : {
                label : 'Mean Temperature',
                units : 'C',
                col   : -1
            },
            ppt      : {
                label : 'Precipition',
                units : 'mm',
                col   : -1
            },
            rad      : {
                label : 'Radiation',
                units : 'MJ m-2 day-1',
                col   : -1 
            },
            daylight : {
                lanel : 'Daylight Hours',
                units : 'hours',
                col   : -1
            }
        };


  		var ele = $('<div style="text-align: left">'+
                '<button type="button" class="close" aria-hidden="true">&times;</button>'+
  				'<div class="filename"></div>'+
  				'<div class="progress">'+
					'<div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">'+
						'<span class="sr-only">0% Complete</span>'+
					'</div>'+
				'</div>'+
  				'<div class="status">'+
                    '<div class="date-range"></div>'+
                    '<div class="preview-data" style="display:none">'+
                        '<div><a class="btn btn-link preview-data-btn">Preview Data</a></div>'+
                        '<div class="preview-data-table" style="display:none"></div>'+
                    '</div>'+
                    '<div class="col-status" style="display:none"></div>'+
                    '<div style="height:50px">'+
                        '<a class="btn btn-link map-data-btn">Map CSV Columns</a>'+
                        '<a class="btn btn-success disabled pull-right">Add Data</a>'+
                    '</div>'+
                '</div>'+
  			'</div>');

  		var data = {};
        var csvTable = [];

        // only auto hide the first time
        var autoHide = true;

  		// the file reader object and the element
  		function init(file, rootEle) {
  			var reader = new FileReader();
  			reader.onerror = errorHandler;
    		reader.onprogress = updateProgress;
    		reader.onloadstart = function(e) {};
    		reader.onload = function(e) {
    			ele.find('.progress').remove();
    			parse(e.target.result);
    		}
    		reader.readAsText(file)

    		ele.find('.filename').html(getName(file));
    		rootEle.append(ele);

            
            ele.find('.map-data-btn').on('click', function(){
                ele.find('.col-status').toggle('slow');
            });

            ele.find('.preview-data-btn').on('click', function(){
                ele.find('.preview-data-table').toggle('slow');
            });

            ele.find('.close').on('click', function(){
                ele.remove();
            });
        
            ele.find('.btn-success').on('click', function(){
                app.setWeather(data);
                ele.remove();
            });
  		}

  		function getName(f) {
  			return ['<h3 style="border-bottom:1px solid #eee;padding:15px 0 4px 0"><i class="icon-tint"></i> ', f.name, 
                    ' <span style="color:#888;font-size:16px">(', f.type || 'n/a', 
                    ')</span> - <span style="font-size:16px">', f.size, ' bytes</span>', '</h3>'].join('');
  		}

  		function parse(data) {
  			data = data.replace(/^\s*\n/g,'').split('\n');

  			var table = [];
  			for( var i = 0; i < data.length; i++ ) {
  				table.push(data[i].split(','));
  			}

            if( table.length == 0 ) return setError('File did not contain any information.');
            csvTable = table;

            parseHeader(table[0]);
            getDateRange();
        }

        function getDateRange() {
            ele.find('.date-range').html('');
            if( headers.date.col == -1 ) return ele.find('.date-range').html('Date column needs to be matched.');
            if( typeof headers.date.col == 'string' ) headers.date.col = parseInt(headers.date.col);

            var dates = {};
            var displayDates = [];
            for( var i = 1; i < csvTable.length; i++ ) {
                if( headers.date.col < csvTable[i].length ) {
                    var p = csvTable[i][headers.date.col].split("-");
                    if( p.length != 3 || p.length != 3 ) return setError("Date: "+csvTable[i][headers.date.col]+" is not a valid format (yyyy-mm-dd or yyyy-mm)");

                    if( !dates[p[0]] ) dates[p[0]] = [];
                    var mmdd = p[1];

                    if( dates[p[0]].indexOf(mmdd) != -1 ) return setError("Date: "+csvTable[i][headers.date.col]+" is in dataset twice");
                    dates[p[0]].push(mmdd);
                }
            }

            for( var year in dates ) {
                if( dates[year].length == 12) {
                    displayDates.push(year);
                } else {
                    displayDates.push(year+' ['+dates[year].join(', ')+']');
                }
            }

            ele.find('.date-range').html('<b>Date Range:</b> '+displayDates.join(', '));
        }

        function parseHeader(headerRow) {
            var matched = [];

            var html = '<table class="table table-striped">';
            html += '<tr><th>Key</th><th>Column #</th></tr>';

            for( var key in headers ) {
                if( headerRow.indexOf(key) != -1 ) {
                    headers[key].col = headerRow.indexOf(key);
                    matched.push(key);
                    html += '<tr><td>'+key+'</td><td><span class="label label-success">'+headers[key].col+' <i class="icon-ok"></i></span></td></tr>';
                } else {
                    html += '<tr><td>'+key+'</td><td><select class="select-'+key+'""></select></td></tr>';
                }
            }
            ele.find('.col-status').html(html+'</table>');


            if( matched.length != headerRow.length ) {
                // create select element for missing col's
                ele.find('.status select').append($('<option value="">[Select Column]</option>'));

                // if it's radiation, add option for calculating
                // TODO

                // append missing cols
                for( var i = 0; i < headerRow.length; i++ ) {
                    if( matched.indexOf(headerRow[i]) == -1 ) {
                        ele.find('.status select').append($('<option value="'+i+'">'+i+' - '+headerRow[i]+'</option>'));
                    }
                }

                // set the change handlers for the selectors
                ele.find('.status select').on('change', function(e){
                    var val = $(this).find('option:selected').attr('value');
                    if( val != '' ) headers[this.className.replace(/select-/,'')].col = val;

                    // if all columns are set, remove disabled from btn
                    var ready = true;
                    for( var key in headers ) {
                        if( headers[key].col == -1 ) {
                            ready = false;
                            break;
                        }
                    }

                    if( ready ) {
                        if( autoHide ) ele.find('.col-status').hide('slow');
                        onReady();
                    } else {
                        data = {};
                        ele.find('.btn-success').addClass('disabled');
                        ele.find('.preview-data').hide();
                    }
                });

                // show the table
                ele.find('.col-status').show('slow');
            } else {
                onReady();
            }
        }

        function onReady() {
            autoHide = false;
            ele.find('.btn-success').removeClass('disabled');
            setData();
            setPreview();
        }

        function setPreview() {
            ele.find('.preview-data').show();

            var html = '<table class="table table-striped"><tr><th>date</th>';
            for( var key in headers ){ 
                if( key == 'date' ) continue;
                html += '<th>'+key+'</th>';
            }

            var c = 0;
            for( var date in data ){
                if( c == 10 ) {
                    html += '<tr><td colspan="7" style="text-align:center">...</td></tr>';
                    break;
                }

                html += '<tr><td>'+date+'</td>';
                for( var key in headers ){
                    if( key == 'date' ) continue;
                    html += '<td>'+data[date][key]+'</td>';
                }
                html += '</tr>';

                c++;
            }

            ele.find('.preview-data-table').html(html);
        }

  		// set the map of csv headers
  		function setData() {
            data = {};
            for( var i = 1; i < csvTable.length; i++ ) {
                var date = csvTable[i][headers.date.col];

                if( date.split('-').length == 3 ) date = date.split("-").splice(0,2).join("-");
                data[date] = {};

                for( var key in headers ) {
                    if( key == 'date' ) continue;

                    data[date][key] = parseInt(csvTable[i][headers[key].col]);
                }
            }
  		}

  		function updateProgress(evt) {
		    // evt is an ProgressEvent.
		    if (evt.lengthComputable) {
		      	var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
		      	ele.find('.progress-bar').attr('aria-valuenow',percentLoaded).width(percentLoaded+"%");
		      	ele.find('.sr-only').html(Math.ceil(percentLoaded)+'% Complete');
		    }
		}

  		function errorHandler(evt) {
		    switch(evt.target.error.code) {
		      case evt.target.error.NOT_FOUND_ERR:
		        setError('File Not Found!');
		        break;
		      case evt.target.error.NOT_READABLE_ERR:
		        setError('File is not readable');
		        break;
		      case evt.target.error.ABORT_ERR:
		        break; // noop
		      default:
		        setError('An error occurred reading this file.');
		    };
		}

        function setError(msg) {
            ele.find('.status').html('<div class="alert alert-danger">'+msg+'</div>');
        }

  		function checkErrors() {

  		}

  		return {
  			init : init
  		}

  	};

  	return {
  		init : init
  	}


});