var nodeDebug = true;

// solar constant (MJ m^-2 min^-1)
var G_sc = 0.0820;

// lat in radians
var j;

// inverse relative distance Earth-Sun
var D_r;

// solar declination
var d;

// sunset hour angle
var W_s;

// extraterrestrial radiation
var R_a;

// daylight hours
var N;

// regression constant, expressing the fraction of extraterrestrial radiation reaching the earth on overcast days
// NOTE: Where no actual solar radiation data are available and no calibration has been carried out for improved as 
//       and bs parameters, the values A_s = 0.25 and B_s = 0.50 are recommended.
var A_s = 0.25;
var B_s = 0.50;  

// solar or shortwave radiation [MJ m-2 day-1],
var R_s;

function dailyExtRadiation(date, lat) {
	

	// convert lat to radians
	j = ( Math.PI / 180 ) * lat;


	D_r = 1 + 0.033 * Math.cos( ((2*Math.PI)/365) * dayOfYear(date) );
	

	d = 0.409 * Math.sin( ((2*Math.PI)/365) * dayOfYear(date) - 1.39 );
	

	W_s = Math.acos( -1 * Math.tan(j) * Math.tan(d) );


	R_a = ((24*60)/Math.PI) * G_sc*D_r * ( W_s*Math.sin(j)*Math.sin(d) + 
			Math.cos(j)*Math.cos(d)*Math.sin(W_s) );
	R_a = R_a.toFixed(1);

	if( nodeDebug ) {
		console.log("Date: "+date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate());
		console.log("Days: "+dayOfYear(date));
		console.log("j: "+j);
		console.log("D_r: "+D_r);
		console.log("d: "+d);
		console.log("W_s: "+W_s);
		console.log("R_a: "+R_a);
	}

	// round to one decimal
	return R_a;
}

function dayOfYear(date) {
	var first = new Date(date.getFullYear(), 0, 1);
	return Math.ceil(((date - first) / 1000 / 60 / 60 / 24) + .5, 0);
}

function daylightHours() {
	N = ( 24 / Math.PI ) * W_s;

	if( nodeDebug ) console.log("N: "+N);

	return N;
}

// n: actual duration of sunshine
function solarRadiation(n) {
	R_s = ( A_s + B_s*(n/N) ) * R_a;
	R_s = R_s.toFixed(1);

	if( nodeDebug ) console.log("R_s: "+R_s);
	
	return R_s; 
}

// R_s : solar radiation
function actualDaylightHours(R_s) {
	console.log("tmp: "+(R_s / R_a));
	var n = N * ( ((R_s / R_a) - A_s) / B_s );
	n = n.toFixed(2);

	if( nodeDebug ) console.log("n: "+n);
	
	return n; 
}

if( nodeDebug ) {
	dailyExtRadiation(new Date(2013, 4, 15), -22.9);
	daylightHours();
	solarRadiation(7.1);

	var rads = [3.45, 6.99, 10.28, 15.12, 18.66, 20.82, 22.8, 16.24, 14.6, 8.89, 4.32, 3.11];
	for( var i = 0; i < rads.length; i++ ) {
		dailyExtRadiation(new Date(2013, i, 15), -22.9);
		daylightHours();
		actualDaylightHours(rads[i]);
		console.log("\n");
	}
}
