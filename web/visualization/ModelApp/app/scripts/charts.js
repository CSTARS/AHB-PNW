define(["require"],function(require) {
    var app = null;

    // only draw charts if width has changed
    var cWidth = 0;
    
    // there is no way to get the colors for the legends (to make your own)
    // this post: 
    // gives these values.  This is a HACK, if they ever change, we need to update
    var googleChartColors = ["#3366cc","#dc3912","#ff9900","#109618","#990099","#0099c6",
                            "#dd4477","#66aa00","#b82e2e","#316395","#994499","#22aa99",
                            "#aaaa11","#6633cc","#e67300","#8b0707","#651067","#329262",
                            "#5574a6","#3b3eac","#b77322","#16d620","#b91383","#f4359e",
                            "#9c5935","#a9c413","#2a778d","#668d1c","#bea413","#0c5922"
                            ,"#743411"];

    var weatherChartOptions = {
        title : 'Weather',
        height : 300,
        vAxes: [{
                title: "Radiation (MJ/day); Temperature (^C); Dew Point (^C); Daylight (h)",
                minValue : -5,
                maxValue : 35
              },{
                title: "Precipitation (mm)",
                minValue : -50,
                maxValue : 350
              }],
        hAxis: {title: "Month"},
        seriesType: "bars",
        series: {
            0: {type: "line", targetAxisIndex:0},
            1: {type: "line", targetAxisIndex:0},
            2: {type: "line", targetAxisIndex:0},
            3: {type: "area", targetAxisIndex:1},
            4: {targetAxisIndex:0}
        }
    }

    // template for the popup
    var sliderPopup = $(
            "<div class='slide-popup'>" +
                "<i class='icon-remove-circle pull-right slide-popup-close'></i>"+
                "<div id='carousel' class='owl-carousel owl-theme' style='margin-top:15px'></div>" +
    		"</div>");

    var sliderPopupBg = $("<div class='slide-popup-bg'>&nbsp;</div>");
    
    // only draw charts if someone has click a checkbox
    var changes = false;

    // when sizing, wait a ~300ms before triggering redraw
    var resizeTimer = -1;

    var chartTypeSelector, chartCheckboxes, cData;
    
    function init() {
        app = require('app');

        $("#show-chartspopup-btn").on('click',function() {
            showPopup();
        });

        // setup chart selectors
        $("#chart-modal").modal({show:false});

        // set popup click handlers
        $("#chartType-selectAll").on('click',selectAll);
        $("#chartType-unselectAll").on('click',unselectAll);
       
        chartTypeSelector = $("#chartTypeInput");
        chartCheckboxes = $("#chartSelections");
        
        var c1 = $("#chartSelections-c1");
        var c2 = $("#chartSelections-c2");
        for( var i = 0; i < app.outputs.length; i++) {
            var val = app.outputs[i];
            chartTypeSelector.append($("<option value='" + val + "' "
                    + (val == 'WR' || val == 'WS' || val == 'WF' ? 'selected' : '')
                    + ">" + val + "</option>"));
            
            if( i % 2 == 0 ) {
                c1.append($('<div class="checkbox"><label><input type="checkbox"'
                        + (val == 'WR' || val == 'WS' || val == 'WF' ? 'checked="checked"' : '')
                        + ' value="'+val+'"> '+_createDescription(val)+'</div>'));
            } else {
                c2.append($('<div class="checkbox"><label><input type="checkbox"'
                        + (val == 'WR' || val == 'WS' || val == 'WF' ? 'checked="checked"' : '')
                        + ' value="'+val+'"> '+_createDescription(val)+'</div>'));
            }
        }
        
        chartCheckboxes.find(".fn-toggle").on('click',function(){
            $("#"+$(this).attr("datatarget")).toggle('slow');
        });
        
        chartCheckboxes.find("input[type=checkbox]").on('change', function(){
            if( $(this).is(":checked") ) select($(this).attr("value"));
            else unselect($(this).attr("value"));
        });
        
        $("#select-charts-btn, #select-charts-title-btn").on('click', function(){
            $("#chart-modal").modal('show');
            changes = false;
        });
        
        $(".chart-modal-close").on('click', function(){
            $("#chart-modal").modal('hide');
            if( changes && cData ) {
                setTimeout(function(){
                    updateCharts();
                    // update raw data as well
                    app.showRawOutput(cData);
                },400);
               
            }
        });

        $(".chart-type-toggle").on('click', function(){
            if( !$(this).hasClass("active") ) {
                $(".chart-type-toggle.active").removeClass("active");
                $(this).toggleClass("active");
                updateCharts();
            }
        });
    }
    
    // make sure and end label tag
    function _createDescription(val) {
        if( !app.outputDefinitions[val] ) return "<b>"+val+"</b></label>";
        
        var desc = app.outputDefinitions[val];
        var label = desc.label && desc.label.length > 0 ? " - "+desc.label : "";
        var units = desc.units && desc.units.length > 0 ? " ["+desc.units+"]" : "";
        
        var label = "<b>"+val+"</b><span style='font-size:12px'>"+label+units+"</span></label>";
        var hasDesc = desc.description && desc.description.length > 0;
        if( hasDesc ) {
            label += "<div style='font-size:11px;color:#888;font-style:italic'>"+desc.description;
        }
        
        var fName = desc.altFnName || val;
        if( m3PGFunc[fName] || m3PGFunc.coppice[fName] || desc.fn ) {
            if( !hasDesc ) label += "<div style='font-size:11px'>";
            label += " <a style='font-style:normal;cursor:pointer' datatarget='fn-desc-"+val+"' class='fn-toggle'>fn()</a></div>";
            
            label += "<div id='fn-desc-"+val+"' style='display:none;font-size:11px;overflow:auto' class='well well-sm'>"+
                        (m3PGFunc[fName]||m3PGFunc.coppice[fName]||desc.fn).toString().replace(/ /g,'&nbsp;').replace(/\n/g,'<br />')+"</div>";
        } else if ( hasDesc ) {
            label += "</div>"
        }
        
        // TODO: add fn well
        return label+"<br />"
    }
    
    function select(val) {
        chartTypeSelector.find("option[value="+val+"]").attr("selected","selected");
        chartCheckboxes.find("input[value="+val+"]").prop("checked",true);
        changes = true;
    }
    
    function unselect(val) {
        chartTypeSelector.find("option[value="+val+"]").removeAttr("selected");
        chartCheckboxes.find("input[value="+val+"]").prop("checked",false);
        changes = true;
    }
    
    function selectAll() {
        for( var i = 0; i < app.outputs.length; i++) select(app.outputs[i]);
    }
    
    function unselectAll() {
        for( var i = 0; i < app.outputs.length; i++) unselect(app.outputs[i]);
    }
    
    function remove(ele) {
        ele.parent().hide('slow', function(){
            ele.parent().remove();
            unselect(ele.attr('type'));
        });
        
    }

    function print(chartContainer) {
        ga('send', 'event', 'ui', 'interaction', 'print-chart', 1);


	    var disp_setting="toolbar=yes,location=no,directories=yes,menubar=yes,"; 
        disp_setting+="scrollbars=yes,width=800, height=600, left=25, top=25";
        
  	    var svg = chartContainer.find("svg");
        var html = chartContainer.find("div").html();
        
        var docprint=window.open("","",disp_setting); 
        docprint.document.open();
        docprint.document.write('<html><head><title></title>');
        docprint.document.write('</head><body marginwidth="0" marginheight="0" onLoad="self.print()"><center>');
        docprint.document.write(html);
        docprint.document.write('</center></body></html>'); 
        docprint.document.close(); 
        docprint.focus(); 

    }
    
    
    function setData(data) {
        cData = data;
    }

    // basically redraw everything
    function resize() {
        // require more than a 30 pixel width change (so we don't redraw w/ scroll bars added)
        var winWidth = $(window).width();
        if( cWidth > winWidth - 15 && cWidth < winWidth + 15 ) return;
        cWidth = winWidth;

        if( resizeTimer != -1 ) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            resizeTimer = -1;
            updateCharts();
        },300);
    }
    
    function updateCharts(results, animate) {
        if( results ) setData(results);
        if( !cData ) return;
        
        $("#show-chartspopup-btn").show();
        
        // create a legend if there is more than one run
        var legend = "";
        if( !cData[0].singleRun ) {
            var c1 = "";
            var c2 = "";
            for( var i = 0; i < cData.length; i++ ) {
                var ele = "<div style='min-height:40px;margin-bottom:10px'><div class='legend-square' style='background-color:"+googleChartColors[i]+"'>&nbsp;</div>";
                for( var mType in cData[i].inputs ) {
                    ele += "<div class='legend-text'>"+mType+"="+cData[i].inputs[mType]+"</div>";
                }

                if( i % 2 == 0 ) c1 += ele + "</div>"
                else c2 += ele + "</div>"
            }
            legend = "<div><a id='legend-panel-toggle' style='margin-left:5px;cursor:pointer'>Legend</a></div>"+
                     "<div style='border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:15px'>"+
                     "<div class='row' id='legend-panel'><div class='col-sm-6'>"+c1+"</div>"+
                     "<div class='col-sm-6'>"+c2+"</div>"+
                     "</div></div>";
        }
        $("#chart-content").html(legend);
        $("#legend-panel-toggle").on('click', function(){
            $("#legend-panel").toggle("slow");
        });


        var types = chartTypeSelector.val();
        for ( var i = 0; i < types.length; i++) {
            _showMainChart(types[i], animate);
        }
    }
    
    function showPopup() {
        ga('send', 'event', 'ui', 'interaction', 'show-chart-popup', 1);


        sliderPopup.find(".owl-theme").html("");
        $('body').scrollTop(0).css('overflow','hidden').append(sliderPopupBg).append(sliderPopup);

        // this could case badness....  why doesn't it live when removed from DOM?
        sliderPopup.find('.slide-popup-close').on('click',function(){
            hidePopup();
        });
        
        var types = chartTypeSelector.val();
        for ( var i = 0; i < types.length; i++) {
            _showPopupChart(types[i]);
        }
        
        $('#carousel').owlCarousel({    
            navigation : true, // Show next and prev buttons
            slideSpeed : 300,
            paginationSpeed : 400,
            singleItem:true
        });
    }
    
    function hidePopup() {
        sliderPopupBg.remove();
        sliderPopup.remove();
        $('body').css('overflow','auto');
    }
    
    function _showMainChart(type, animate) {
        var chartType = $(".chart-type-toggle.active").attr("value");
        var panel = $("<div />");
        var outerPanel = $("<div>"+
        	"<a class='btn btn-xs btn-default' style='"+(chartType != "timeline" ? "position:absolute;z-index:10;margin:0 0 -20px 20px" : "margin-bottom:5px")+
            "' type='"+type+"'>" +
        	"<i class='icon-remove'></i> "+type+"</a></div>");
        outerPanel.find("a").on('click', function(){
                remove($(this));  
        });
        if( chartType == "timeline" ) outerPanel.css("margin-bottom","20px");
        $("#chart-content").append(outerPanel.append(panel));
        _createChart(type, chartType, panel, false, null, animate);
    }
    
    function _showPopupChart(type) {
        var panel = $("<div class='item'></div>");

        var printBtn = $("<a class='btn btn-sm btn-default' style='margin-left:16px'><i class='icon-print'></i> Print</a>").on('click',function(){
           print(chartPanel);  
        });
        panel.append(printBtn);
        
        var chartPanel = $("<div></div>");
        panel.append(chartPanel);

        sliderPopup.find(".owl-theme").append(panel);
        _createChart(type, 'line', chartPanel, true, [Math.round($(window).width()*.88), Math.round(($(window).height()*.90)-125)]);
    }
    
    function _createChart(type, chartType, panel, showLegend, size, animate) {
        var col = 0;

        var dt = new google.visualization.DataTable();
        
        if( chartType == 'timeline' ) {
            dt.addColumn('date', 'Month');        
        } else {
            //dt.addColumn('number', 'Month'); 
            dt.addColumn('string', 'Month');
        }

        // set the first column
        if( !cData[0].singleRun ) {
            for( var i = 0; i < cData.length; i++ ) {
                var label = "";
                for( var key in cData[i].inputs ) {
                    label += key.replace(/.*\./,'')+"="+cData[i].inputs[key]+" \n"; 
                }
                label = label.replace(/,\s$/,'');
                dt.addColumn('number', label);        
            }
        } else {
            dt.addColumn('number', type);   
        }

        // find the column we want to chart
        for ( var i = 0; i < cData[0].output[0].length; i++) {
            if (cData[0].output[0][i] == type) {
                col = i;
                break;
            }
        }

        var cDate = new Date($("#input-manage-DatePlanted").val());

        var data = [];
        var max = 0;
        // create the [][] array for the google chart
        for ( var i = 1; i < cData[0].output.length; i++) {
            if (typeof cData[0].output[i][col] === 'string') continue;
            
            var row = [];
            var date = new Date(cDate.getYear()+1900, cDate.getMonth()+i, cDate.getDate());
            if( chartType == "timeline" ) {
                // add on month
                row.push(date);
            } else {
                var m = date.getMonth()+1;
                if( m < 10 ) m = '0'+m;
                row.push(i+': '+date.getFullYear()+'-'+m);
            }

            for ( var j = 0; j < cData.length; j++) {
                if( cData[j].output[i][col] > max ) max = cData[j].output[i][col];
                row.push(cData[j].output[i][col]);
            }
            data.push(row);
        }

        dt.addRows(data);
        
        if( app.outputDefinitions[type] ) {
            var desc = app.outputDefinitions[type];
            var label = desc.label && desc.label.length > 0 ? " - "+desc.label : "";
            var units = desc.units && desc.units.length > 0 ? " ["+desc.units+"]" : "";
            type = type+label+units;
        }
        
        
        var options = {
                vAxis : {
                    title : type
                },
                hAxis : {
                    title : "Month"
                }
        }
        if( !showLegend ) options.legend = {position:"none"};

        if( size ) {
            options.width = size[0];
            options.height = size[1];
        } else {
            options.width = panel.width();
            options.height = options.width*.4;
        }
        panel.width(options.width).height(options.height);

        if( chartType == 'timeline' ) {
            options.displayAnnotations = true;
            var chart = new google.visualization.AnnotatedTimeLine(panel[0]);
            chart.draw(dt, options);
        } else {
            var chart = new google.visualization.LineChart(panel[0]);
            chart.draw(dt, options);
        }
    }

    function createWeatherChart(root, data) {
        $(root).html('');

        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Month');
        dt.addColumn('number', 'Min Temperature');
        dt.addColumn('number', 'Max Temperature');
        dt.addColumn('number', 'Dew Point');
        dt.addColumn('number', 'Precipitation');
        dt.addColumn('number', 'Radiation');
        dt.addColumn('number', 'Daylight');

        for( var date in data ) {
            var obj = data[date];
            dt.addRow([
                date+'',
                obj.tmin || 0,
                obj.tmax || 0,
                obj.tdmean || 0,
                obj.ppt || 0,
                obj.rad || 0,
                obj.daylight || 0
            ]);
        }

        var chart = new google.visualization.ComboChart(root);
        chart.draw(dt, weatherChartOptions);

        return chart;
    }
    
    
    return {
        init : init,
        setData : setData,
        select : select,
        unselect : unselect,
        selectAll : selectAll,
        unselectAll : unselectAll,
        updateCharts : updateCharts,
        remove : remove,
        showPopup: showPopup,
        hidePopup: hidePopup,
        resize : resize,
        createWeatherChart : createWeatherChart
    }  
});
