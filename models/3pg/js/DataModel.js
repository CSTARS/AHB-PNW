var model = {
		
		tree : {
			type : {
				value : "",
				description : ""
			},
			 Rttover: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			 k: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			 fullCanAge: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			 kG: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			 alpha: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			 fT: {
				 value : {
					 mn  : -1,
					 opt : -1,
					 mx : -1
				 },
				 description : "",
				 units : ""
			 },
			 BLcond: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			  fAge: {
				  value : {
					  f0 : -1,
					  f1 : -1,
					  tm : -1,
					  n : -1
				  },
				  units : "",
				  description : ""
			  },
			 fN0: {
				 value : -1,
				 units : "",
				 description : ""
			 },
			 SLA: {
				 value : {
					 f0 : -1,
					 f1 : -1,
					 tm : -1,
					 n : -1
				 },
				 units : "",
				 description : ""
			 },
			 Conductance: {
				 value : {
					 mn  : -1,
					 opt : -1,
					 mx : -1
				 },
				 description : "",
				 units : ""
			 },
			 Intcptn: {
				 value : {
					 mn  : -1,
					 opt : -1,
					 mx : -1
				 },
				 description : "",
				 units : ""
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
			 y: {
				 value : -1,
				 units : "",
				 description : ""
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
			 litterfall: {
				value : -1,
				units : "",
				description : ""
			 }
		},
		
		plantation : {
			type:{
				 value : "",
				 description : ""
			 },
			StockingDensity:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			SeedlingMass:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			stemsPerStump:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			initialStemsPerStump:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			pS:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			pF:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			pR:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			seedlingTree:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			coppicedTree:{
				 value : -1,
				 units : "",
				 description : ""
			 }
		},
		
		plantation_state : {
				feedstockHarvest:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				coppiceCount:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				coppiceAge:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				VPD:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				fVPD:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				fT:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				fFrost:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				fNutr:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				fSW:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				fAge:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				PAR:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				xPP:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				Intcptn:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				ASW:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				CumIrrig:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				Irrig:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				StandAge:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				LAI:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				CanCond:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				Transp:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				PhysMod:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				pfs:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				pR:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				pS:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				pF:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				litterfall:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				NPP:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				RootP:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				dW:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				WF:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				WR:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				WS:{
				 value : -1,
				 units : "",
				 description : ""
			 },
				W:{
				 value : -1,
				 units : "",
				 description : ""
			 }
		},
		
		soil : {
			maxAWS:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			swpower:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			swconst:{
				 value : -1,
				 units : "",
				 description : ""
			 }
		},
		
		weather : {
			month:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			tmin:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			tmax:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			tdmean:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			ppt:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			rad:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			nrel:{
				 value : -1,
				 units : "",
				 description : ""
			 },
			daylight:{
				 value : -1,
				 units : "",
				 description : ""
			 }
		},
		
		constants : {
			days_per_month:{
			    value:30.4,
			    units:"days/mo",
			    description:"Number of Days in an average month"
			},
			e20:{
			    value:2.2,
			    units:"vp/t",
			    description:"Rate of change of saturated VP with T at 20C"
			},
			rhoAir:{
			    value:1.2,
			    units:"kg/m^3",
			    description:"Density of air"
			},
			lambda:{
			    value:2460000,
			    units:"J/kg",
			    description:"Latent heat of vapourisation of h2o"
			},
			VPDconv:{
			    value:0.000622,
			    units:"?",
			    description:"Convert VPD to saturation deficit = 18/29/1000"
			},
			Qa:{
			    value:-90,
			    units:"W/m^2",
			    description:"Intercept of net radiation versus solar radiation relationship"
			},
			Qb:{
			    value:0.8,
			    units:"",
			    description:""
			},
			gDM_mol:{
			    value:24,
			    units:"g/mol(C)",
			    description:"Molecular weight of dry matter"
			},
			molPAR_MJ:{
			    value:2.3,
			    units:"mol(C)/MJ",
			    description:"Conversion of solar radiation to PAR"
			}

			// ??
			/*manage : {
				irrigFrac: -1,
				fertility: -1,
				coppice: false
			},*/
		}
		

}