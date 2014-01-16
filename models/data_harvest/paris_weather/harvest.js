// gather monthly data from http://www.tutiempo.net/en/Climate/Paris_Le_Bourget/01-1987/71500.htm from 87-98

var request = require('request');
var jsdom = require("jsdom");
var http = require('http');
var fs = require('fs');

//for paris
var start = 1987;
var stop = 1998;
var location = "Paris-Aeroport_Charles_De_Gaulle";
var id = "71570";
// precip is missing for a couple years
//var location = "Paris_Le_Bourget";
//var id = "71500";

// for belgium
//var start = 1995;
//var stop = 2010;
//var location = "Antwerpen_Deurne";
//var id = "64500";

var total = 0;
var requests = 0;
var data = [];
var attrs = ["year","month"];

var ct = 0;
var t = new Date().getTime();
for( var year = start; year <= stop; year++ ) {
	for( var month = 1; month <= 12; month++ ) {
		requests++;
		get(year+"", month+"");
	}
}

function get(year, month) {
    setTimeout(function() {
        if( month.length == 1 ) month = "0"+month;
        console.log("loading: "+year+" / "+month);
        request.get(
            'http://www.tutiempo.net/en/Climate/'+location+'/'+month+'-'+year+'/'+id+'.htm',
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    parse(year, month, body);
                } else {
                    console.log("Error with "+month+"-"+year);
                    total++;
                }
            }
        );
    }, 500*ct);
    ct++;
}

function parse(year, month, html) {
	jsdom.env(
	  html,
	  ["http://code.jquery.com/jquery.js"],
	  function(errors, window) {
	    var $ = window.$;
	    var rows = $(".TablaClima tr");
	    var mData = {};
	    var headers = null;
	    for( var i = 0; i < rows.length; i++ ) {
		var cells = $(rows[i]).find("td");

		// see if it's the header row
		if( cells.length == 0 ) {
			cells = $(rows[i]).find("th");
			if( cells.length > 0 ) headers = cells;
			else continue;
		} if( cells[0].innerHTML == "" || cells[0].innerHTML == "&nbsp;" ) {
			for( var j = 1; j < cells.length; j++ ) {
				var attr = $(headers[j]).text();
				if( attrs.indexOf(attr) == -1 ) attrs.push(attr);
				mData[$(headers[j]).text()] = $(cells[j]).text();
			}
		}
	    }
	    mData.month = parseInt(month.replace(/^0/,''));
	    mData.year = parseInt(year);
	    data.push(mData);
	
	    total++;
	    console.log("Response "+total+" of "+requests+": "+mData.month+"-"+mData.year);
	    if( total == requests ) {
		writeFile();
	     }
	});
}

function writeFile() {
	data.sort(function(a, b){
		if( a.year > b.year ) return 1;
		if( a.year < b.year ) return -1;
		if( a.year == b.year ) {
			if( a.month > b.month ) return 1;
			if( a.month < b.month ) return -1;
			return 0;
		}
	});

	var csv = "";
	for( var i = 0; i < attrs.length; i++ ) {
		csv += attrs[i];
		if( i < attrs.length - 1 ) csv += ",";
		else csv += "\n";
	}

	for( var i = 0; i < data.length; i++ ) {
		for( var j = 0; j < attrs.length; j++ ) {
			csv += data[i][attrs[j]] ? data[i][attrs[j]] : "";
			if( j < attrs.length - 1 ) csv += ",";
			else csv += "\n";	
		}
	}

	fs.writeFile("./"+location+".csv", csv, function(err) {
    		if(err) {
        		console.log(err);
    		} else {
        		console.log("The file was saved!");
    		}		
	});
}
