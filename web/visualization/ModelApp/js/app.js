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
            console.log("Cache hit");
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
    
    $('#configuration-btn, #config-hide-btn, #configuration-btn-sm').on('click', function(){
        if( $("#configuration").hasClass("open") ) {
            $('#configuration').animate({top: -500},600,'swing').removeClass("open");
        } else {
            $('#configuration').animate({top: 50},600,'swing').addClass("open");
        }
    });
    
}

app.createInputs = function(callback) {
    var ele = $("#inputs-content");

    var chartTypeSelector = $("#chartTypeInput");
    for ( var i = 0; i < app.outputs.length; i++) {
        var val = app.outputs[i];
        chartTypeSelector.append($("<option value='" + val + "' "
                + (val == 'WR' || val == 'WS' || val == 'WF' ? 'selected' : '')
                + ">" + val + "</option>"));
    }

    // multiselect
    chartTypeSelector.multiselect({
        buttonClass : 'btn',
        buttonWidth : 'auto',
        buttonContainer : '<div class="btn-group" />',
        maxHeight : false,
        buttonText : function(options) {
            if (options.length == 0) {
                return 'None selected <b class="caret"></b>';
            } else if (options.length > 3) {
                return options.length + ' selected  <b class="caret"></b>';
            } else {
                var selected = '';
                options.each(function() {
                    selected += $(this).text() + ', ';
                });
                return selected.substr(0, selected.length - 2)
                        + ' <b class="caret"></b>';
            }
        }
    });
    // fix bootstrap 3 style
    $("button.multiselect.dropdown-toggle.btn").addClass("btn-default");

    var variationAnalysisInput = $("#variationAnalysisInput");
    variationAnalysisInput.on('change', function() {
        var val = variationAnalysisInput.val();

        if (val == "" || val == "None") {
            $("#multiRunVarInputs-outer").hide();
            return;
        }

        $("#multiRunVarInputs-outer").show();
        $("#multiRunVarInputs").val(
                $("#input-" + val.replace(/\./g, "-")).val());
    });

    callback();
}

app.setVariationFromLink = function(ele) {
    $("#variationAnalysisInput").val(ele.attr("param").replace('input-','').replace(/-/g,'.'));
    $("#variationAnalysisInput").trigger("change");
    
    if( !$("#configuration").hasClass("open") ) 
        $('#configuration-btn').trigger('click');
    
    $("#multiRunVarInputs").focus();
}



app.runComplete = function(rows) {
    if (app.runCallback)
        app.runCallback(rows);
    app.runCallback = null;
}

app._currentDefaultVariation = "";
app.runModel = function() {

    // let UI process for a sec before we tank it
    // TODO: this should be preformed w/ a webworker
    setTimeout(function() {
        var variation = $("#variationAnalysisInput").val();
        var runCount = 0;

        if (variation == "" || variation == "None") {

            app.runCallback = function(rows) {
                app.showResults(rows);
            }
            m3PG.run(parseInt($("#monthsToRun").val()));

        } else {
            app.runVariation(0, [], variation, $("#multiRunVarInputs").val()
                    .replace(/\s/g, '').split(","));
        }
    }, 250);

}

app.runVariation = function(index, rows, type, variations) {
    // save the default value
    if (index == 0)
        app._currentDefaultVariation = $("#input-" + type.replace(/\./g, '-'))
                .val();
    $("#input-" + type.replace(/\./g, '-')).val(variations[index]);

    app.runCallback = function(data) {
        rows.push(data);
        index++;
        if (variations.length == index) {
            // reset the constant to the first value
            $("#input-" + type.replace(/\./g, '-')).val(
                    app._currentDefaultVariation);
            app.showResults(rows);
        } else {
            app.runVariation(index, rows, type, variations);
        }
    }

    m3PG.run(parseInt($("#monthsToRun").val()));
}

app.showResults = function(rows) {
    if (typeof rows[0][0] != "object")
        rows = [ rows ];

    app.showRawOutput(rows);

    $("#chart-content").html("");
    var types = $("#chartTypeInput").val();
    for ( var i = 0; i < types.length; i++) {
        app.showChart(types[i], rows);
    }

    setTimeout(function() {
        $("#runbtn").removeClass("disabled").html(
                "<i class='icon-play'></i> Run");
    }, 250);

}

app.showChart = function(type, rows) {
    var panel = $("<div />");
    $("#chart-content").append(panel);

    var col = 0;
    var data = [ [ "month" ] ];

    var vType = $("#variationAnalysisInput").val();
    var variations = $("#multiRunVarInputs").val().replace(/\s/g, '')
            .split(",");

    for ( var i = 0; i < rows.length; i++) {
        data[0].push(type
                + " "
                + (vType != "None" ? "(" + vType + "=" + variations[i] + ")"
                        : ""));
    }

    for ( var i = 0; i < rows[0][0].length; i++) {
        if (rows[0][0][i] == type) {
            col = i;
            break;
        }
    }

    for ( var i = 1; i < rows[0].length; i++) {
        if (typeof rows[0][i][col] === 'string')
            continue;
        var row = [ i ];
        for ( var j = 0; j < rows.length; j++) {
            row.push(rows[j][i][col]);
        }
        data.push(row);
    }

    var dt = google.visualization.arrayToDataTable(data);

    var chart = new google.visualization.LineChart(panel[0]);
    chart.draw(dt, {});
}

app.showRawOutput = function(data) {

    var tabs = $('<ul class="nav nav-tabs" id="rawOutputTabs"  data-tabs="tabs"></ul>');
    var contents = $('<div class="tab-content" style="overflow:auto"></div>');

    var vType = $("#variationAnalysisInput").val();
    var variations = $("#multiRunVarInputs").val().replace(/\s/g, '')
            .split(",");

    for ( var i = 0; i < data.length; i++) {
        tabs.append($('<li '+(i == 0 ? 'class="active"' : "")+'><a href="#rawout'
                +i+'" data-toggle="tab">Output '+(vType == 'None' ? '' : '(' 
                +vType+'='+variations[i]+')')+'</a></li>'));
        
        contents.append($('<div class="tab-pane ' + (i == 0 ? 'active' : "")
                + '" id="rawout' + i + '"></div>'));
    }
    $("#output-content").html("").append(tabs).append(contents);
    $("#rawOutputTabs").tab();

    var table, row;
    for ( var i = 0; i < data.length; i++) {

        table = "<table class='table table-striped'>";
        for( var j = 0; j < data[i].length; j++ ){
            row = data[i][j];
            table += "<tr>";
            for( var z = 0; z < row.length; z++ ) {
                if( j == 0 ) table += "<th>"+row[z]+"</th>";
                else table += "<td>"+row[z]+"</td>";
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
                item[c] = parseFloat($("#input-weather-" + c + "-" + i).val());
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
    readFromInputs : function() {
        // read soil
        window.soil = {};
        window.soil.maxAWS = parseFloat($("#input-soil-maxaws").val());
        window.soil.swpower = parseFloat($("#input-soil-swpower").val());
        window.soil.swconst = parseFloat($("#input-soil-swconst").val());

        // read manage
        window.manage = {
            coppice : false
        };
        var eles = $(".manage");
        for ( var i = 0; i < eles.length; i++) {
            var ele = $(eles[i]);
            window.manage[ele.attr("id").replace("input-manage-", "")] = parseFloat(ele.val());
        }

        // read plantation
        window.plantation = {};
        eles = $(".plantation");
        for ( var i = 0; i < eles.length; i++) {
            var ele = $(eles[i]);
            window.plantation[ele.attr("id").replace("input-plantation-", "")] = parseFloat(ele.val());
        }

        // read tree
        var treeInputs = $(".tree");
        window.tree = {};
        for ( var i = 0; i < treeInputs.length; i++) {
            var ele = $(treeInputs[i]);

            var parts = ele.attr("id").replace("input-tree-", "").split("-");
            if (parts.length == 1) {
                window.tree[parts[0]] = parseFloat(ele.val());
            } else {
                if (!window.tree[parts[0]])
                    window.tree[parts[0]] = {};
                window.tree[parts[0]][parts[1]] = parseFloat(ele.val());
            }
        }

        // read plantation state
        window.plantation_state = {};
        for ( var key in app.model.plantation_state.value) {
            window.plantation_state[key] = -1;
        }

    },
    exportSetup : function() {
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
                variationAnalysisInput : $("#variationAnalysisInput").val(),
                multiRunVarInputs : $("#multiRunVarInputs").val(),
                chartTypeInput : $("#chartTypeInput").val(),
                monthsToRun : $("#monthsToRun").val(),
                currentLocation : $("#current-weather-location").html(),
                version : qs("version") ? qs("version") : "master"
            }
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
            var chartTypeSelector = $("#chartTypeInput");
            $('option', chartTypeSelector).each(function(element) {
                chartTypeSelector.multiselect('deselect', $(this).val());
            });
            for ( var i = 0; i < setup.config.chartTypeInput.length; i++) {
                chartTypeSelector.multiselect('select',
                        setup.config.chartTypeInput[i]);
            }
        }
        if (setup.config.currentLocation) {
            $("#current-weather-location").html(setup.config.currentLocation);
        }
        var configs = [ "variationAnalysisInput", "multiRunVarInputs",
                "monthsToRun" ];
        for ( var i = 0; i < configs.length; i++) {
            if (setup.config[configs[i]])
                $("#" + configs[i]).val(setup.config[configs[i]]);
        }
        if ($("#variationAnalysisInput").val() == 'None')
            $("#multiRunVarInputs-outer").hide();
        else
            $("#multiRunVarInputs-outer").show();

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