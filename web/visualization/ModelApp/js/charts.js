app.charts = (function() {
 
    // only draw charts if width has changed
    var cWidth = 0;
    
    var sliderPopup = $(
            "<div class='slide-popup'>" +
                "<i class='icon-remove-circle pull-right slide-popup-close' onclick='app.charts.hidePopup()'></i>"+
                "<div id='carousel' class='owl-carousel owl-theme' style='margin-top:15px'></div>" +
    		"</div>");
    var sliderPopupBg = $("<div class='slide-popup-bg'>&nbsp;</div>");
    
    // only draw charts if someone has click a checkbox
    var changes = false;

    // when sizing, wait a ~300ms before triggering redraw
    var resizeTimer = -1;

    var chartTypeSelector, chartCheckboxes, cData;
    
    function init() {
        // setup chart selectors
        $("#chart-modal").modal({show:false});
       
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
        if( !app.output_definitions[val] ) return "<b>"+val+"</b></label>";
        
        var desc = app.output_definitions[val];
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
        if( cWidth == $(window).width() ) return;
         cWidth = $(window).width();

        if( resizeTimer != -1 ) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            resizeTimer = -1;
            updateCharts();
        },300);
    }
    
    function updateCharts(results) {
        if( results ) setData(results);
        if( !cData ) return;
        
        $("#chart-content").html("");
        
        $("#show-chartspopup-btn").show();
        
        var types = chartTypeSelector.val();
        for ( var i = 0; i < types.length; i++) {
            _showMainChart(types[i]);
        }
    }
    
    function showPopup() {
        sliderPopup.find(".owl-theme").html("");
        $('body').scrollTop(0).css('overflow','hidden').append(sliderPopupBg).append(sliderPopup);
        
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
    
    function _showMainChart(type) {
        var chartType = $(".chart-type-toggle.active").attr("value");
        var panel = $("<div />");
        var outerPanel = $("<div>"+
        	"<a class='btn btn-xs btn-default' style='"+(chartType != "timeline" ? "position:absolute;z-index:10;margin:0 0 -20px 20px" : "margin-bottom:5px")+
            "' onclick='app.charts.remove($(this))' type='"+type+"'>" +
        	"<i class='icon-remove'></i> "+type+"</a></div>");
        if( chartType == "timeline" ) outerPanel.css("margin-bottom","20px");
        $("#chart-content").append(outerPanel.append(panel));
        _createChart(type, chartType, panel);
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
        _createChart(type, 'line', chartPanel, [Math.round($(window).width()*.88), Math.round(($(window).height()*.90)-125)]);
    }
    
    function _createChart(type, chartType, panel, size) {
        var col = 0;
        //var data = [ [ "month" ] ];
        var dt = new google.visualization.DataTable();
        
        if( chartType == 'timeline' ) {
            dt.addColumn('date', 'Month');        
        } else {
            dt.addColumn('number', 'Month');        
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
                //data[0].push(label);
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

        var cDate = new Date($("#input-date-datePlanted").val());

        var data = [];
        // create the [][] array for the google chart
        for ( var i = 1; i < cData[0].output.length; i++) {
            if (typeof cData[0].output[i][col] === 'string') continue;
            
            var row = [];
            if( chartType == "timeline" ) {
                // add on month
                cDate
                row.push(new Date(cDate.getYear()+1900, cDate.getMonth()+i, cDate.getDate()));
            } else {
                row.push(i);
            }

            for ( var j = 0; j < cData.length; j++) {
                row.push(cData[j].output[i][col]);
            }
            data.push(row);
        }

        dt.addRows(data);
        //var dt = google.visualization.arrayToDataTable(data);
        
        
        if( app.output_definitions[type] ) {
            var desc = app.output_definitions[type];
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
        resize : resize
    }
    
})();
