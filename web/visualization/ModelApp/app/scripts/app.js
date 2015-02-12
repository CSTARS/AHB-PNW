/*global define */
define(["gdrive","charts","inputForm","export","offline"], function (gdrive, charts, inputForm, exporter,offline) {

     var runCallback = null;
     var _3pgModel = null;

     var inputs = {
				weather : ["month","tmin","tmax","tdmean","ppt","rad","daylight"]
	 };
	 var outputs = ["VPD","fVPD","fT","fFrost","PAR","xPP","Intcptn","ASW","CumIrrig",
			           "Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge",
			           "PhysMod","pR","pS","litterfall","NPP","WF","WR","WS","W"];
	 var debug = false;
	 var devmode = false;

    var weatherCustomChart = null;

     // row raw data does a lot of processing of the results and the current state of what's
     // being displayed.  Go ahead an setup the csv data at this point, then if the user
     // decides to export, we are all set to to;
     var csvResults = null;

     var getModel = function() {
        return _3pgModel;
     }

     var getOutputs = function() {
        return outputs;
     }

     var outputDefinitions = {
        VPD : {
            label : "Mean Vapor Pressure Deficit",
            units : "kPA",
            description : "the difference (deficit) between the amount of moisture in the air and how much " +
            		"moisture the air can hold when it is saturated"
        }, 
        fVPD : {
            label : "Vapor Pressure Deficit Modifier",
            units : "unitless",
            description : "A environmental factor growth modifier"
        }, 
        fT : {
            label : "Temperature Modifier",
            units : "unitless",
            description : "A environmental factor growth modifier"
        }, 
        fFrost : {
            label : "Frost Modifier",
            units : "unitless",
            description : "Number of frost days growth modifier"
        }, 
        PAR : {
            label : "Monthly Photosynthetically Active Radiation",
            units : "mols / m^2 month",
            description : "Designates the spectral range (wave band) of solar radiation from 400 to 700 nanometers " +
            		"that photosynthetic organisms are able to use in the process of photosynthesis"
        }, 
        xPP : {
            label : "Maximum Potential Primary Production",
            units : "Metric Tons Dry Matter/ha",
            description : ""
        }, 
        Intcptn : {
            label : "Canopy Rainfall Interception",
            units : "",
            description : "Precipitation that does not reach the soil, but is instead intercepted by the leaves and branches of plants and the forest floor."
        }, 
        ASW : {
            label : "Available Soil Water",
            units : "mm",
            description : ""
        }, 
        CumIrrig : {
            label : "Cumulative Required Irrigation",
            units : "mm/mon",
            description : ""
        }, 
        Irrig : {
            label : "Required Irrigation",
            units : "mm/mon",
            description : ""
        }, 
        StandAge : {
            label : "Stand Age",
            units : "",
            description : ""
        }, 
        LAI : {
            label : "Leaf Area Index",
            units : "m2 / m2",
            description : "The one-sided green leaf area per unit ground surface area"
        }, 
        CanCond : {
            label : "Canopy Conductance",
            units : "gc,m/s",
            description : ""
        }, 
        Transp : {
            label : "Canopy Monthly Transpiration",
            units : "mm/mon",
            description : "Water movement through a plant and its evaporation from aerial parts"
        }, 
        fSW : {
            label : "Soil Water Modifier",
            units : "unitless",
            description : "A environmental factor growth modifier"
        }, 
        fAge : {
            label : "Stand age",
            units : "unitless",
            description : "A environmental factor growth modifier"
        }, 
        PhysMod : {
            label : "",
            units : "unitless",
            description : "Physiological Modifier to Canopy Conductance"
        }, 
        pR : {
            label : "",
            units : "",
            description : "Along with a Physiologial parameter, specifies the amount of new growth allocated to the root system, and the turnover rate."
        }, 
        pS : {
            label : "",
            units : "",
            description : "Defines the foliage to stem (WF/WS) fraction in allocating aboveground biomass of the tree"
        }, 
        litterfall : {
            label : "",
            units : "",
            descrition : "",
            altFnName : "tdp"
        }, 
        NPP : {
            label : "Net Canopy Production",
            units : "Mg/ha",
            description : ""
        }, 
        WF : {
            label : "Leaf Biomass",
            units : "Mg/ha",
            description : "",
            fn : function(pre_WF, cur_dW, cur_pF, cur_litterfall, prev_WF) {
                return prev_WF + cur_dW * cur_pF - cur_litterfall * prev_WF
            }
        }, 
        WR : {
            label : "Root Biomass",
            units : "Mg/ha",
            description : "",
            fn : function(prev_WR, cur_dW, cur_pR, turnover, prev_WR, cur_RootP) { 
                return prev_WR + cur_dW * cur_pR - tree.pR.turnover * prev_WR - cur_RootP;
            }
        }, 
        WS : {
            label : "Stem Biomass",
            units : "Mg/ha",
            description : "",
            fn : function(prev_WS, cur_dW, cur_pS) { return prev_WS + cur_dW * cur_pS }
        }, 
        W : {
            label : "Total Biomass",
            units : "Mg/ha",
            description : "",
            fn : function(cur_WF, cur_WR, cur_WS) { return cur_WF+cur_WR+cur_WS }
        }
    }



    function qs(key) {
        key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&");
        var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
        return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    }

    var loadModelCode = function(version, callback) {

        if (typeof version === 'function') callback = version;
        if (!version || typeof version != 'string') version = "master";

        _requestModelCode(
            "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/Model3PG.js?ref="+ version,
            function(data) {
                // clean then base64 decode file content
                // finally, eval js
                eval(atob(data.content.replace(/[\s\n]/g, '')));

                // set m3PG object to window scope
                window.m3PG = m3PG;

                _requestModelCode(
                    "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/SingleRunFunctions.js?ref="+ version,
                    function(data) {
                        eval(atob(data.content.replace(/[\s\n]/g, '')));
                        window.m3PGFunc = m3PGFunc;
                        _requestModelCode(
                            "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/DataModel.js?ref="+ version,
                            function(data) {
                                eval(atob(data.content.replace(/[\s\n]/g,'')));
                                _3pgModel = model;
                                callback();
                            }
                        );
                    }
                );
            }
        );
    }


    // github only allows 60 public requests per ip per hour. so let's cache
    // code in localstorage for one hour
    var _requestModelCode = function(url, callback) {
        // see if it's cached
        if (localStorage[url]) {
            var time = localStorage["_timestamp_" + url];
            // if the cache is less than an hour old, use cached copy
            if (new Date().getTime() - parseInt(time) < 60000 * 60) {
                return callback(JSON.parse(localStorage[url]));
            }
        }

        $.ajax({
            url : url,
            success : function(data, status, xhr) {
                // cache for later
                localStorage[url] = JSON.stringify(data);
                localStorage["_timestamp_" + url] = new Date().getTime();
                callback(data);
            },
            error : function() {
                // if we fail to access github but have a local copy of the code, just roll w/ that
                if ( localStorage[url] ) return callback(JSON.parse(localStorage[url]));

                // else fail :/
                alert("Failed to load " + url + " from github, no local copied found either :/");
                callback();
            }
        });
    };

    var init = function(callback) {

        
        // check if flash is installed.  If not, hide the chart type toggle.
        flashBlockDetect(function(val){
            if( val > 0 ) $("#chart-type-btn-group").hide();        
        });

        // setup export modal
        exporter.init();
        $("#export-csv").on('click', function(){
            exporter.exportCsv(csvResults);
        });

        var ele = $("#inputs-content");
        inputForm.create(ele);

        $("#runbtn, #runbtn-sm").on('click', function() {
            runModel();
        });

        // initialize the charts
        charts.init();

        // set default config
        $("#input-manage-DatePlanted").val(new Date().toISOString().replace(/T.*/,''));
        $("#input-manage-DateCoppiced").val(new Date(new Date().getTime()+(86400000*2*365)).toISOString().replace(/T.*/,''));
        $("#input-manage-DateFinalHarvest").val(new Date(new Date().getTime()+(86400000*10*365)).toISOString().replace(/T.*/,''));
    
        // setup nice scrolling
        $('.app-nav').on('click', function(e) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: $(this.hash).offset().top-55
             }, 700);
       });

        $(window).resize(function(){
            charts.resize();

            if( weatherCustomChart ) {
                weatherCustomChart = charts.createWeatherChart($('#custom-weather-chart')[0], window.custom_weather);
            }
        });

        callback();
    }


    var runComplete = function(rows) {
        if ( runCallback ) runCallback(rows);
        if( hideInitLoading ) hideInitLoading();
        runCallback = null;
    }

    var monthsToRun = function() {
        var d1 = $("#input-manage-DatePlanted").val();
        if (d1 && d1 != "") {
            d1 = new Date($("#input-manage-DatePlanted").val());
        } else {
            d1 = new Date();
        }

        var d2 = $("#input-manage-DateFinalHarvest").val();
        if (d2 && d2 != "") {
            d2 = new Date($("#input-manage-DateFinalHarvest").val());
        } else {
            d2 = new Date();
        }

        var months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth() + 1;
        months += d2.getMonth();
        return months <= 0 ? 1 : months+1;
    }

    
    var runModel = function(isRt) {

        if ($("#runbtn, #runbtn-sm").hasClass("disabled")) return;
        $("#runbtn, #runbtn-sm").addClass("disabled").html("Running...");

        if( !checkWeather() ) return;
    
        // let UI process for a sec before we tank it
        // TODO: this should be preformed w/ a webworker
        setTimeout(function() {
            ga('send', 'event', 'ui', 'interaction', 'model-run', 1);

            // read everything so the variations are set
            window.variations = {};
            m3PGIO.readFromInputs();

            // make sure we are only setting 2 variation parameters
            var params = [];
            for( var key in window.variations ) params.push(key);
            if( params.length > 2 ) {
                alert("There is a limit of 2 variation parameters per run.  Currently you are varying "+
                      "the following parameters:\n\n -"+params.join("\n -"));
                $("#runbtn, #runbtn-sm").removeClass("disabled").html("<i class='icon-play'></i> Run");
                return;
            }

            // let the world know what we are doing
            if( !isRt ) gdrive.runModelRt();

            // show what we are doing
            $("#variationAnalysisStatus").html("<b>"+(params.length == 0 ? "None" : params.join(", "))+"</b>");

            // we are only running once
            if ( params.length == 0 ) {
                ga('send', 'event', 'ui', 'interaction', 'model-run-singleParam', 1);

                runCallback = function(rows) {
                    showResults(rows);
                }
                m3PG.run(monthsToRun());

            } else {
                ga('send', 'event', 'ui', 'interaction', 'model-run-variation', 1);

                // set variation order
                var runs = [];
                for( var i = 0; i < window.variations[params[0]].length; i++ ) {
                    var obj = {
                        inputs : {},
                        output : null
                    }
                    obj.inputs[params[0]] = window.variations[params[0]][i]; 
                    if( params.length > 1 ) {
                        for( var j = 0; j < window.variations[params[1]].length; j++ ) {
                            var t = $.extend(true, {}, obj);
                            t.inputs[params[1]] = window.variations[params[1]][j];
                            runs.push(t);
                        }
                    } else {
                        runs.push(obj);
                    }
                }
            
                runVariation(0, runs);
            }
        }, 250);
    }

    var runVariation = function(index, runs) {
        // set input variables for run
        var run = runs[index];
        for( var key in run.inputs ) {
            $("#input-"+key.replace(/\./g, '-')).val(run.inputs[key]);
        }

        runCallback = function(data) {
            runs[index].output = data;
            index++;
            
            if (runs.length == index) {
                // reset the constant to the first value
                for( var key in window.variations ) {
                    $("#input-"+key.replace(/\./g, '-')).val(window.variations[key].join(", "));
                }
                showResults(runs);
            } else {
                runVariation(index, runs);
            }
        }

        m3PG.run(monthsToRun());
    }


    var showResults = function(result) {
        if( result[0] instanceof Array ) {
            result = [{
                singleRun : true,
                inputs : {},
                output : result
            }]
        }

        currentResults = result;

        showRawOutput(result);
        charts.updateCharts(result, true);

        setTimeout(function() {
            $("#runbtn, #runbtn-sm").removeClass("disabled").html("<i class='icon-play'></i> Run");
        }, 250);

    }

    // make sure all the weather is set.  #1 thing people will mess up
    var checkWeather = function() {
        // first get current months we are going to run,
        var start = $("#input-manage-DatePlanted").val();

        var end = $("#input-manage-DateFinalHarvest").val().split("-");
        var eMonth = parseInt(end[1]);
        var eYear = parseInt(end[0]);

        var cDate = new Date(start);

        // now see if we have custom weather coverage
        var hasCoverage = true;
        var count = 0;
        while( count < 10000 ) {
            if( !window.custom_weather ) {
                hasCoverage = false;
                break;
            }

            var m = (cDate.getMonth()+1)+'';
            var y = cDate.getFullYear();
            if( m.length == 1 ) m = '0'+m;

            if( cDate.getMonth()+1 == eMonth && y == eYear ) {
                break;
            } else if( !window.custom_weather[y+'-'+m] ) {
                hasCoverage = false;
                break;
            }

            cDate.setMonth(cDate.getMonth()+1);
            count++;
        }

        if( hasCoverage ) return true;

        // if not make sure we have averages selected
        for ( var i = 0; i < 12; i++) {
            for ( var j = 1; j < inputs.weather.length; j++) {
                var c = inputs.weather[j];
                var val = parseFloat($("#input-weather-" + c + "-" + i).val());
                if( !val && val != 0 ) {
                    alert("Missing weather data: "+c+" for month "+i+"\n\n"+
                          "Did you select a location (Setup) and/or are all weather/soil fields filled out?");
                    $("#runbtn, #runbtn-sm").removeClass("disabled").html("<i class='icon-play'></i> Run");
                    return false;
                }
            }
        }

        return true;
    }

    var setWeather = function(data) {
        if( !window.custom_weather ) window.custom_weather = {};

        if( data ) {
            for( var key in data ) {

                // clean up date format
                var date = key.replace(/[^\d-]/,'');
                var parts = date.split('-');

                if( parts.length < 2 ) {
                    return alert('Invalid Date Format.  Dates should be in YYYY-MM format');
                }
                if ( parts[1].length != 2 ) {
                    date = parts[0]+"-0"+parts[1];
                }

                window.custom_weather[date] = data[key];
            }
        }

        // create array so we can sort
        var arr = [];
        var headers = ['date'];
        for( var date in window.custom_weather ) {

            var t = [date];
            for( var key in window.custom_weather[date] ) {
                if( key == 'nrel' ) continue;
                if( arr.length == 0 ) headers.push(key);
                t.push(window.custom_weather[date][key]);
            }

            arr.push(t);
        }

        if( arr.length == 0 ) {
            $('#custom-weather-panel').html("No weather data has been uploaded.");
            return;
        }

        var html = '<div style="overflow:auto;max-height:600px"><table class="table table-striped"><tr>';

        arr.sort(function(a, b){
            var d1 = new Date(a[0]+"-01").getTime();
            var d2 = new Date(b[0]+"-01").getTime();

            if( d1 < d2 ) {
                return 1;
            } else if( d1 > d2 ) {
                return -1;
            }
            console.log(3);
            return 0; 
        });

        for( var i = 0; i < headers.length; i++ ) {
            html += '<th>'+headers[i]+'</th>';
        }
        html += '</tr>';

        for( var i = 0; i < arr.length; i++ ) {
            html += '<tr><td>'+arr[i].join('</td><td>')+'</td></tr>';
        }

        $('#custom-weather-panel').html(html+'</table></div><div id="custom-weather-chart"></div>');

        setTimeout(function(){
            weatherCustomChart = charts.createWeatherChart($('#custom-weather-chart')[0], window.custom_weather);
        }, 1000);

    }

    var showRawOutput = function(results) {

        // selected in the charts output
        var vars = $("#chartTypeInput").val();

        // find the rows we care about
        var chartRows = {};
        for( var i = 0; i < results[0].output[0].length; i++ ) {
            if( vars.indexOf(results[0].output[0][i]) > -1 ) chartRows[results[0].output[0][i]] = i;
        }

        var tabs = $('<ul class="nav nav-pills" id="rawOutputTabs"  data-tabs="pill"></ul>');
        var contents = $('<div class="pill-content" style="overflow:auto;margin-top:15px"></div>');

        for ( var i = 0; i < vars.length; i++) {
            tabs.append($('<li '+(i == 0 ? 'class="active"' : "")+'><a href="#rawout'
                +vars[i]+'" data-toggle="tab">'+vars[i]+'</a></li>'));
        
            contents.append($('<div class="pill-pane ' + (i == 0 ? 'active' : "")
                + '" id="rawout' + vars[i] + '"></div>'));
        }

        $("#output-content").html("").append(tabs).append(contents);
        $("#rawOutputTabs").tab();

        csvResults = {
            config : m3PGIO.exportSetup(),
            data : {}
        };

        // some rows have strings, we don't want these
        // ignore string rows
        for( var i = 0; i < results.length; i++ ) {
            var clean = [results[i].output[0]];
            for( var j = 1; j < results[i].output.length; j++ ) {
                if( typeof results[i].output[j][0] != 'string' ) clean.push(results[i].output[j]);
            }
            results[i].output = clean;
        }

        var cDate = new Date($("#input-manage-DatePlanted").val());

        var table, row;
        for( var key in chartRows ) {
            table = "<table class='table table-striped'>";

            csvResults.data[key] = [];

            for( var j = 0; j < results[0].output.length; j++ ){
                csvResults.data[key][j] = [];

                // set header row
                if( j == 0 ) {
                    csvResults.data[key][j].push('month');
                    csvResults.data[key][j].push('date');

                    table += "<tr><th>Month</th><th>Date</th>";
                    for( var z = 0; z < results.length; z++ ) {
                        table += "<th>";
                        var tmp = [];

                        for( var mType in results[z].inputs ) {
                            tmp.push(mType+"="+results[z].inputs[mType]);
                            table += "<div>"+mType+"="+results[z].inputs[mType]+"</div>";
                        }

                        if( tmp.length == 0 ) {
                            csvResults.data[key][j].push(key);
                            table += key;
                        } else {
                            csvResults.data[key][j].push(tmp.join(" "));
                        }
                        table += "</th>";
                    }

                    table += "</tr>";
                } else {
                    var date = new Date(cDate.getYear()+1900, cDate.getMonth()+j, cDate.getDate());
                    var m = date.getMonth()+1;
                    if( m < 10 ) m = '0'+m;

                    table += "<tr><td>"+j+"</td><td>"+date.getFullYear()+'-'+m+"</td>";

                    csvResults.data[key][j].push(j);
                    csvResults.data[key][j].push(date.getFullYear()+'-'+m);

                    var v;
                    for( var z = 0; z < results.length; z++ ) {
                        v = results[z].output[j][chartRows[key]];
                        table += "<td>"+v+"</td>";
                        csvResults.data[key][j].push(v);
                    }
                    table += "</tr>";  
                }
                     
            }
            $("#rawout" + key).html(table+"</table>");
        }

        // make sure we can see the export btn
        if( !offlineMode ) $("#show-export-csv").show();
    }


    // Special Sauce... 
    // basically the code loaded from GitHub expects the following to exists in the window scope
    //   m3PGIO
    //     - readAllContants
    //     - readWeather
    //     - dump
    //     - readFromInputs
    // So we inject functions that interact w/ our UI, model in no way cares 
    m3PGIO = {
        readAllConstants : function(plantation) {
            this.readFromInputs();

            for ( var key in window.plantation)
                plantation[key] = window.plantation[key];
            plantation.coppicedTree = window.tree;

            // setup seedling Tree
            // TODO: hardcoded for now, this shouldn't be
            plantation.seedlingTree = $.extend(true, {}, window.tree);
            plantation.seedlingTree.stemsPerStump = 1;
            plantation.seedlingTree.pfs.stemCnt = 1;
            plantation.seedlingTree.rootP = {
                LAITarget : 10,
                efficiency : 0.6,
                frac : 0.01
            }

        },
        readWeather : function(weatherMap, plantingParams, customWeatherMap) {
            var datePlanted = $("#input-manage-DatePlanted").val();
            if (datePlanted && datePlanted != "") {
                plantingParams.datePlanted = new Date($("#input-manage-DatePlanted").val());
            } else {
                plantingParams.datePlanted = new Date();
            }

            var dateCoppiced = $("#input-manage-DateCoppiced").val();
            if (dateCoppiced && dateCoppiced != "") {
                plantingParams.dateCoppiced = new Date($("#input-manage-DateCoppiced").val());
            } else {
               // set error condition : TODO
            } 

            var DateFinalHarvest = $("#input-manage-DateFinalHarvest").val();
            if (DateFinalHarvest && DateFinalHarvest != "") {
                plantingParams.DateFinalHarvest = new Date($("#input-manage-DateFinalHarvest").val());
            } else {
               // set error condition : TODO
            }

            var yearsPerCoppice = $("#input-manage-CoppiceInterval").val();
            if (yearsPerCoppice && yearsPerCoppice != "") {
                plantingParams.yearsPerCoppice = parseInt($("#input-manage-CoppiceInterval").val());
            }

            window.plantingParams = plantingParams;

            for ( var i = 0; i < 12; i++) {
                var item = {
                    month : (i + 1)
                };
                for ( var j = 1; j < inputs.weather.length; j++) {
                    var c = inputs.weather[j];
                    item[c] = this._readVal($("#input-weather-" + c + "-" + i));
                }
                item.nrel = item.rad / 0.0036;

                weatherMap[i] = item;
            }

            window.weather = weatherMap;

            if( window.custom_weather ) {
                for( var date in window.custom_weather ) {
                    window.custom_weather[date].nrel = window.custom_weather[date].rad / 0.0036;
                    customWeatherMap[date] = window.custom_weather[date];
                }
            }

            return weatherMap;
        },
        dump : function(rows, sheet) {
            // set the raw output
            runComplete(rows);
        },
        // read a value from the input
        // it has a ',' is set for variation
        _readVal : function(ele) {
            var val = ele.val();
            if( val.match(/\d*-\d*-\d*$/) ) {
                return val;
            } else if( val.match(/.*,.*/) ) {
                val = val.replace(/\s/g,'').split(",");
                var id = ele.attr("id").replace(/^input-/,'').replace(/-/g,'.');
                window.variations[id] = [];
                for( var i = 0; i < val.length; i++ ) {
                    window.variations[id].push(parseFloat(val[i]));
                }
                return window.variations[id][0];
            }
            return parseFloat(val);
        },
        readFromInputs : function() {
            // read soil
            window.soil = {};
            window.soil.maxAWS = this._readVal($("#input-soil-maxaws"));
            window.soil.swpower = this._readVal($("#input-soil-swpower"));
            window.soil.swconst = this._readVal($("#input-soil-swconst"));

            // read manage
            window.manage = {
                coppice : false
            };
            var eles = $(".manage");
            for ( var i = 0; i < eles.length; i++) {
                var ele = $(eles[i]);
                window.manage[ele.attr("id").replace("input-manage-", "")] = this._readVal(ele);
            }

            // read plantation
            window.plantation = {};
            eles = $(".plantation");
            for ( var i = 0; i < eles.length; i++) {
                var ele = $(eles[i]);
                window.plantation[ele.attr("id").replace("input-plantation-", "")] = this._readVal(ele);
            }

            // read tree
            var treeInputs = $(".tree");
            window.tree = {};
            for ( var i = 0; i < treeInputs.length; i++) {
                var ele = $(treeInputs[i]);

                var parts = ele.attr("id").replace("input-tree-", "").split("-");
                if (parts.length == 1) {
                    window.tree[parts[0]] = this._readVal(ele);
                } else {
                    if (!window.tree[parts[0]])
                        window.tree[parts[0]] = {};
                    window.tree[parts[0]][parts[1]] = this._readVal(ele);
                }
            }

            // read plantation state
            window.plantation_state = {};
            for ( var key in _3pgModel.plantation_state.value) {
                window.plantation_state[key] = -1;
            }

        },
        exportSetup : function() {
            window.variations = {};
            this.readFromInputs();
            this.readWeather([], {}, {});

            var ex = {
                weather : window.weather,
                custom_weather : window.custom_weather,
                tree : window.tree,
                plantation : window.plantation,
                manage : window.manage,
                soil : window.soil,
                plantingParams : window.plantingParams,
                plantation_state : window.plantation_state,
                config : {
                    chartTypeInput : $("#chartTypeInput").val(),
                    monthsToRun : monthsToRun(),
                    currentLocation : $("#current-location").html(),
                    loadedTree : $("#loaded-tree-name").html(),
                    version : qs("version") ? qs("version") : "master"
                }
            }

            // by default the read function set the variations variables but only
            // returns the first, set the variation params to their correct values
            for( var key in window.variations ) {
                var parts = key.split(".");
                var param = ex;
                for( var i = 0; i < parts.length-1; i++ ) {
                    param = param[parts[i]];
                }
                param[parts[parts.length-1]] = window.variations[key].join(", ");
            }        

            return ex;
        },    
        loadTree : function(tree) {
            for ( var rootKey in tree) {
                if (typeof tree[rootKey] != 'object') {
                    $("#input-tree-" + rootKey).val(tree[rootKey]);
                } else {
                    for ( var childKey in tree[rootKey]) {
                        $("#input-tree-" + rootKey + "-" + childKey).val(tree[rootKey][childKey]);
                    }
                }
            }
        },
        loadSetup : function(fileid, setup, isRt) {

            // first, if the version is off, we need to reload the entire app
            if (setup.config.version) {
                var cversion = qs("version") ? qs("version") : "master";
                if (cversion != setup.config.version) {
                    window.location = window.location.href.replace(/#.*/, '')
                            + "?version=" + setup.config.version + "&file="
                            + fileid;
                }
            }

            // load config
            if (setup.config.chartTypeInput) {
                charts.unselectAll();
                for ( var i = 0; i < setup.config.chartTypeInput.length; i++) {
                    charts.select(setup.config.chartTypeInput[i]);
                }
            }
            if (setup.config.currentLocation) {
                $("#current-location").html(setup.config.currentLocation);
            }
            if( setup.config.loadedTree ) {
                $("#loaded-tree-name").html(setup.config.loadedTree).parent().show();
            }

            // load weather
            for ( var i = 0; i < setup.weather.length; i++) {
                for ( var key in setup.weather[i]) {
                    if (key == 'month')
                        continue;
                    if (setup.weather[i][key] != null)
                        $("#input-weather-" + key + "-" + i).val(setup.weather[i][key])
                    else
                        $("#input-weather-" + key + "-" + i).val("");
                }
            }

            if( setup.custom_weather ) {
                window.custom_weather = setup.custom_weather;
            } else {
                window.custom_weather = {};
            }

            // create the chart
            inputForm.updateAverageChart();

            // load tree
            this.loadTree(setup.tree);

            // load planting params
            // Now part of manage....
            // fo
            if (setup.plantingParams) {
                var map = {
                    "datePlanted" : "DatePlanted",
                    "dateCoppiced" : "DateCoppiced",
                    "yearsPerCoppice" : "CoppiceInterval"
                }

                for ( var key in setup.plantingParams) {
                    var newKey = key;
                    if( map[key] ) newKey = map[key];

                    if (typeof setup.plantingParams[key] == 'string')
                        $("#input-manage-" + newKey).val(setup.plantingParams[key].replace(/T.*/, ''));
                    else
                        $("#input-manage-" + newKey).val(setup.plantingParams[key]);
                }
            }

            // this value is deprecated, set to new input
            if( setup.config.monthsToRun ) {
                var d = new Date(setup.plantingParams.datePlanted);
                d = new Date(new Date(d).setMonth(d.getMonth()+parseInt(setup.config.monthsToRun)));
                $("#input-manage-DateFinalHarvest").val(d.toISOString().replace(/T.*/, ''));
            }
            

            // load rest
            var inputs = [ "plantation", "soil", "manage" ];
            for ( var i = 0; i < inputs.length; i++) {
                for ( var key in setup[inputs[i]]) {
                    if (key == 'maxAWS') {
                        $("#input-soil-maxaws").val(setup.soil.maxAWS);
                    } else if ( typeof setup[inputs[i]][key] == 'string' && setup[inputs[i]][key].match(/.*T.*Z$/) ) {
                        $("#input-" + inputs[i] + "-" + key).val(setup[inputs[i]][key].replace(/T.*/, ''));
                    } else {
                        $("#input-" + inputs[i] + "-" + key).val(setup[inputs[i]][key]);
                    }
                }
            }

            runModel(isRt);
        }
    };

    return {
        init : init,
        outputs : outputs,
        getModel : getModel,
        runModel : runModel,
        showRawOutput : showRawOutput,
        outputDefinitions : outputDefinitions,
        qs : qs,
        loadModelCode : loadModelCode,
        setWeather : setWeather
    };
});
