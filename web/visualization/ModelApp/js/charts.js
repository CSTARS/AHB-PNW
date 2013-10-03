app.charts = (function() {
    
    var changes = false;
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
                        + ' value="'+val+'"> '+val+'</label></div>'));
            } else {
                c2.append($('<div class="checkbox"><label><input type="checkbox"'
                        + (val == 'WR' || val == 'WS' || val == 'WF' ? 'checked="checked"' : '')
                        + ' value="'+val+'"> '+val+'</label></div>'));
            }
            
            
        }
        
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
                },400);
               
            }
        });
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
    
    function setData(data) {
        cData = data;
    }
    
    function updateCharts(data) {
        if( data ) setData(data);
        
        $("#chart-content").html("");
        var types = chartTypeSelector.val();
        for ( var i = 0; i < types.length; i++) {
            _showChart(types[i]);
        }
    }
    
    function _showChart(type) {
        var panel = $("<div />");
        var outerPanel = $("<div>"+
        	"<a class='btn btn-xs btn-default' style='position:absolute;z-index:10;margin:0 0 -20px 10px' onclick='app.charts.remove($(this))' type='"+type+"'>" +
        	"<i class='icon-remove'></i> Remove "+type+"</a></div>");
        $("#chart-content").append(outerPanel.append(panel));

        var col = 0;
        var data = [ [ "month" ] ];

        var vType = $("#variationAnalysisInput").val();
        var variations = $("#multiRunVarInputs").val().replace(/\s/g, '')
                .split(",");

        for ( var i = 0; i < cData.length; i++) {
            data[0].push(type
                    + " "
                    + (vType != "None" ? "(" + vType + "=" + variations[i] + ")"
                            : ""));
        }

        for ( var i = 0; i < cData[0][0].length; i++) {
            if (cData[0][0][i] == type) {
                col = i;
                break;
            }
        }

        for ( var i = 1; i < cData[0].length; i++) {
            if (typeof cData[0][i][col] === 'string')
                continue;
            var row = [ i ];
            for ( var j = 0; j < cData.length; j++) {
                row.push(cData[j][i][col]);
            }
            data.push(row);
        }

        var dt = google.visualization.arrayToDataTable(data);
        var options = {
                vAxis : {
                    title : type
                },
                hAxis : {
                    title : "Month"
                }
        }

        var chart = new google.visualization.LineChart(panel[0]);
        chart.draw(dt, options);
    }
    
    
    return {
        init : init,
        setData : setData,
        selectAll : selectAll,
        unselectAll : unselectAll,
        updateCharts : updateCharts,
        remove : remove
    }
    
})();