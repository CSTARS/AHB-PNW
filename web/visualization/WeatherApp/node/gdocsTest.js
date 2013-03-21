var Spreadsheet = require('edit-google-spreadsheet');

// get worksheet id here: https://spreadsheets.google.com/feeds/worksheets/0Av7cUV-o2QQYdDZMTHAzZmMwb0JvcldIRWdNbUJ6WUE/private/full

Spreadsheet.create({
    //auth
    username: 'username',
    password: 'password',
    spreadsheetId: '0Av7cUV-o2QQYdDZMTHAzZmMwb0JvcldIRWdNbUJ6WUE',
    //summary tab
    worksheetId: 'od6',
    callback: function(err, spreadsheet) {
      	if( err ) return console.log(err);
	sheetReady(spreadsheet);
    }
});

function sheetReady(spreadsheet) {
spreadsheet.add({
  3: {
    4:  "42",
    5:  "21" 
  }
});

 spreadsheet.send(function(err) {
      if(err) throw err;
      console.log("Updated Cell at row 3, column 5 to hello!");
    });
}
