var nodeDebug = true;

// solar constant (MJ m^-2 min^-1)
var G_sc = 0.0820;

function radiation(date, lat) {
	

	// convert lat to radians
	var j = ( Math.PI / 180 ) * lat;


	// inverse relative distance Earth-Sun
	var D_r = 1 + 0.033 * Math.cos( ((2*Math.PI)/365) * dayOfYear(date) );
	

	// solar declination
	var d = 0.409 * Math.sin( ((2*Math.PI)/365) * dayOfYear(date) - 1.39 );
	

	// sunset hour angle
	var W_s = Math.acos( -1 * Math.tan(j) * Math.tan(d) );


	// extraterrestrial radiation
	var R_a = ((24*60)/Math.PI) * G_sc*D_r * ( W_s*Math.sin(j)*Math.sin(d) + 
			Math.cos(j)*Math.cos(d)*Math.sin(W_s) );

	if( nodeDebug ) {
		console.log("Date: "+date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate());
		console.log("Days: "+dayOfYear(date));
		console.log("j: "+j);
		console.log("D_r: "+D_r);
		console.log("d: "+d);
		console.log("W_s: "+W_s);
	}

	// round to one decimal
	return R_a.toFixed(1);
}

function dayOfYear(date) {
	var first = new Date(date.getFullYear(), 0, 1);
	return Math.ceil(((date - first) / 1000 / 60 / 60 / 24) + .5, 0);
}

if( nodeDebug ) console.log(radiation(new Date(2013, 8, 3), -20));
