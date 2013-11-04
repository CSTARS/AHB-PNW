create type biorefinery_t (
       biorefinery serial,
       location integer,
       technology integer,
       a float,
       b float,
       maxSize float       
);

create type conversion_t (
       feed text,
       technology integer,
       conv_eff  float
);

create type od_t (
       src integer,
       dest integer,
       feed text
       cost float,
       capacity float
);

create type supply_t (
       location integer,
       feed text,
       price_level integer,
       price float,
       amount float
);

create type AHBland_t (
       scmz text,
       ccid integer,
       location integer,
       crop text,
       area float,
       pop_yield float
);

create type BCAMresults_t (
       scmz text,
       ccid integer,
       crop text,
       price_level integer,
       area float
);

create type demand_t (
       location integer,
       product text,
       price_level integer,
       amount float
);
       

create type gbsm_output(
       selected_refineries integer[], // Points to biorefineries
              
);

create function gbsm(
       potential_refineries biorefinery_t[],
       supply supply_t[],
       supply_transport od_t[],
       demand demand_t[],
       demand_transport od_t[])
returns ( gbsm_output );


       
