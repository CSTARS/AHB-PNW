/* 
  Package to compute Solar Radiation and daylight hours
*/
var SolRad = {
    nodeDebug : false,

    // solar constant (MJ m^-2 min^-1)
    G_sc : 0.0820,

    // regression constant, expressing the fraction of extraterrestrial radiation reaching the earth on overcast days
    // NOTE: Where no actual solar radiation data are available and no calibration has been carried out for improved as 
    //       and bs parameters, the values A_s = 0.25 and B_s = 0.50 are recommended.
    A_s : 0.25,
    B_s : 0.50,  

    env : function () {
	if( typeof plv8 !== 'undefined' ) return "plv8";
	if( typeof Logger !== 'undefined' ) return "appscript";
	if( typeof module !== 'undefined' && module.exports) return "node";
    },
    
    log : function (msg) {
	if( SolRad.env() == "plv8" ) plv8.elog(NOTICE, 'notice', msg);
	if( SolRad.env() == "appscript" ) Logger.log(msg);
    },

    extraterrestrial_radiation: function (date, lat) {
	// solar declination
	var d;
    
	// lat in radians
	var j;
	// inverse relative distance Earth-Sun
	var D_r;
	// sunset hour angle
	var W_s;
	// extraterrestrial radiation
	var R_a;
	// daylight hours
	var N;

	// convert lat to radians
	j = ( Math.PI / 180 ) * lat;

	var doy=SolRad.dayOfYear(date);

	D_r = 1 + 0.033 * Math.cos( ((2*Math.PI)/365) * doy );
	

	d = 0.409 * Math.sin( ((2*Math.PI)/365) * doy - 1.39 );
	

	W_s = Math.acos( -1 * Math.tan(j) * Math.tan(d) );

	R_a = ((24*60)/Math.PI) * SolRad.G_sc*D_r * ( W_s*Math.sin(j)*Math.sin(d) + 
			Math.cos(j)*Math.cos(d)*Math.sin(W_s) );
	R_a = R_a.toFixed(1);

	var N = ( 24 / Math.PI ) * W_s;

	// round to one decimal
	var rad={
	    "date":date,
	    "doy":doy,
	    "latitude_radians":j,
	    "inverse_relative_solar_distance":D_r,
	    "extraterrestrial_radiation":R_a,
	    "sunset_hour_angle":W_s,
	    "daylight_hours":N,
	    "solar_declination":d
	};
	if( SolRad.nodeDebug ) {
	    SolRad.log(JSON.stringify(rad));
	}
	return rad;
    },

    dayOfYear: function(date) {
	var first = new Date(date.getFullYear(), 0, 1);
	return Math.ceil(((date - first) / 1000 / 60 / 60 / 24) + .5, 0);
    },
    
    /**
     * Computes surface solar radiation.
     * @param{Object} rad - an associative array from a call to extraterrestrial_radiation.
     * @param{Number} n - Actual number of daylight hours observed.
     * @returns{Number} - Solar radiation [MJ / (m^2 day)]
     */
    solar_radiation: function (rad,n) {
	var n = typeof n !== 'undefined' ? n : rad.daylight_hours; 
	var R_s = ( SolRad.A_s + SolRad.B_s*(n/rad.daylight_hours) ) * rad.extraterrestrial_radiation;
	R_s = R_s.toFixed(1);

	if( SolRad.nodeDebug ) SolRad.log("R_s: "+R_s);
	return R_s; 
    },

    // R_S : solar or shortwave radiation [MJ m-2 day-1],
    daylight_hours : function(rad,R_s) {
	SolRad.log("radiative_fraction: "+(R_s / rad.extraterrestrial_radiation));
	var n = rad.daylight_hours * ( ((R_s / rad.extraterrestrial_radiation) - SolRad.A_s) / SolRad.B_s );
	n = n.toFixed(2);

	if( SolRad.nodeDebug ) SolRad.log("n: "+n);	
	return n; 
    },

    _test : function() {
	var rad=SolRad.extraterrestrial_radiation(new Date(2013, 4, 15), -22.9);
	SolRad.solar_radiation(rad,7.1);
	
	var rads = [3.45, 6.99, 10.28, 15.12, 18.66, 20.82, 22.8, 16.24, 14.6, 8.89, 4.32, 3.11];
	for( var i = 0; i < rads.length; i++ ) {
	    rad=SolRad.extraterrestrial_radiation(new Date(2013, i, 15), -22.9);
	    SolRad.daylight_hours(rad,rads[i]);
	    SolRad.log("\n");
	}
    }
};

if (SolRad.nodeDebug) {
    SolRad._test();
}