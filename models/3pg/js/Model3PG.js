/**

NOTE:  litterfall modified to account for stand age after coppicing

+ root max is chosen (not to let it drop) 

lengthOfGrowth is in months
*/

var m3PG = {
	run : function(lengthOfGrowth) {
		  //work with offsets and weather data later
		  
		  var isCoppiced = false;
		  var willCoppice = false;
		  var yearToCoppice;
		  var coppiceInterval;
		  var monthToCoppice;
		  //Global Variables Array
		  
		  var g = {};
		  m3PGIO.readAllConstants(g); //global variables are an array of key-value pairs. INCLUDES SOIL DEPENDENT ONES - Separate?
		 
		  var weatherMap = {};
		  var s = {}; //soilMap
		  var dateMap = {};
		  m3PGIO.readWeather(weatherMap, s, dateMap);
		  
		  var currentDate = dateMap["datePlanted"];
		  
		  var plantedMonth = currentDate.getMonth();
		  var currentMonth = currentDate.getMonth();
		  
		  if (dateMap["dateCoppiced"] != undefined){
		    yearToCoppice = dateMap["dateCoppiced"].getYear();
		    monthToCoppice = dateMap["dateCoppiced"].getMonth();
		    coppiceInterval = dateMap["yearsPerCoppice"];
		    willCoppice = true;
		  }
		  
		  log("Month of Planting = " + currentMonth);
		  
		  var step = 0;
		  
		  var d = weatherMap[currentMonth];
		  
		  log(d);
		  
		  var keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS", "W"];    

		  m3PG.runCurrentSetup(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap)
		  
		  //init all - will be p,
		  //then each step returned from singleStep will be p to feed back into
		  //Weather?
	},
	
	runCurrentSetup: function(lengthOfGrowth,g,d,s,keysInOrder,step,plantedMonth,currentDate,currentMonth,yearToCoppice,monthToCoppice,coppiceInterval,willCoppice,isCoppiced,weatherMap){
	    
        var firstMonthResults = m3PG.init(g,d,s);
        firstMonthResults.Date = (currentDate.getMonth()+1) + "/" + currentDate.getYear();
        
        var rows = []; //these will become rows
        
        log("Results of the first month: " +firstMonthResults);
        
        rows.push(keysInOrder);
        
        var firstRow = [];
        for (var i = 0; i < keysInOrder.length; i++){
          var key = keysInOrder[i];
          log(key  + ": " + firstMonthResults[key]);
          firstRow.push(firstMonthResults[key]);
        }
        
        rows.push(firstRow);

        var currentMonthResults = firstMonthResults;
        var nextMonthResults;
        
        for (var step = 1; step < lengthOfGrowth; step++){
          currentDate.setMonth(currentDate.getMonth() + 1); // add a month to current date
          log("currentDate = " + currentDate);
          currentMonth = currentDate.getMonth();
          
          //If curretn year is the year of coppice, cut the tree (redestribute the weight)
          //set coppicing flag to true
          //use coppicing functions
          log("if ("+willCoppice+" && "+currentDate.getYear()+"=="+yearToCoppice+" && "+currentMonth+" == "+monthToCoppice+")");
          if (willCoppice && currentDate.getYear()==yearToCoppice && currentMonth == monthToCoppice){
            log("Time to Coppice!");
            //TODO: update trees

// What is all this - qjh            
//            if (isCoppiced == false) {
//              //first time coppice
//              //Important function name changes for the first coppice
//              currentMonthResults.WR = currentMonthResults.WR;
//            }
//            
//            isCoppiced = true; //growth model changes
//            currentMonthResults.WS = 1.3; //no stem
//            currentMonthResults.WF = 2.4; //no foliage
//            currentMonthResults.lastCoppiceAge = currentMonthResults.StandAge;
//            //currentMonthResults.StandAge = 0; //the age of stand is 1 month?
            yearToCoppice = yearToCoppice + coppiceInterval; //next coppice year
            //key Headers change
            keysInOrder = ["Date", "VPD", "fVPD", "fT", "fFrost", "PAR", "xPP", "Intcptn","ASW","CumIrrig","Irrig","StandAge","LAI","CanCond","Transp","fSW","fAge","PhysMod","pR","pS","litterfall","NPP","WF","WR","WS", "W"];    
            rows.push(keysInOrder);
          } 
          

          d = weatherMap[currentMonth]; //increment the month
            nextMonthResults = this.singleStepCoppiced(g,s,d,m,currentMonthResults);
          nextMonthResults.Date = (currentDate.getMonth()+1)  + "/" + currentDate.getYear();
          log("\n Results of the next month: " + nextMonthResults);
          var thisRow = [];
          for (var i = 0; i < keysInOrder.length; i++) {
            var key = keysInOrder[i];
            log( key  + ": " + nextMonthResults[key]);
            thisRow.push(nextMonthResults[key]);
          } 
          currentMonthResults = nextMonthResults;
          rows.push(thisRow);
          
        }
        
        m3PGIO.dump(rows);
        
        return rows;
	},
	
    init : function(plantation,soil) {
	var p = {};
	p.feedstockHarvest=0;
	p.coppiceCount=0;
	p.coppiceAge = 0;

	p.CumIrrig =0;	  
	p.dW = 0;		  
	p.W = plantation.StockingDensity * plantation.SeedlingMass;
	p.WF = plantation.pF * p.W
	p.WS = plantation.pS * p.W;
	p.WR = plantation.pR * p.W;
	p.ASW = 0.8 * 10 * soil.maxAWS; // The 10 is because maxAWS is in cm and ASW in mm (?) Why (?)
	p.StandAge = 0;
	var tree=plantation.seedlingTree;
	// sla = Specific Leaf Area
	var sla=m3PGFunc.tdp(p.StandAge,tree.SLA);
	p.LAI = p.WF * 0.1 * sla; // Landsburg eq 9.5

	// These aren't used so can be set to anything;  They are set to match the postgres type
	p.VPD=0;
	p.fVPD=0;
	p.fT =0;
	p.fFrost = 0;
	p.fNutr=0;
	p.fSW=0;
	p.fAge=0;
	p.PAR = 0;
	p.xPP = 0;
	p.Intcptn = 0;
	p.Irrig = 0;
	p.CanCond = 0;  
	p.Transp = 0;
	p.PhysMod = 0;
	p.pfs = 0;
	p.pR=0;
	p.pS=0;
	p.pF=0;
	p.litterfall = 0;
	p.NPP = 0;
	p.RootP = 0;
	return p;		
	},
	
    singleStepCoppiced : function(plantation,soil,weather,manage,p) {
	var c = new Object();
	var tree;
	if (c.coppiceCount==0) {
	    tree=plantation.seedlingTree;
	} else {
	    tree=plantation.coppicedTree;
	}
//	log(tree.type+":"+tree.maxAge);
	if (manage.coppice == true) {
	    // Add in a stump margin....
	    c.feedstockHarvest= p.feedstockHarvest+p.WS;
	    c.coppiceCount = p.coppiceCount+1;
	    c.coppiceAge = 0;
	    p.WS = 0;
	    p.WF = 0;
	    p.W = p.WR;
	} else {
	    c.feedstockHarvest= p.feedstockHarvest;
	    c.coppiceCount = p.coppiceCount;
	    c.coppiceAge = p.coppiceAge+1.0/12;
	}
	c.StandAge = p.StandAge+1.0/12;
	var sla=m3PGFunc.tdp(p.StandAge,tree.SLA);
	c.LAI = p.WF * 0.1 * sla; // Landsburg eq 9.5
	c.VPD = m3PGFunc.VPD(weather.tmin, weather.tmax, weather.tdmean);
	c.fVPD = m3PGFunc.fVPD(tree.kG, c.VPD);
	
	c.fSW = m3PGFunc.fSW(p.ASW, soil.maxAWS, soil.swconst, soil.swpower);
        c.fAge=m3PGFunc.tdp(p.StandAge,tree.fAge);
	c.fFrost = m3PGFunc.fFrost(weather.tmin);
	c.PAR = m3PGFunc.PAR(weather.rad);
	c.fT = m3PGFunc.fT((weather.tmin+weather.tmax)/2, tree.fT);
	c.xPP = m3PGFunc.xPP(tree.y, c.PAR);
	c.PhysMod = m3PGFunc.PhysMod(c.fVPD, c.fSW, c.fAge);
	c.fNutr=m3PGFunc.fNutr(tree.fN0, manage.fertility);
	c.NPP = m3PGFunc.NPP(p.StandAge, tree.fullCanAge, c.xPP, tree.k, p.LAI, c.fVPD, c.fSW, c.fAge, tree.alpha, c.fNutr, c.fT, c.fFrost);
	
	var NPP_target = m3PGFunc.NPP(p.StandAge, tree.fullCanAge, c.xPP, tree.k, tree.rootLAITarget, c.fVPD, c.fSW, c.fAge, tree.alpha, c.fNutr, c.fT, c.fFrost);
	c.RootP = m3PGFunc.coppice.RootP(c.NPP, NPP_target, p.WR, p.W,tree.pRx,tree.rootStoragePct);
	
	c.pfs = m3PGFunc.coppice.pfs(p.WS,plantation.StockingDensity, tree.stemsPerStump, 
				       tree.stemConst, tree.stemPower, tree.pfsConst, tree.pfsPower, tree.pfsMax);
	
	c.dW = c.NPP+tree.rootEfficiency*c.RootP;
	
	c.Intcptn = m3PGFunc.Intcptn(c.LAI, tree.Intcptn);
	c.CanCond = m3PGFunc.CanCond(c.PhysMod, c.LAI, tree.Conductance);
	
	c.pR = m3PGFunc.pR(c.PhysMod, manage.fertility,tree.pR);	
        c.litterfall=m3PGFunc.tdp(p.StandAge,tree.litterfall);
	//log("weather.rad=" + weather.rad + " weather.daylight=" + weather.daylight + " tree.rhoAir=" + tree.rhoAir + " tree.lambda=" + tree.lambda + " tree.VPDconv=" + tree.VPDconv + " c.VPD=" + c.VPD + " tree.BLcond=" + tree.BLcond + " c.CanCond=" + c.CanCond);
	c.Transp = m3PGFunc.Transp(weather.rad, weather.daylight, c.VPD, tree.BLcond, c.CanCond);
	
	c.pS = m3PGFunc.coppice.pS(c.pR,c.pfs);
	c.pF = m3PGFunc.coppice.pF(c.pR,c.pfs);	
	c.Irrig = m3PGFunc.Irrig(manage.irrigFrac, c.Transp, c.Intcptn, weather.ppt);
	c.CumIrrig = p.CumIrrig + c.Irrig;
	
	c.ASW = m3PGFunc.ASW(soil.maxAWS, p.ASW, weather.ppt, c.Transp, c.Intcptn, c.Irrig); //for some reason spelled maxAWS
	
	//log("c.pR=" + c.pR + " c.pS=" + c.pS + " p.WF=" + p.WF + " c.litterfall=" + c.litterfall);
	c.WF = m3PGFunc.WF(c.pR, p.WF, c.dW, c.litterfall);
	
	//log("p.WR=" + p.WR + " c.dW=" + c.dW + " c.pR=" + c.pR + " tree.RttoverP=" + tree.Rttover);
	c.WR = m3PGFunc.coppice.WR(p.WR, c.dW, c.pR, tree.Rttover, c.RootP);
	c.WS = m3PGFunc.WS(p.WS, c.dW, c.pS);
	c.W = c.WF+c.WR+c.WS;
//	c.fFrost=litterfall;
	return c;
	},	
}

function env() {
	if( typeof plv8 !== 'undefined' ) return "plv8";
	if( typeof Logger !== 'undefined' ) return "appscript";
	if( typeof module !== 'undefined' && module.exports) return "node";
}


function log(msg) {
	if( env() == "plv8" ) plv8.elog(NOTICE, 'notice', msg);
	if( env() == "appscript" ) Logger.log(msg);
}

//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
	exports.dump = function() {
		var objStr = "m3PG={";
		for( var key in m3PG ) {
			if( typeof m3PG[key] == 'function' ) {
				objStr += key+":"+m3PG[key].toString()+",";
			} else {
				objStr += key+":"+JSON.stringify(m3PG[key])+",";
			}
		}
		return objStr.replace(/,$/,'')+"};";
	}
}
