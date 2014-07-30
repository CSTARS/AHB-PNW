SET search_path = statsgo, pg_catalog;
drop table if exists comp CASCADE;

--comppct_l comppct_r comppct_h compname compkind majcompflag otherph localphase slope_l slope_r slope_h slopelenusle_l slopelenusle_r slopelenusle_h runoff tfact wei weg erocl earthcovkind1 earthcovkind2 hydricon hydricrating drainagecl elev_l elev_r elev_h aspectccwise aspectrep aspectcwise geomdesc albedodry_l albedodry_r albedodry_h airtempa_l airtempa_r airtempa_h map_l map_r map_h reannualprecip_l reannualprecip_r reannualprecip_h ffd_l ffd_r ffd_h nirrcapcl nirrcapscl nirrcapunit irrcapcl irrcapscl irrcapunit cropprodindex constreeshrubgrp wndbrksuitgrp rsprod_l rsprod_r rsprod_h foragesuitgrpid wlgrain wlgrass wlherbaceous wlshrub wlconiferous wlhardwood wlwetplant wlshallowwat wlrangeland wlopenland wlwoodland wlwetland soilslippot frostact initsub_l initsub_r initsub_h totalsub_l totalsub_r totalsub_h hydgrp corcon corsteel taxclname taxorder taxsuborder taxgrtgroup taxsubgrp taxpartsize taxpartsizemod taxceactcl taxreaction taxtempcl taxmoistscl taxtempregime soiltaxedition castorieindex flecolcomnum flhe flphe flsoilleachpot flsoirunoffpot fltemik2use fltriumph2use indraingrp innitrateleachi misoimgmtgrp vasoimgtgrp mukey cokey 

create table comp (
comppct_l integer,
comppct_r integer,
comppct_h integer,
compname varchar(60),
compkind varchar(18) references component_kind(compkind),
majcompflag boolean,
otherph varchar(40),
localphase varchar(40),
slope_l Float,
slope_r Float,
slope_h Float,
slopelenusle_l Integer,
slopelenusle_r Integer,
slopelenusle_h Integer,
runoff varchar(10) references runoff(runoff),
tfact Integer,
wei varchar(3) references wind_erodibility_index(wei),
weg varchar(2) references wind_erodibility_group(weg),
erocl varchar(18) references erosion_class(erocl),
earthcovkind1 varchar(22) references earth_cover_kind_level_one(earthcovkind1),
earthcovkind2 varchar(33) references earth_cover_kind_level_two(earthcovkind2),
hydricon varchar(52) references hydric_condition(hydricon),
hydricrating varchar(8) references hydric_rating(hydricrating),
drainagecl varchar(28) references drainage_class(drainagecl),
elev_l Float,
elev_r Float,
elev_h Float,
aspectccwise Integer,
aspectrep Integer,
aspectcwise Integer,
geomdesc text,
albedodry_l Float,
albedodry_r Float,
albedodry_h Float,
airtempa_l Float,
airtempa_r Float,
airtempa_h Float,
map_l Integer,
map_r Integer,
map_h Integer,
reannualprecip_l Integer,
reannualprecip_r Integer,
reannualprecip_h Integer,
ffd_l Integer,
ffd_r Integer,
ffd_h Integer,
nirrcapcl varchar(1)  references capability_class(capcl),
nirrcapscl varchar(1)  references capability_subclass(capscl),
nirrcapunit Integer,
irrcapcl varchar(1)  references capability_class(capcl),
irrcapscl varchar(1)  references capability_subclass(capscl),
irrcapunit Integer,
cropprodindex Integer,
constreeshrubgrp varchar(14) references conservation_tree_shrub_group(constreeshrubgrp),
wndbrksuitgrp varchar(8) references windbreak_suitability_group(wndbrksuitgrp),
rsprod_l Integer,
rsprod_r Integer,
rsprod_h Integer,
foragesuitgrpid varchar(11),
wlgrain varchar(9) references wildlife_rating(wl),
wlgrass varchar(9) references wildlife_rating(wl),
wlherbaceous varchar(9) references wildlife_rating(wl),
wlshrub varchar(9) references wildlife_rating(wl),
wlconiferous varchar(9) references wildlife_rating(wl),
wlhardwood varchar(9) references wildlife_rating(wl),
wlwetplant varchar(9) references wildlife_rating(wl),
wlshallowwat varchar(9) references wildlife_rating(wl),
wlrangeland varchar(9) references wildlife_rating(wl),
wlopenland varchar(9) references wildlife_rating(wl),
wlwoodland varchar(9) references wildlife_rating(wl),
wlwetland varchar(9) references wildlife_rating(wl),
soilslippot varchar(15) references soil_slippage_potential(soilslippot),
frostact varchar(8) references potential_frost_action(frostact),
initsub_l Integer,
initsub_r Integer,
initsub_h Integer,
totalsub_l Integer,
totalsub_r Integer,
totalsub_h Integer,
hydgrp varchar(3) references hydrologic_group(hydgrp),
corcon varchar(8) references corrosion_concrete(corcon),
corsteel varchar(8) references corrosion_uncoated_steel(corsteel),
taxclname varchar(120),
taxorder varchar(11) references taxonomic_order(taxorder),
taxsuborder varchar(9) references taxonomic_suborder(taxsuborder),
taxgrtgroup varchar(16) references taxonomic_great_group(taxgrtgroup),
taxsubgrp varchar(39), --references taxonomic_subgroup(taxsubgrp),
taxpartsize varchar(56) references taxonomic_family_particle_size(taxpartsize),
taxpartsizemod varchar(9) references taxonomic_family_part_size_mod(taxpartsizemod),
taxceactcl varchar(11) references taxonomic_family_c_e_act_class(taxceactcl),
taxreaction varchar(13) references taxonomic_family_reaction(taxreaction),
taxtempcl varchar(15) references taxonomic_family_temp_class(taxtempcl),
taxmoistscl varchar(15) references taxonomic_moisture_subclass(taxmoistscl),
taxtempregime varchar(19) references taxonomic_temp_regime(taxtempregime),
soiltaxedition varchar(15) references soil_taxonomy_edition(soiltaxedition),
castorieindex Integer,
flecolcomnum varchar(5),
flhe Boolean,
flphe Boolean,
flsoilleachpot varchar(6) references fl_soil_leaching_potential(flsoilleachpot),
flsoirunoffpot varchar(6) references fl_soil_runoff_potential(flsoirunoffpot),
fltemik2use Boolean,
fltriumph2use Boolean,
indraingrp varchar(3),
innitrateleachi Integer,
misoimgmtgrp varchar(7) references mi_soil_management_group(misoimgmtgrp),
vasoimgtgrp varchar(2) references va_soil_management_group(vasoimgtgrp),
mukey varchar(30) not null references mapunit,
cokey  varchar(30) primary key
);
create index component_mukey on component (mukey);
