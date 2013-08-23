d={
    plantation : {
    },	
    tree : {
	description: "These specify growth parameters specific to the species of tree."
	value : {
// TODO What?
	    "k":{
		units : "unitless",
		description : "Radiation Extinction Coefficient.",
		value : 0.5
	    },
// This should be time dependant [0,1,.5,1]
	    "fullCanAge":{
		units : "[y]",
		description : "Year where tree reaches full Canopy Cover.",
		value : 0,
	    },
	    "kG":{
		units : "[kPA^-1]",
		description : "Determines the response of the canopy conductance to the vapor pressure deficit.",
		value : 0.005,
	    },
	    "alpha":{
		units : "[kg/mol ?]",
		description : "Canopy quantum efficiency.",
		value : 0.05
	    },
	    "fT":{
		description: "Specifies the parameters affecting temperature modifier, fT. A graph of how these parameters affect the temperature modifier is found here: https://www.desmos.com/calculator/69iwqtnl28",
		value : {
                    min: { units:"[C]",
			   description:"Specifies the minimum temperature of respiration",
			   value : 5
			 },
		    opt: { units:"[C]",
			   description:"Specifies the optimum temperature of respiration",
			   value : 20
			 },
                    max: { units:"[C]",
			   description:"Specifies the maximum temperature of respiration",
			   value : 40
			 },
		}            
	    },
	    "BLcond":{
		units : "[]",
		description : "Canopy boundary layer conductance. Used in the calcuation of transpiration",
		value : 0.2,
	    },
	    "fAge":{
		units : "fraction",
		description : "Specifies the growth limiter as a function of the tree age.  This is a time dependancy parameter.  The graph of the function is available at: https://www.desmos.com/calculator/wa0q2ih18h",
		value : {
		    f0:{
			description : "Value at Initial Time",
			value : 1,
		    },
		    f1:{
			description : "Value at Infinite Time",
			value : 0,
		    },
		    tm:{
			units "[y]",
			description : "Time in years where value is the average of f0 and f1",
			value : 47.5,
		    },
		    n:{
			description : "n>=1; Parameter specifing the rate of change around tm.  n=1 is approximately a linear change, as n increases, change becomes more localized around tm.",
			value : 3.5,
		    },
		}
	    },
// Could also be changed to mn,mx,etc.
	    "fN0":{
		units : "fraction",
		description : "Used in the calculation of the nutritional modifier,fNutr.  fNutr ranges from [fNO,1) based on the fertility index which ranges from 0 to 1.  When fN0=1 indicates fNutr is 1",
		value : 1,
	    },
	    "SLA":{
		units : "[m^2/kg]",
		description : "Specifies the Specific Leaf Area as a function of the tree age.  This is a time dependancy parameter.  Used in the calculation of LAI.  The graph of the function is available at: https://www.desmos.com/calculator/wa0q2ih18h",
		value : {
		    f0:{
			description : "Value at Initial Time",
			value : 1,
		    },
		    f1:{
			description : "Value at Infinite Time",
			value : 0,
		    },
		    tm:{
			units "[y]",
			description : "Time in years where value is the average of f0 and f1",
			value : 47.5,
		    },
		    n:{
			description : "n>=1; Parameter specifing the rate of change around tm.  n=1 is approximately a linear change, as n increases, change becomes more localized around tm.",
			value : 3.5,
		    },

		}
	    },
// Check Units Change to linear Function
	    "Conductance":{
		units : "[gc m/s]?",
		description : "Along with a Physiological modifer, specifies the canopy conductance.  Used in calculation of transpiration",
		value : {
		    mn : {
			description : "Minimum value, when lai=0",
			value : 0.0001,
		    },
		    mx : {
			description : "Maximum value",
			value : 0.2,
		    },
		    lai : {
			units : "[m^2/m^2]",
			description : "Leaf Area Index where parameter reaches a maximum value.",
			value : 3.33,
		    }
		}
	    },
	    "Intcptn":{
		units : "fraction",
		description : "Rainfall interception fraction.  A linear function w.r.t. LAI",
		value : {
		    mn : {
			description : "Minimum value, when lai=0",
			value : 0,
		    },
		    mx : {
			description : "Maximum value",
			value : 0.15,
		    },
		    lai : {
			units : "[m^2/m^2]",
			description : "Leaf Area Index where parameter reaches a maximum value.",
			value : 5,
		    }
		}
	    },
	    "y":{
		description : "Assimilation use efficiency.  Used in calculation of the NPP.",
		value : 0.47
	    },
	    "pfs" : {
		units :"fraction",
		description: "This defines the foliage to stem (WF/WS) fraction in allocating aboveground biomass of the tree. This is calculated with a pair of allometric power equations.  The first relates basal diameter, (DOB) to total woody biomass, while the second relates DOB to pfs.  The parameterization of the relationship between DOB and woody biomass is inverted to determine the DOB from the modeled woody fraction.  This relation is plotted at: .  The model allocates the appropriate fraction of wood based on the Stocking density of the plantation. DOB rather than DBH is used for comparison of trees with a high stemCnt and rapid coppicing value."
		value : {
		    "stemCnt":{
			description : "Average number of stems per stump",
			value : 2.8
		    },
		    "stemC":{
			units : "[cm^-1]"
			description : "Constant in relation of DOB to woody biomass",
			value : 0.18
		    },
		    "stemP":{
			description : "Power in relation of DOB to woody biomass.",
			value : 2.4,
		    },
		    "pfsMx":{
			description : "Maximum possible pfs value allowed",
			value : 2
		    },
		    "pfsP":{
			description : "Power in relation of DBO to pfs",
			value : -1.161976
		    },
		    "pfsC":{
			units "[cm^-1]",
			description : "Constant in relation of DOB to pfs.",
			value : 1.91698
		    },
		},
	    },
	    "pR":{
		units : "fraction",
		description : "Along with a Physiologial parameter, specifies the amount of new growth allocated to the root system, and the turnover rate.",
		value : {
		    mn :{
			description: "Minimum allocation to the root, when the physiologal parameter is 1.",
			value : 0.25,
		    },
		    mx :{
			description: "Maximum allocation to the root, when m0.",
			value : 0.34,
		    },
		    m0 : {
			description: "Dependance on the fertility index. 0 indicates full dependance on fertility, 1 indicates a constant allocation, independant of fertility",
			value : 0,
		    },
		    "turnover":{
			units : "[month^-1]",
			description : "Specifies the monthly root turnover rate.",
			value : 0.005,
		    },
		},
	    },
	    rootP : {
		description:"These parameters specify root allocation to growth after coppicing."
		"frac":{
		    units : "[month^1]",
		    description : "Specifies the fractional amount of root biomass that exceeds the aboveground requirements that can be supplied in a given month.",
		    value : 1
		},
		"LAITarget":{
		    units : "[m^2/m^2]",
		    description : "Specifies a target LAI rate.  The Target LAI is included in the calculation of a target NPP, based on weather paramaters.  Below this target, the roots will contribute biomass if the below ground root mass exceeds the requirements of the aboveground biomass. The target is specified in LAI to time root contributions to periods of growth",
		    value : 10
		},
		"efficiency":{
		    units : "[kg/kg]",
		    description : "Specifies the efficiency in converting root biomass into aboveground biomass.",
		    value : 0.5
		},
	    },
	    litterfall:{
		units : "fraction",
		description : "Specifies the fractional monthly loss of foliage. This is a time dependany parameter.  The graph of the function is available at: https://www.desmos.com/calculator/6iq9ppdqs7",
		value : {
		    f0:{
			description : "Value at Initial Time",
			value : 0.0015,
		    },
		    f1:{
			description : "Value at Infinite Time",
			value : 0.03,
		    },
		    tm:{
			units "[y]",
			description : "Time in years where value is the average of f0 and f1",
			value : 2,
		    },
		    n:{
			description : "n>=1; Parameter specifing the rate of change around tm.  n=1 is approximately a linear change, as n increases, change becomes more localized around tm.",
			value : 2.5,
		    },

		}
	    },
	}
    },
};
