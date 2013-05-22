var basics = require('./Model3PG.js');
var inputs = require('./InputOutput.js');
var spreadsheet = require('./SingleRunFunctions.js');
var fs = require('fs');

// set header
var exportScript = "CREATE OR REPLACE FUNCTION run3pgModel(lengthOfGrowth integer) RETURNS\n"+
					"VOID AS $$\n\n";
	
exportScript += basics.dump();
exportScript += inputs.dump();
exportScript += spreadsheet.dump();

exportScript += "\nrunModel(lengthOfGrowth);\n\n"+
	"$$ LANGUAGE plv8 IMMUTABLE STRICT;";

fs.writeFile("./import_3pg.sql", exportScript, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 