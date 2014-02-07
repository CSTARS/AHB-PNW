var model = {
	    tree: {
	        description: "These specify growth parameters specific to the species of tree.",
	        value: {
	            k: {
	                units: "unitless",
	                description: "Radiation Extinction Coefficient.",
	                value: 0.5
	            },
	            fullCanAge: {
	                units: "[y]",
	                description: "Year where tree reaches full Canopy Cover.",
	                value: 1.5
	            },
	            kG: {
	                units: "[kPA^-1]",
	                description: "Determines the response of the canopy conductance to the vapor pressure deficit.",
	                value: 0.5
	            },
	            alpha: {
	                units: "[kg/mol ?]",
	                description: "Canopy quantum efficiency.",
	                value: 0.08
	            },
	            fT: {
	                description: "Specifies the parameters affecting temperature modifier, fT. A graph of how these parameters affect the temperature modifier is found here: https://www.desmos.com/calculator/69iwqtnl28",
	                value: {
	                    mn: {
	                        units: "[C]",
	                        description: "Specifies the minimum temperature of respiration",
	                        value: 0
	                    },
	                    opt: {
	                        units: "[C]",
	                        description: "Specifies the optimum temperature of respiration",
	                        value: 20
	                    },
	                    mx: {
	                        units: "[C]",
	                        description: "Specifies the maximum temperature of respiration",
	                        value: 50
	                    }
	                }
	            },
	            BLcond: {
	                units: "[]",
	                description: "Canopy boundary layer conductance. Used in the calcuation of transpiration",
	                value: 0.04
	            },
	            fAge: {
	                units: "fraction",
	                description: "Specifies the growth limiter as a function of the tree age.  This is a time dependancy parameter.  The graph of the function is available at: https://www.desmos.com/calculator/wa0q2ih18h",
	                value: {
	                    f0: {
	                        description: "Value at Initial Time",
	                        value: 1
	                    },
	                    f1: {
	                        description: "Value at Infinite Time",
	                        value: 0
	                    },
	                    tm: {
	                        units: "[y]",
	                        description: "Time in years where value is the average of f0 and f1",
	                        value: 47.5
	                    },
	                    n: {
	                        description: "n>=1; Parameter specifing the rate of change around tm.  n=1 is approximately a linear change, as n increases, change becomes more localized around tm.",
	                        value: 3.5
	                    }
	                }
	            },
	            fN0: {
	                units: "fraction",
	                description: "Used in the calculation of the nutritional modifier,fNutr.  fNutr ranges from [fNO,1) based on the fertility index which ranges from 0 to 1.  When fN0=1 indicates fNutr is 1",
	                value: 0.26
	            },
	            SLA: {
	                units: "[m^2/kg]",
	                description: "Specifies the Specific Leaf Area as a function of the tree age.  This is a time dependancy parameter.  Used in the calculation of LAI.  The graph of the function is available at: https://www.desmos.com/calculator/wa0q2ih18h",
	                value: {
	                    f0: {
	                        description: "Value at Initial Time",
	                        value: 19
	                    },
	                    f1: {
	                        description: "Value at Infinite Time",
	                        value: 10.8
	                    },
	                    tm: {
	                        units: "[y]",
	                        description: "Time in years where value is the average of f0 and f1",
	                        value: 5
	                    },
	                    n: {
	                        description: "n>=1; Parameter specifing the rate of change around tm.  n=1 is approximately a linear change, as n increases, change becomes more localized around tm.",
	                        value: 2
	                    }
	                }
	            },
	            //CheckUnitsChangetolinearFunction
	            Conductance: {
	                units: "[gc m/s]?",
	                description: "Along with a Physiological modifer, specifies the canopy conductance.  Used in calculation of transpiration",
	                value: {
	                    mn: {
	                        description: "Minimum value, when lai=0",
	                        value: 0.0001
	                    },
	                    mx: {
	                        description: "Maximum value",
	                        value: 0.02
	                    },
	                    lai: {
	                        units: "[m^2/m^2]",
	                        description: "Leaf Area Index where parameter reaches a maximum value.",
	                        value: 2.6
	                    }
	                }
	            },
	            Intcptn: {
	                units: "fraction",
	                description: "Rainfall interception fraction.  A linear function w.r.t. LAI",
	                value: {
	                    mn: {
	                        description: "Minimum value, when lai=0",
	                        value: 0
	                    },
	                    mx: {
	                        description: "Maximum value",
	                        value: 0.24
	                    },
	                    lai: {
	                        units: "[m^2/m^2]",
	                        description: "Leaf Area Index where parameter reaches a maximum value.",
	                        value: 7.3
	                    }
	                }
	            },
	            y: {
	                description: "Assimilation use efficiency.  Used in calculation of the NPP.",
	                value: 0.47
	            },
	            pfs: {
	                units: "fraction",
	                description: "This defines the foliage to stem (WF/WS) fraction in allocating aboveground biomass of the tree. This is calculated with a pair of allometric power equations.  The first relates basal diameter, (DOB) to total woody biomass, while the second relates DOB to pfs.  The parameterization of the relationship between DOB and woody biomass is inverted to determine the DOB from the modeled woody fraction.  This relation is plotted at: .  The model allocates the appropriate fraction of wood based on the Stocking density of the plantation. DOB rather than DBH is used for comparison of trees with a high stemCnt and rapid coppicing value.",
	                value: {
	                    stemCnt: {
	                        description: "Average number of stems per stump",
	                        value: 2.8
	                    },
	                    stemC: {
	                        units: "[cm^-1]",
	                        description: "Constant in relation of DOB to woody biomass",
	                        value: 0.18
	                    },
	                    stemP: {
	                        description: "Power in relation of DOB to woody biomass.",
	                        value: 2.4
	                    },
	                    pfsMx: {
	                        description: "Maximum possible pfs value allowed",
	                        value: 2
	                    },
	                    pfsP: {
	                        description: "Power in relation of DBO to pfs",
	                        value: -0.772
	                    },
	                    pfsC: {
	                        units: "[cm^-1]",
	                        description: "Constant in relation of DOB to pfs.",
	                        value: 1.3
	                    }
	                }
	            },
	            pR: {
	                units: "fraction",
	                description: "Along with a Physiologial parameter, specifies the amount of new growth allocated to the root system, and the turnover rate.",
	                value: {
	                    mn: {
	                        description: "Minimum allocation to the root, when the physiologal parameter is 1.",
	                        value: 0.17
	                    },
	                    mx: {
	                        description: "Maximum allocation to the root, when m0.",
	                        value: 0.7
	                    },
	                    m0: {
	                        description: "Dependance on the fertility index. 0 indicates full dependance on fertility, 1 indicates a constant allocation, independant of fertility",
	                        value: 0.5
	                    },
	                    turnover: {
	                        units: "[month^-1]",
	                        description: "Specifies the monthly root turnover rate.",
	                        value: 0.02
	                    }
	                }
	            },
	            rootP: {
	                description: "These parameters specify root allocation to growth after coppicing.",
	                value : {
		                frac: {
		                    units: "[month^1]",
		                    description: "Specifies the fractional amount of root biomass that exceeds the aboveground requirements that can be supplied in a given month.",
		                    value: 0.2
		                },
		                LAITarget: {
		                    units: "[m^2/m^2]",
		                    description: "Specifies a target LAI rate.  The Target LAI is included in the calculation of a target NPP, based on weather paramaters.  Below this target, the roots will contribute biomass if the below ground root mass exceeds the requirements of the aboveground biomass. The target is specified in LAI to time root contributions to periods of growth",
		                    value: 10
		                },
		                efficiency: {
		                    units: "[kg/kg]",
		                    description: "Specifies the efficiency in converting root biomass into aboveground biomass.",
		                    value: 0.7
		                }
	                }
	            },
	            litterfall: {
	                units: "fraction",
	                description: "Specifies the fractional monthly loss of foliage. This is a time dependany parameter.  The graph of the function is available at: https://www.desmos.com/calculator/6iq9ppdqs7",
	                value: {
	                    f0: {
	                        description: "Value at Initial Time",
	                        value: 0.0015
	                    },
	                    f1: {
	                        description: "Value at Infinite Time",
	                        value: 0.03
	                    },
	                    tm: {
	                        units: "[y]",
	                        description: "Time in years where value is the average of f0 and f1",
	                        value: 2
	                    },
	                    n: {
	                        description: "n>=1; Parameter specifing the rate of change around tm.  n=1 is approximately a linear change, as n increases, change becomes more localized around tm.",
	                        value: 2.5
	                    }
	                }
	            }
	        }
	    },
	    //endtree
	    plantation: {
	        description: "Greenwood PG Values (default)",
	        value: {
	            type: {
	                value: "",
	                description: ""
	            },
	            StockingDensity: {
	                value: 3587,
	                units: "Trees/hectar",
	                description: "Number of trees planted per hectar"
	            },
	            SeedlingMass: {
	                value: 0.0004,
	                units: "kG",
	                description: "Mass of the seedling"
	            },
	            pS: {
	                value: 0.1,
	                units: "unitless",
	                description: "Proportion of seedling mass going into stem"
	            },
	            pF: {
	                value: 0,
	                units: "unitless",
	                description: "Proportion of seedling mass going into foliage"
	            },
	            pR: {
	                value: 0.9,
	                units: "unitless",
	                description: "Proportion of seedling mass going into root"
	            }
	        }
	    },
	    plantation_state: {
	        description: "Plantation state class, containing all intemediate values at every timestep of the model",
	        value: {
	            feedstockHarvest: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            coppiceCount: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            coppiceAge: {
	                value: -1,
	                units: "month",
	                description: "Age of tree at the time of coppice"
	            },
	            VPD: {
	                value: -1,
	                units:"kPA",
					description:"Mean vapor pressure deficit"
	            },
	            fVPD: {
	                value: -1,
	                units : "unitless",
					description:"Vapor Pressure Deficit Modifier (Poplar)"
	            },
	            fT: {
	                value: -1,
	                units:"unitless",
	                description:"Temperature modifier"
	            },
	            fFrost: {
	                value: -1,
	                units : "unitless",
					description : "Number of Freeze Days Modifier"
	            },
	            fNutr: {
	                value: -1,
	                units:"unitless", 
					description:"Nutritional Fraction, might be based on soil and fertilizer at some point"
	            },
	            fSW: {
	                value: -1,
	                units: "",
	                description: "Soil water modifier"
	            },
	            fAge: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            PAR: {
	                value: -1,
	                units:"mols", 
					description:"Monthly PAR in mols / m^2 month" 
	            },
	            xPP: {
	                value: -1,
	                units: "metric tons Dry Matter/ha",
	                description: "maximum potential Primary Production"
	            },
	            Intcptn: {
	                value: -1,
	                units: "unitless",
	                description: "Canopy rainfall interception"
	            },
	            ASW: {
	                value: -1,
	                units: "mm",
	                description: "Available soil water"
	            },
	            CumIrrig: {
	                value: -1,
	                units: "mm",
	                description: "Cumulative irrigation"
	            },
	            Irrig: {
	                value: -1,
	                units: "mm/mon",
	                description: "Required irrigation"
	            },
	            StandAge: {
	                value: -1,
	                units: "month",
	                description: "Age of the tree"
	            },
	            LAI: {
	                value: -1,
	                units: "",
	                description: "Leaf area index"
	            },
	            CanCond: {
	                value: -1,
	                units: "",
	                description: "Canopy conductance"
	            },
	            Transp: {
	                value: -1,
	                units: "mm/mon",
	                description: "Canopy monthly transpiration"
	            },
	            PhysMod: {
	                value: -1,
	                units: "unitless",
	                description: "Physiological Modifier to conductance and APARu"
	            },
	            pfs: {
	                value: -1,
	                units: "",
	                description: "Ratio of foliage to stem partitioning"
	            },
	            pR: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            pS: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            pF: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            litterfall: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            NPP: {
	                value: -1,
	                units: "metric tons Dry Matter/ha",
	                description: "Net Primary Productivity"
	            },
	            RootP: {
	                value: -1,
	                units: "",
	                description: "Root productivity"
	            },
	            dW: {
	                value: -1,
	                units: "",
	                description: ""
	            },
	            WF: {
	                value: -1,
	                units: "bdt/ha",
	                description: "Foliage yield"
	            },
	            WR: {
	                value: -1,
	                units: "bdt/ha",
	                description: "Root yield"
	            },
	            WS: {
	                value: -1,
	                units: "bdt/ha",
	                description: "Stem yield"
	            },
	            W: {
	                value: -1,
	                units: "bdt/ha",
	                description: "Total yield: root + stem + foliage"
	            }
	        }
	    },
	    soil: {
	        description: "Soil information based on current location",
	        value: {
	            maxaws: {
	                value: -1,
	                units: "",
	                description: "Maximum available soil water"
	            },
	            swpower: {
	                value: -1,
	                units: "",
	                description: "power parameter based on clay content of soil"
	            },
	            swconst: {
	                value: -1,
	                units: "",
	                description: "constant parameter based on clay content of soil"
	            }
	        }
	    },
	    weather: {
	        month: {
	            value: -1,
	            units: "unitless",
	            description: "The month number since planting"
	        },
	        tmin: {
	            value: -1,
	            units: "Celcius",
	            description: "Minimum temperature for growth"
	        },
	        tmax: {
	            value: -1,
	            units: "Celcius",
	            description: "Maximum temperature for growth"
	        },
	        tdmean: {
	            value: -1,
	            units: "Celcius",
	            description: "Dew point temperature"
	        },
	        ppt: {
	            value: -1,
	            units: "",
	            description: "Precipitation"
	        },
	        rad: {
	            value: -1,
	            units: "",
	            description: "Solar radiation"
	        },
	        nrel: {
	            value: -1,
	            units: "",
	            description: ""
	        },
	        daylight: {
	            value: -1,
	            units: "",
	            description: ""
	        }
	    },
	    constants: {
	        description: "These are constants.",
	        value: {
	            days_per_month: {
	                value: 30.4,
	                units: "days/mo",
	                description: "Number of Days in an average month"
	            },
	            e20: {
	                value: 2.2,
	                units: "vp/t",
	                description: "Rate of change of saturated VP with T at 20C"
	            },
	            rhoAir: {
	                value: 1.2,
	                units: "kg/m^3",
	                description: "Density of air"
	            },
	            lambda: {
	                value: 2460000,
	                units: "J/kg",
	                description: "Latent heat of vapourisation of h2o"
	            },
	            VPDconv: {
	                value: 0.000622,
	                units: "",
	                description: "Convert VPD to saturation deficit = 18/29/1000"
	            },
	            Qa: {
	                value: -90,
	                units: "W/m^2",
	                description: "Intercept of net radiation versus solar radiation relationship"
	            },
	            Qb: {
	                value: 0.8,
	                units: "unitless",
	                description: "slope of net vs. solar radiation relationship"
	            },
	            gDM_mol: {
	                value: 24,
	                units: "g/mol(C)",
	                description: "Molecular weight of dry matter"
	            },
	            molPAR_MJ: {
	                value: 2.3,
	                units: "mol(C)/MJ",
	                description: "Conversion of solar radiation to PAR"
	            }
	        }
	    },
	    manage : {
	    	description : "Crop Management Parameters",
	    	value : {
	    		irrigFrac : {
	    			value : 1,
	    			units : "",
	    			description : "Irrigation fraction: 1 = fully irrigated, 0 = no irrigation. Any values between 0 and 1 are acceptable"
	    		},
	    		fertility : {
	    			value : 0.7,
	    			units : "",
	    			description : "Soil fertility"
	    		},
                DatePlanted : {
                    value : "_date_",
                    units : "date",
                    description : "Date the crop was planted"
                },
                DateCoppiced : {
                    value : "_date_",
                    units : "date",
                    description : "Date of the first coppice"
                },
                CoppiceInterval : {
                    value : 3,
                    units : "Years",
                    description : "How after the crop is coppiced after the first coppice"
                },
                DateFinalHarvest : {
                    value : "_date_",
                    units : "date",
                    description : "Date when the crop is completely harvested"
                }
	    	}
	    }
		

}
