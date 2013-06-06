var basics = require('./Model3PG.js');
var inputs = require('./InputOutput.js');
var functions = require('./SingleRunFunctions.js');
var fs = require('fs');

var typesArrs = {
		weather          : ["tmin","tmax","tdmean","ppt","rad","daylight"],
		soil             : ["maxaws","swpower","swconst"],
		plantation_state : ["Date","VPD","fVPD","fT","fFrost","PAR","xPP","Intcptn","ASW",
	                        "CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW",
	                        "fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS","W"],
	    tree             : ["fullCanAge","kG",
	                        "alpha","Tmax","Tmin","Topt","BLcond","maxAge","rAge","nAge",
	                        "fN0","FR","SLA0","SLA1","tSLA","MaxCond","LAIgcx","MaxIntcptn",
	                        "LAImaxIntcptn","e20","rhoAir","lambda","VPDconv",
	                        "Qa","Qb","m0","pRx","pRn","pfsPower","pfsConst","pfsMax",
	                        "StemConst","StemPower","wSx1000","thinPower","irrigFrac",
	                        "StockingDensity","SeedlingMass","y",
	                        "maxAWS","swpower","swconst","cpStemsPerStump","cpStemConst",
	                        "cpStemPower","cpMaxPfs","cpPfsPower","cpPfsConst",
	                        "cpRootStoragePct","cpRootLAITarget"],
	    constants         : ["gammaFx","gammaF0","tgammaF","Rttover","k","days_per_mon","gDM_mol","molPAR_MJ"]
	};

	/***
	 *  poplar tree type
	 */
	var tree = {fullCanAge:0,kG:0.5,
			alpha:0.0177,Tmax:40,Tmin:5,Topt:20,BLcond:0.2,maxAge:50,rAge:0.95,nAge:4,fN0:1,
			FR:0.7,SLA0:10.8,SLA1:10.8,tSLA:1,MaxCond:0.02,LAIgcx:3.33,MaxIntcptn:0.15,
			LAImaxIntcptn:0,e20:2.2,rhoAir:1.2,lambda:2460000,VPDconv:0.00622,
			Qa:-90,Qb:0.8,m0:0,pRx:0.8,pRn:0.25,pfsPower:-1.161976,pfsConst:1.91698,pfsMax:5,
			StemConst:0.0771,StemPower:2.2704,wSx1000:300,thinPower:1.5,irrigFrac:1,
			StockingDensity:2500,SeedlingMass:0.001,y:0.47,
			maxAWS:15.4574230821395,swpower:4.6,swconst:0.48,cpStemsPerStump:4.4,
			cpStemConst:0.18,cpStemPower:2.4,cpMaxPfs:5,cpPfsPower:-1.161976,cpPfsConst:1.91698,
			cpRootStoragePct:0.15,cpRootLAITarget:4};
	var constants = {gammaFx:0.03,gammaF0:0.001,tgammaF:24,Rttover:0.005,k:0.5,days_per_mon:30.4,gDM_mol:24,molPAR_MJ:2.3};

// set header
var exportScript = "CREATE OR REPLACE FUNCTION run3pgModel(lengthOfGrowth integer) RETURNS\n"+
					"VOID AS $$\n\n";
	
exportScript += basics.dump();
exportScript += inputs.dump();
exportScript += functions.dump();

exportScript += "\nrunModel(lengthOfGrowth);\n\n"+
	"$$ LANGUAGE plv8 IMMUTABLE STRICT;";

exportScript += functions.testFunctions();

exportScript += dumpTypes();

fs.writeFile("./import_3pg.sql", exportScript, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
});


function dumpTypes() {
	// create types
	var str = "\n\n";
	
	for( var type in typesArrs ) {
		str += "CREATE TYPE "+type+" as (";
		for( var i = 0; i < typesArrs[type].length; i++ ) {
			str += typesArrs[type][i]+" float,\n";
		}
		if( type == "tree" ) str += "type string,\n";
		str = str.replace(/,\n$/,'')+"\n);\n";
	}
	
	// create tree table
	str += "DROP TABLE trees;\n";
	str += "CREATE TABLE trees OF tree;\n";
		
	// add poplar tree to table
	str += "INSERT INTO trees (type,";
	for( var type in tree ) str += type+", ";
	str = str.replace(/, $/,'');
	str += ") VALUES ('poplar',"
	for( var type in tree ) str += tree[type]+", ";
	str = str.replace(/, $/,'')+");\n";
	
	return str;
};