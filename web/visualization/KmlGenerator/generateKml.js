/**
 *  local tunnel connection
 *  ssh -f -N -L 65432:localhost:5432 username@alder.bioenergy.casil.ucdavis.edu
 * */
var pg = require('pg');
var fs = require('fs');
var tty = require('tty');

var config = {
	username : "",
	password : "",
	host     : "localhost",
	port     : "65432",
	db       : "afri"
}

var header =
"<?xml version='1.0' encoding='UTF-8' ?>\n"+
"<kml xmlns='http://www.opengis.net/kml/2.2'>\n"+
"<Document>\n"+
"<name>AHB 3PG Model</name>";

var footer = "</Document>\n</kml>";

var placemark =
"<Placemark>\n"+
  "<name>{{id}}</name>\n"+
  "<description>{{description}}</description>\n"+
  "{{time}}"+
  "<visibility>1</visibility>\n"+
  "<Style>\n"+
    "<LineStyle><width>.5</width><color>ff{{linecolor}}</color></LineStyle>\n"+
    "<PolyStyle><color>aa{{color}}</color></PolyStyle>\n"+
  "</Style>\n"+
  "<Polygon>\n"+
    "<tessellate>1</tessellate>"+
    "<extrude>1</extrude>"+
    "<altitudeMode>absolute</altitudeMode>"+
    "<outerBoundaryIs><LinearRing><coordinates>\n"+
      "{{coordinates}}\n"+
    "</coordinates></LinearRing></outerBoundaryIs>\n"+
  "</Polygon>\n"+
"</Placemark>\n";


var pgQueryString = 'select pid,ps[array_length(ps,1)]."{{type}}",st_asKML(boundary) from m3pgjs.nonIrrigatedGrowthmodel join afri.pixels using(pid)';

var pgIndexQueryString = 'select pid,ps[{{index}}]."{{type}}",d[{{index}}],st_asKML(boundary) from m3pgjs.growthmodel join afri.pixels using(pid)';
var pgDatesQueryString = 'select d from m3pgjs.growthmodel limit 1';

var listQueryString = 'select ps[array_length(ps,1)].* from m3pgjs.growthmodel limit 1';

if( getArg("-h") || getArg("--help") ) {
	return console.log("\nusage: node generateKml.js [-u username] [-l | -v db_variable] [-f factor] [-d]\n"+
			"  -u : postgres username\n"+
			"  -l : list all variables\n"+
			"  -v : variable to use\n"+
			"  -f : (optional) scale factor for data, default 300\n"+
			"  -d : (optional) dates to use, default last\n"+
			"       -date's should be comma separated (no spaces). \n"+
			"       -a months TimeSpan can be included w/ a ':' (default, 1 month) \n"+
			"       -examples: \n"+
			"       	2013-01-01 (TimeSpan = start 2013-01-01 end 2013-02-01) \n"+
			"       	2013-01-01:2 (TimeSpan = start 2013-01-01 end 2013-03-01) \n"+
			"       	2013-*:2 (generate every 3rd month, each TimeSpan will span 3 months)\n"+
			"       	2013-*:2,2014-*:2 (same as above but include 2014)\n"+
			"       	2015-* (every month for 2014)\n"
			);
}

config.username = getArg("-u");
var type = getArg("-v");
var scaleFactor = getArg("-f") ? getArg("-f") : 300;
var getDates = getArg("-d");
var dateSkip = getArg("-ds");
var list = getArg("-l");

// irrigation or non?
var irrigation = getArg("-i");

var validDates = null;

getPassword();

function login() {
	console.log("");
	var conString = "postgres://"+config.username+":"+config.password+"@"+config.host+":"+config.port+"/"+config.db;
	var client = new pg.Client(conString);
	client.connect(function(err) {
		console.log("connected to postgres, processing...");
		if(err) return console.log({error:true, message:'could not connect to postgres. '+
			'make sure you have a tunnel open "ssh -f -N -L 65432:localhost:5432 username@alder.bioenergy.casil.ucdavis.edu"', errObj: err});

		if( list ) {
			client.query(listQueryString, function(err, result) {
				if(err) return console.log({error:true, message:'error running pg query: '+pgQueryString, errObj: err});
				for( var key in result.rows[0] ) console.log(" -"+key);
				client.end();
				process.exit();
			});
		} else if ( getDates ) {
			client.query(pgDatesQueryString, function(err, result) {
				if(err) return console.log({error:true, message:'error running pg query: '+pgQueryString, errObj: err});
			
				validDates = result.rows[0].d.replace(/[{}]/g,"").split(",");
				runDateQueries(client, result.rows[0].d.replace(/[{}]/g,"").split(","));
			});
		
		} else {
			client.query(pgQueryString.replace("{{type}}",type), function(err, result) {
				if(err) return console.log({error:true, message:'error running pg query: '+pgQueryString, errObj: err});
				client.end();
				createKml(result.rows);
			});
		}

	});
}

function runDateQueries(client) {
	var dates = getDates.split(",");	

	

	// get date indexes
	var indexes = [];
	for( var i = 0; i < dates.length; i++ ) {
		if( dates[i].match(/.*\*.*/) ) {
			var patt = new RegExp(dates[i].replace(/:.*/,'').replace(/\*/g,'.*'));
	
			var dateSkip = 0;
			if( dates[i].split(":").length > 1 ) dateSkip = parseInt(dates[i].split(":")[1]);

			var c = 0;
			for( var j = 0; j < validDates.length; j++ ){
				if( patt.test(validDates[j]) && indexes.indexOf(j) == -1 && c == 0 ) {
					addMonthSpan(dates[i], j);
					indexes.push(j);
					c++;
				} else if ( patt.test(validDates[j]) && indexes.indexOf(j) == -1 ) {
					c++;
				}
				if( c > dateSkip ) c = 0;
			} 
		} else {
			var index = validDates.indexOf(dates[i].replace(/:.*/,''));
			if( index == -1 ){
				console.log("Invalid date: "+dates[i]);
				client.end();
				return;
			}
			if( indexes.indexOf(index) == -1 ) {
				addMonthSpan(dates[i], index);
				indexes.push(index);
			}

		}
	}

	if( indexes.length == 0 ) {
		console.log("No matching dates found");
		client.end();
		return;
	}

	getDateData(indexes, 0, client, "");
}

function addMonthSpan(date, index) {
	if( date.split(":").length > 1 ) {
		validDates[index] += ":"+date.split(":")[1];
	}
}

function getDateData(indexes, cIndex, client, kml) {
	console.log("Processing date ("+validDates[indexes[cIndex]]+"): "+(cIndex+1)+" of "+indexes.length);

	var cString = pgIndexQueryString.replace("{{type}}",type).replace(/{{index}}/g,indexes[cIndex]);
	client.query(cString, function(err, result) {
		if(err) return console.log({error:true, message:'error running pg query: '+cString, errObj: err});
		
		cIndex++;
		if( cIndex == indexes.length ) {
			client.end();
			kml += createKml(result.rows, validDates[indexes[cIndex-1]], true);
			fs.writeFileSync(__dirname+"/"+type+".kml",header+kml+footer);
			process.exit();
		} else {
			kml += createKml(result.rows, validDates[indexes[cIndex-1]], true);
			getDateData(indexes, cIndex, client, kml);
		}
	});
}



function createKml(data, date, partial) {
	var min = 1000000;
	var max = 0;

	for( var i = 0; i < data.length; i++ ){
	        if( data[i][type] > max ) max = data[i][type];
	        if( data[i][type] != 0 && data[i][type] < min ) min = data[i][type];
	}

	var x = 510 / ( max - min );
	var y = 510 / max;

	parseKmlSnippet(data);
	
	var time = "";
	if( date ) {
		var p = date.split(":");
		date = p[0];
		
		var monthSpan = 0;
		if( p.length > 1 ) monthSpan = parseInt(p[1]);

		var p = date.split("-");
		var start = new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]) );
		var end = new Date(parseInt(p[0]), parseInt(p[1])+monthSpan, parseInt(p[2]));
		time = "<TimeSpan><begin>"+getDateString(start)+"</begin>"+
			"<end>"+getDateString(end)+"</end></TimeSpan>\n";
	}

	var body = "";
	for( var i = 0; i < data.length; i++ ) {
        	var d = data[i];

        	var factor = d[type] * scaleFactor;
        	var color = getColor(d[type], x, y);

		
        	var coord = "";
        	for( var j = 0; j < d.points.length; j++ ) {
                	coord += d.points[j][0]+","+d.points[j][1]+","+factor;
                	if( j < d.points.length - 1 ) coord += " ";
        	}

		var dateStr = "";
		if( date ) dateStr = "Date: "+date+"<br />";

        	body += placemark
                	.replace("{{id}}",d.pid)
                	.replace("{{time}}",time)
                	.replace("{{description}}","id: "+d.pid+"<br />"+type+": "+d[type]+"<br />"+dateStr+
						  "<a href='http://alder.bioenergy.casil.ucdavis.edu/?ll="+d.points[0][0]+","+d.points[0][1]+"'>Model App</a>")
                	.replace("{{linecolor}}",color)
                	.replace("{{color}}",color)
                	.replace("{{coordinates}}",coord);
	}
	
	if( partial ) return body
	else fs.writeFileSync(__dirname+"/"+type+".kml",header+body+footer);
}

function parseKmlSnippet(data) {
        var coord, pairs, i, j, p, points;

        for( var i = 0; i < data.length; i++ ) {
                points = [];
                coord = data[i].st_askml.replace(/.*\<coordinates\>/,"").replace(/<\/coordinates\>/,"");
                pairs = coord.split(" ");
                for( j = 0; j < pairs.length; j++ ) {
                  p = pairs[j].split(",");
                  points.push([parseFloat(p[0]), parseFloat(p[1])]);
                }
                data[i].points = points;
        }
}

function getDateString(date) {
	var y = date.getYear()+1900;
	var m = (date.getMonth()+1)+"";
	if( m.length == 1 ) m = "0"+m;
	return y+"-"+m;
}

function getSpread(num, x, y) {
        var s = Math.round((num*y)+x)-255;
	if( s < -254 ) s = -254;
	if( s > 255 ) s = 255;
	return s;
}

function getColor(num, x, y) {
        var spread = getSpread(num, x, y);
        if( spread < 0 ) return "00"+toHex(255+spread)+"ff";
        else if( spread > 0 ) return "00ff"+toHex(255-spread);
        else return "00ffff";

}

function toHex(num) {
        num = num.toString(16);
        if( num.length == 1 ) num = "0"+num;
        return num;
}

function getPassword() {
  process.stdout.write("password: ");
  var stdin = process.openStdin();
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);  
  //tty.setRawMode(true);  
  config.password = ''
  process.stdin.on('data', function (char) {
    char = char + ""

    switch (char) {
    case "\n": case "\r": case "\u0004":
      // They've finished typing their password
      process.stdin.setRawMode(false)
      stdin.pause()
      login();
      break
    case "\u0003":
      // Ctrl C
      console.log('Cancelled')
      process.exit()
      break
    default:
      // More passsword characters
      //process.stdout.write('*')
      config.password += char
      break
    }
  });
}

function getArg(arg) {
	var index = process.argv.indexOf( arg );
	if( index == -1 ) return null;
	else if( index + 1 == process.argv.length ) return true;
	else if( process.argv[index+1].match(/^-.*/) ) return true;
	else return process.argv[index+1];
	
}

