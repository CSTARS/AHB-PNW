create type price_level_t (
       price_level integer,
       price float
);

create type biorefinery_t (
       biorefinery serial,
       location integer,
       technology integer,
       a float,
       b float,
       maxSize float       
);

create type od_t (
       src integer,
       dest integer,
       cost float,
       capacity float
);

create type supply_t (
       location integer,
       price_level integer,
       amount float
);

create type demand_t (
       location integer,
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


       