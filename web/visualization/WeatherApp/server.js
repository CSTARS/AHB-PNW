var express = require('express');
var app = express();
var Spreadsheet = require('./spreadsheets');

var inputs = ['month','tmin','tmax','tdmean','ppt','rad','daylight'];

// you get this from the gdata feed
// https://spreadsheets.google.com/feeds/worksheets/[key]/private/full
var worksheetId = "oci";

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(__dirname + '/'));

app.get('/rest/getSsName', function(req, res) {
	
	if( !req.query.key ) return res.send({error:true});
	
	 Spreadsheet.create({
		 	//auth
		 	oauth         : true,
		    access_token  : req.cookies.access_token,
		    token_type    : req.cookies.token_type,
		    spreadsheetId : req.query.key,
		    //summary tab
		    worksheetId: 'ocr',
		    callback: function(err, spreadsheet) {
		    	if( err ) return res.send({error:true,message:err});
		    	spreadsheet.getName(function(err, name){
		    		if( err ) return res.send({error:true,message:err});
		    		res.send({success:true,name:name});
		    	});
		    }
    });

});

app.post('/rest/updateModel', function(req, res) {

  var data = req.body;
 
  if( !data ) return res.send({error:true});

  if( !data.spreadsheetId || !data.table ) {
	return res.send({error:true});
  }

  Spreadsheet.create({
	//auth
 	oauth        : true,
    access_token : req.cookies.access_token,
    token_type   : req.cookies.token_type,
    spreadsheetId: data.spreadsheetId,
    //summary tab
    worksheetId: worksheetId,
    callback: function(err, spreadsheet) {
        if( err ) return res.send({error:true,message:err});
        sheetReady(spreadsheet);
    }
  });

  function sheetReady(spreadsheet) {
	var ss = dtToSs(data.table);
	
	// add planted date to input sheet
	var dateRow = JSON.parse(data.table).rows.length+4;
	ss[dateRow+""] = {};
	ss[dateRow+""]["1"] = "Planted Date:";
	ss[dateRow+""]["2"] = data.date;
	
	// add soil data
	dateRow += 3;
	ss[dateRow+""] = {};
	ss[dateRow+""]["1"] = "";
	ss[dateRow+""]["2"] = "maxaws";
	ss[dateRow+""]["3"] = "swpower";
	ss[dateRow+""]["4"] = "swconst";
	
	dateRow++;
	var soil = JSON.parse(data.soil);
	ss[dateRow+""] = {};
	ss[dateRow+""]["1"] = "Soil Data:";
	ss[dateRow+""]["2"] = soil.rows[0].c[0].v;
	ss[dateRow+""]["3"] = soil.rows[0].c[1].v;
	ss[dateRow+""]["4"] = soil.rows[0].c[2].v;
	
    spreadsheet.add(ss);

    spreadsheet.send(function(err) {
      if(err) return res.send({error:true,message:err});
      res.send({success:true});
    });
  };
});

// convert the datatable format to the spreadsheet format
function dtToSs(dt) {
	var dt = JSON.parse(dt), cols = {}, ss = {1:{}};
	
	// map columns
	for( var i = 0; i < inputs.length; i++ ) {
		ss[1][i+1] = inputs[i];
		cols[inputs[i]] = 0;
	}
	for( var i = 0; i < dt.cols.length; i++ ) {
		if( cols[dt.cols[i].id] != null) {
			cols[dt.cols[i].id] = i;
		}
	}

	for( var i = 0; i < dt.rows.length; i++ ) {
		ss[i+2] = {};
		for( var j = 0; j < inputs.length; j++ ) {
			if( dt.rows[i].c[cols[inputs[j]]] != null ) {
				ss[i+2][j+1] = dt.rows[i].c[cols[inputs[j]]].v;
			} else {
				ss[i+2][j+1] = "";
			}
				
		}
	}
	
	return ss;
}


app.listen(3001);

console.log("3PG Model server up at http://localhost:3000");

