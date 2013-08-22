//TODO: add units and description

var Tree = { //values are default for Poplar tree
  type: "poplar",
  Rttover: undefined,
  k: undefined,
  fullCanAge: undefined,
  kG: undefined,
  alpha: undefined,
  fT: clone(fT_t),
  BLcond: undefined,
  fAge: clone(tdp_t),
  fN0: undefined,
  SLA: clone(tdp_t),
  Conductance: clone(cond_t),
  Intcptn: clone(cond_t),
  pR: clone(pR_t),
  y: undefined,
  stemsPerStump: undefined,
  stemConst: undefined,
  stemPower: undefined,
  pfsMax: undefined,
  pfsPower: undefined,
  pfsConst: undefined,
  rootStoragePct: undefined,
  rootLAITarget: undefined,
  rootEfficiency: undefined,
  litterfall: clone(tdp_t)
}

//types

var tdp_t = {
  f0: undefined,
  f1: undefined,
  tm: undefined,
  n:  undefined
}

var fT_t = { 
  mn: undefined,
  opt: undefined,
  mx: undefined
}

var cond_t = {
  mn: undefined,
  mx: undefined,
  lai: undefined
}

var pR_t = {
  mn: undefined,
  mx: undefined,
  m0: undefined
}

