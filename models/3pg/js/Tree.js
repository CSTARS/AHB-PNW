//TODO: add units and description

/**
@class Tree
*/
var Tree = { //values are default for Poplar tree
  /**
  @attribute type
  */
  type: "poplar",
  /**
  @attribute Rttover
  */
  Rttover: undefined,
  /**
  @attribute k
  */
  k: undefined,
  /**
  @attribute fullCanAge
  */
  fullCanAge: undefined,
  /**
  @attribute kG
  */
  kG: undefined,
  /**
  @attribute alpha
  */
  alpha: undefined,
  /**
  @attribute fT
  */
  fT: clone(fT_t),
  /**
  @attribute BLcond
  */
  BLcond: undefined,
  /**
  @attribute fAge
  */
  fAge: clone(tdp_t),
  /**
  @attribute fN0
  */
  fN0: undefined,
  /**
  @attribute SLA
  */
  SLA: clone(tdp_t),
  /**
  @attribute Conductance
  */
  Conductance: clone(cond_t),
  /**
  @attribute Intcptn
  */
  Intcptn: clone(cond_t),
  /**
  @attribute pR
  */
  pR: clone(pR_t),
  /**
  @attribute y
  */
  y: undefined,
  /**
  @attribute pfs
  */
  pfs: clone(pfs_t),
  /**
  @attribute rootP
  */
  rootP: clone(rootP_t),
  /**
  @attribute litterfall
  */
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
    m0: undefined,
    turnover: undefined
}

var rootP_t = {
    frac: undefined,
    LAITarget: undefined,
    efficiency: undefined
};

var pfs_t = {
    stemCnt: undefined,
    stemC: undefined,
    stemP: undefined,
    pfsMx: undefined,
    pfsP: undefined,
    pfsC: undefined
};

