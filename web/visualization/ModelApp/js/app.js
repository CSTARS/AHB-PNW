app.output_definitions = {
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
            label : "Leaf Biomass",
            units : "Mg/ha",
            description : "",
            fn : function(prev_WR, cur_dW, cur_pR, turnover, prev_WR, cur_RootP) { 
                return prev_WR + cur_dW * cur_pR - tree.pR.turnover * prev_WR - cur_RootP;
            }
        }, 
        WS : {
            label : "Steam Biomass",
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
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta
                                                            // chars
    var match = location.search
            .match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

app.loadModelCode = function(version, callback) {

    // load script from a this server
    // scripts should be in /jslib
    if (app.devmode) {
        console.log("DevMode: Loading local scripts");
        $.getScript("jslib/Model3PG.js", function() {
            $.getScript("jslib/SingleRunFunctions.js", function() {
                $.getScript("jslib/DataModel.js", function() {
                    callback();
                });
            });
        });
        return;
    }

    if (typeof version === 'function')
        callback = version;
    if (!version || typeof version != 'string')
        version = "master";

    app._requestModelCode(
        "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/Model3PG.js?ref="
                + version,
        function(data) {
            // clean then base64 decode file content
            // finally, eval js
            eval(atob(data.content.replace(/[\s\n]/g, '')));

            // set m3PG object to window scope
            window.m3PG = m3PG;

            app._requestModelCode(
                "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/SingleRunFunctions.js?ref="+ version,
                function(data) {
                    eval(atob(data.content.replace(/[\s\n]/g, '')));
                    window.m3PGFunc = m3PGFunc;
                    app._requestModelCode(
                        "https://api.github.com/repos/CSTARS/AHB-PNW/contents/models/3pg/js/DataModel.js?ref="+ version,
                        function(data) {
                            eval(atob(data.content.replace(/[\s\n]/g,'')));
                            app.model = model;
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
app._requestModelCode = function(url, callback) {
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
            alert("Failed to load " + url + " from github");
            callback();
        }
    });
}

app.loadSpreadsheetData = function(callback) {

    var rootUrl = "https://docs.google.com/spreadsheet/tq?key="
            + app.spreadsheet.id + "&gid=";
    var loadCount = 0;

    var metadataQuery = new google.visualization.Query(rootUrl
            + app.spreadsheet.worksheets.metadata);

    metadataQuery.setQuery('');

    metadataQuery.send(function(response) {
        app.spreadsheet.dataTables["metadata"] = response;
        callback();
    });

}

app.init = function(callback) {

    var ele = $("#inputs-content");
    app.inputForm.create(ele);

    $("#runbtn, #runbtn-sm").on('click', function() {
        if ($(this).hasClass("disabled"))
            return;
        $(this).addClass("disabled").html("Running...");
        app.runModel();
    });

    app.createInputs(function() {
        callback();
    });

    // set default config
    $("#input-date-datePlanted").val(new Date().toISOString().replace(/T.*/,''));
    $("#input-date-dateCoppiced").val(new Date(new Date().getTime()+(86400000*2*365)).toISOString().replace(/T.*/,''));
    $("#input-date-yearsPerCoppice").val(3);
    
    $(window).resize(function(){
        _resizeConfig();
    });
    $('#configuration-btn, #config-hide-btn, #configuration-btn-sm').on('click', function(){
        if( $("#configuration").hasClass("open") ) {
            $('#configuration').animate({top: $("#configuration").height()*-1},500).removeClass("open");
        } else {
            $('#configuration').animate({top: 50},500).addClass("open");
        }
    });
    _resizeConfig();
}

function _resizeConfig(){
    app.charts.resize();
    
    if( !$("#configuration").hasClass("open") ) {
        $("#configuration").css("top",$("#configuration").height()*-1);
        return;
    }
    
    if( $("#configuration").height() -50 > $(window).height() ) $("#configuration").css("height", $(window).height()-50)
    else $("#configuration").css("height", 'auto');
}


app.createInputs = function(callback) {
    var ele = $("#inputs-content");

    app.charts.init();


    callback();
}

app.runComplete = function(rows) {
    if (app.runCallback)
        app.runCallback(rows);
    app.runCallback = null;
}

app._currentDefaultVariation = "";
app.runModel = function() {
    // make sure all the weather is set.  #1 thing people will mess up
    for ( var i = 0; i < 12; i++) {
        for ( var j = 1; j < app.inputs.weather.length; j++) {
            var c = app.inputs.weather[j];
            var val = parseFloat($("#input-weather-" + c + "-" + i).val());
            if( !val && val != 0 ) {
                alert("Missing weather data: "+c+" for month "+i+"\n\n"+
                       "Did you select a location (Config) and/or are all weather/soil fields filled out?");
                $("#runbtn, #runbtn-sm").removeClass("disabled").html("<i class='icon-play'></i> Run");
                return;
            }
        }
    }
    
    
    // let UI process for a sec before we tank it
    // TODO: this should be preformed w/ a webworker
    setTimeout(function() {
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
        // show what we are doing
        $("#variationAnalysisStatus").html("<b>"+(params.length == 0 ? "None" : params.join(", "))+"</b>");

        if ( params.length == 0 ) {

            app.runCallback = function(rows) {
                app.showResults(rows);
            }
            m3PG.run(parseInt($("#monthsToRun").val()));

        } else {
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
            
            app.runVariation(0, runs);
        }
    }, 250);

}

app.runVariation = function(index, runs) {
    // set input variables for run
    var run = runs[index];
    for( var key in run.inputs ) {
        $("#input-"+key.replace(/\./g, '-')).val(run.inputs[key]);
    }

    // TODO: show the setup in the 'config' dropdown

    app.runCallback = function(data) {
        runs[index].output = data;
        
        index++;
        if (runs.length == index) {
            // reset the constant to the first value
            for( var key in window.variations ) {
                $("#input-"+key.replace(/\./g, '-')).val(window.variations[key].join(", "));
            }
            app.showResults(runs);
        } else {
            app.runVariation(index, runs);
        }
    }

    m3PG.run(parseInt($("#monthsToRun").val()));
}


app.showResults = function(result) {
    if( result[0] instanceof Array ) {
        result = [{
            singleRun : true,
            inputs : {},
            output : result
        }]
    }

    app.showRawOutput(result);
    app.charts.updateCharts(result);

    setTimeout(function() {
        $("#runbtn, #runbtn-sm").removeClass("disabled").html(
                "<i class='icon-play'></i> Run");
    }, 250);

}

app.showRawOutput = function(results) {
    // selected in the charts output
    var vars = $("#chartTypeInput").val();


    var tabs = $('<ul class="nav nav-tabs" id="rawOutputTabs"  data-tabs="tabs"></ul>');
    var contents = $('<div class="tab-content" style="overflow:auto"></div>');

    for ( var i = 0; i < results.length; i++) {
        var label = "";
        if( !results[i].singleRun ) {
            for( var key in results[i].inputs ) {
                label += key+"="+results[i].inputs[key]+", "; 
            }
            label = label.replace(/,\s$/,'');
        }

        tabs.append($('<li '+(i == 0 ? 'class="active"' : "")+'><a href="#rawout'
                +i+'" data-toggle="tab">Output '+label+'</a></li>'));
        
        contents.append($('<div class="tab-pane ' + (i == 0 ? 'active' : "")
                + '" id="rawout' + i + '"></div>'));
    }
    $("#output-content").html("").append(tabs).append(contents);
    $("#rawOutputTabs").tab();


    // find the rows we care about
    var chartRows = [];
    for( var i = 0; i < results[0].output[0].length; i++ ) {
        if( vars.indexOf(results[0].output[0][i]) > -1 ) chartRows.push(i);
    }

    var table, row;
    for ( var i = 0; i < results.length; i++) {

        table = "<table class='table table-striped'>";
        for( var j = 0; j < results[i].output.length; j++ ){
            row = results[i].output[j];
            table += "<tr>";
            for( var z = 0; z < chartRows.length; z++ ) {
                if( j == 0 ) table += "<th>"+row[chartRows[z]]+"</th>";
                else table += "<td>"+row[chartRows[z]]+"</td>";
            }
            table += "</tr>";
        }

        $("#rawout" + i).html(table+"</table>");
    }
}

// using our own m3PGIO lib
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
    readWeather : function(weatherMap, plantingParams) {
        var datePlanted = $("#input-date-datePlanted").val();
        if (datePlanted && datePlanted != "") {
            plantingParams.datePlanted = new Date($("#input-date-datePlanted").val());
        } else {
            plantingParams.datePlanted = new Date();
        }

        var dateCoppiced = $("#input-date-dateCoppiced").val();
        if (dateCoppiced && dateCoppiced != "") {
            plantingParams.dateCoppiced = new Date($("#input-date-dateCoppiced").val());
        }

        var yearsPerCoppice = $("#input-date-yearsPerCoppice").val();
        if (yearsPerCoppice && yearsPerCoppice != "") {
            plantingParams.yearsPerCoppice = parseInt($("#input-date-yearsPerCoppice").val());
        }
        window.plantingParams = plantingParams;

        for ( var i = 0; i < 12; i++) {
            var item = {
                month : (i + 1)
            };
            for ( var j = 1; j < app.inputs.weather.length; j++) {
                var c = app.inputs.weather[j];
                item[c] = this._readVal($("#input-weather-" + c + "-" + i));
            }
            item.nrel = item.rad / 0.0036;

            weatherMap[i] = item;
        }

        window.weather = weatherMap;

        return weatherMap;
    },
    dump : function(rows, sheet) {
        // set the raw output
        app.runComplete(rows);
    },
    // read a value from the input
    // it has a ',' is set for variation
    _readVal : function(ele) {
        var val = ele.val();
        if( val.match(/.*,.*/) ) {
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
        for ( var key in app.model.plantation_state.value) {
            window.plantation_state[key] = -1;
        }

    },
    exportSetup : function() {
        window.variations = {};
        this.readFromInputs();
        this.readWeather([], {});

        var ex = {
            weather : window.weather,
            tree : window.tree,
            plantation : window.plantation,
            manage : window.manage,
            soil : window.soil,
            plantingParams : window.plantingParam,
            plantation_state : window.plantation_state,
            plantingParams : window.plantingParams,
            config : {
                chartTypeInput : $("#chartTypeInput").val(),
                monthsToRun : $("#monthsToRun").val(),
                currentLocation : $("#current-weather-location").html(),
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
    loadSetup : function(fileid, setup) {
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
            app.charts.unselectAll();
            for ( var i = 0; i < setup.config.chartTypeInput.length; i++) {
                app.charts.select(setup.config.chartTypeInput[i]);
            }
        }
        if (setup.config.currentLocation) {
            $("#current-location").html(setup.config.currentLocation);
        }
        var configs = ["monthsToRun"];
        for ( var i = 0; i < configs.length; i++) {
            if (setup.config[configs[i]])
                $("#" + configs[i]).val(setup.config[configs[i]]);
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

        // load tree
        for ( var rootKey in setup.tree) {
            if (typeof setup.tree[rootKey] != 'object') {
                $("#input-tree-" + rootKey).val(setup.tree[rootKey]);
            } else {
                for ( var childKey in setup.tree[rootKey]) {
                    $("#input-tree-" + rootKey + "-" + childKey).val(setup.tree[rootKey][childKey]);
                }
            }
        }

        // load planting params
        if (setup.plantingParams) {
            for ( var key in setup.plantingParams) {
                if (typeof setup.plantingParams[key] == 'string')
                    $("#input-date-" + key).val(setup.plantingParams[key].replace(/T.*/, ''));
                else
                    $("#input-date-" + key).val(setup.plantingParams[key]);
            }
        }

        // load rest
        var inputs = [ "plantation", "soil", "manage" ];
        for ( var i = 0; i < inputs.length; i++) {
            for ( var key in setup[inputs[i]]) {
                if (key == 'maxAWS')
                    $("#input-soil-maxaws").val(setup.soil.maxAWS);
                else
                    $("#input-" + inputs[i] + "-" + key).val(setup[inputs[i]][key]);
            }
        }

        app.runModel();
    }
};
