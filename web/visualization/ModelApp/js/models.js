app.models = {
		
	weather : {
		month : "",
		tmin : -1,
		tmax : -1,
		tdmean : -1,
		ppt : -1,
		rad : -1,
		nrel : -1,
		daylight : -1
	},
	
	soil : {
		maxAWS : -1,
		swpower : -1,
		swconst : -1
	},
	
	plantation_state : {
		feedstockHarvest: -1,
		coppiceCount: -1,
		coppiceAge: -1,
		VPD: -1,
		fVPD: -1,
		fT: -1,
		fFrost: -1,
		fNutr: -1,
		fSW: -1,
		fAge: -1,
		PAR: -1,
		xPP: -1,
		Intcptn: -1,
		ASW: -1,
		CumIrrig: -1,
		Irrig: -1,
		StandAge: -1,
		LAI: -1,
		CanCond: -1,
		Transp: -1,
		PhysMod: -1,
		pfs: -1,
		pR: -1,
		pS: -1,
		pF: -1,
		litterfall: -1,
		NPP: -1,
		RootP: -1,
		dW: -1,
		WF: -1,
		WR: -1,
		WS: -1,
		W: -1
	},
	
	tree : { //values are default for Poplar tree
			  type:"poplar",
			  fullCanAge:undefined,
			  kG:undefined,
			  alpha:undefined,
			  Tmax:undefined,
			  Tmin:undefined,
			  Topt:undefined,
			  BLcond:undefined,
			  maxAge:undefined,
			  rAge:undefined,
			  nAge:undefined,
			  fN0:undefined,
			  SLA0:undefined,
			  SLA1:undefined,
			  tSLA:undefined,
			  MaxCond:undefined,
			  LAIgcx:undefined,
			  MaxIntcptn:undefined,
			  LAImaxIntcptn:undefined,
			  m0:undefined,
			  pRx:undefined,
			  pRn:undefined,
			  wSx1000:undefined,
			  thinPower:undefined,
			  y:undefined,
			  stemConst:undefined,
			  stemPower:undefined,
			  pfsMax:undefined,
			  pfsPower:undefined,
			  pfsConst:undefined,
			  rootStoragePct:undefined,
			  rootLAITarget:undefined,
			  rootEfficiency:undefined,
			  gammaFx:undefined,
			  gammaF0:undefined,
			  tgammaF:undefined,
			  Rttover:undefined,
			  k:undefined  
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
		},
		
		manage : {
			irrigFrac: -1,
			fertility: -1,
			coppice: false
		},
	},
	
	plantation : {
		type: {
			type : "string",
			description : ""
		},
		StockingDensity: {
			type : "float",
			description : ""
		},
		SeedlingMass:undefined,
		stemsPerStump:undefined,
		initialStemsPerStump:undefined,
		pS:undefined,
		pF:undefined,
		pR:undefined
	}
};