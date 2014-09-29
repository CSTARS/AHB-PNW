#! /usr/bin/make -f 
ifndef configure.mk
include ../configure.mk
endif

raster2pgsql:=raster2pgsql
prism.srid:=4322

years:=$(shell seq 2008 2013)
months:=$(shell seq -f %02.0f 1 12)

# or Nearest Neighbor, BiLInear
sampleType:=Cubic

.PHONY:db
db:db/prism

db/prism:
	[[ -d db ]] || mkdir db
	${PG} -f prism.sql
	touch $@

#####################################################################
# Download all files:
#####################################################################
define download

.PHONY: download
$(warning prism.nacse.org/monthly/$1/$2/PRISM_$1_stable_4kmM2_$2$3_bil.zip)

download::prism.nacse.org/monthly/$1/$2/PRISM_$1_stable_4kmM2_$2$3_bil.zip

prism.nacse.org/monthly/$1/$2/PRISM_$1_stable_4kmM2_$2$3_bil.zip:
	wget --mirror ftp://prism.nacse.org/monthly/$1/$2/PRISM_$1_stable_4kmM2_$2$3_bil.zip

prism.nacse.org/monthly/$1/$2/:
	wget --mirror --accept='*_$2??_bil.zip' ftp://prism.nacse.org/monthly/$1/$2/
endef

# Start w/ 20 year average
$(foreach v,tmin tmax ppt tmean,$(foreach y,${years},$(foreach m,${months},$(eval $(call download,$v,$y,$m)))))


# These are the local locations of the PRISM zip files
prism-dir:=prism.nacse.org/monthly

define prism-zip
${prism-dir}/$1/$2/PRISM_$1_stable_4kmM2_$2$3_bil.zip
endef

# Insert a Months worth of data into the postgres database.
define prism-add-one-month
$(warning adding rule db/prism.climate.$1.$2)

db/prism.climate::db/prism.climate.$1.$2
db/prism.climate.$1.$2: $(call prism-zip,tmin,$1,$2) $(call prism-zip,tmax,$1,$2)  $(call prism-zip,ppt,$1,$2) $(call prism-zip,tmean,$1,$2) 
	rm -rf prism-tmp; mkdir prism-tmp; \
	unzip -d prism-tmp $(call prism-zip,tmin,$1,$2);\
	unzip -d prism-tmp $(call prism-zip,tmax,$1,$2);\
	unzip -d prism-tmp $(call prism-zip,ppt,$1,$2);\
	unzip -d prism-tmp $(call prism-zip,tmean,$1,$2);\
	cd prism-tmp;\
	${raster2pgsql} -F -s 4322 -C -r -d *.bil prism.temp | ${PG};
	${PG} -c "delete from prism.climate where year=$1 and month=$2; insert into prism.climate (year,month,tmin,tmax,ppt,tdmean) select $1,$2,prism.us_to_template(tmin.rast,default_rast(),'${sampleType}'),prism.us_to_template(tmax.rast,default_rast(),'${sampleType}'),prism.us_to_template(ppt.rast,default_rast(),'${sampleType}'),prism.us_to_template(tmean.rast,default_rast(),'${sampleType}') from prism.temp tmin,prism.temp tmax,prism.temp ppt,prism.temp tmean where tmin.filename='PRISM_tmin_stable_4kmM2_$1$2_bil.bil' and tmax.filename='PRISM_tmax_stable_4kmM2_$1$2_bil.bil' and ppt.filename='PRISM_ppt_stable_4kmM2_$1$2_bil.bil' and tmean.filename='PRISM_tmean_stable_4kmM2_$1$2_bil.bil'";
	touch $$@
	rm -rf prism-tmp
endef

$(foreach y,${years},$(foreach m,${months},$(eval $(call prism-add-one-month,$y,$m))))

# db/prism.avg:
# 	${PG} -c "set search_path=prism,public; select * from create_avg();"
# 	touch $@;



# ###################################################################
# # Prism Elevation matches prism data
# ###################################################################
# dem:=prism.nacse.org/pub/prism/maps/Other/U.S./us_25m.dem.gz

# download::${dem}

# ${dem}:
# 	wget -m ftp://${dem}

# db/prism.static:
# 	zcat ${dem} > dem
# 	${raster2pgsql} -F -s 4322 -C -r -d dem prism.temp | ${PG};
# 	${PG} -c "delete from prism.static where layer='dem'; insert into prism.static (layer,rast) select 'dem',prism.us_to_template(rast,default_rast(),'${sampleType}') from prism.temp";
# 	[[ -d $(dir $@) ]] || mkdir -p $(dir $@); touch $@
# 	rm -f dem
# 	touch $@

# #####################################################################
# # Monthly Mapset files - US data
# # http://prism.nacse.org/docs/meta/ppt_realtime_monthly.htm gives
# # info on the projection information, etc.
# #####################################################################
# .PHONY: prism-us

# prism-dir:=prism.nacse.org/monthly

# define prism-fn
# ${prism-dir}/$1/$2/PRISM_$1_stable_$2$3_bil.zip
# endef

# define prism-climate
# $(warning prism-climate $1.$2)
# db/prism.climate::db/prism.climate.$1.$2
# db/prism.climate.$1.$2: $(call prism-fn,tmin,$1,$2) $(call prism-fn,tmax,$1,$2)  $(call prism-fn,ppt,$1,$2) $(call prism-fn,tmean,$1,$2) 
# 	zcat $(call prism-fn,tmin,$1,$2) > us_tmin_$1.$2
# 	zcat $(call prism-fn,tmax,$1,$2) > us_tmax_$1.$2
# 	zcat $(call prism-fn,ppt,$1,$2) > us_ppt_$1.$2
# 	zcat $(call prism-fn,tmean,$1,$2) > us_tmean_$1.$2
# 	${raster2pgsql} -F -s 4322 -C -r -d us_*_$1.$2 prism.temp | ${PG};
# 	${PG} -c "delete from prism.climate where year=$1 and month=$2; insert into prism.climate (year,month,tmin,tmax,ppt,tmean) select $1,$2,prism.us_to_template(tmin.rast,default_rast(),'${sampleType}'),prism.us_to_template(tmax.rast,default_rast(),'${sampleType}'),prism.us_to_template(ppt.rast,default_rast(),'${sampleType}'),prism.us_to_template(tmean.rast,default_rast(),'${sampleType}') from prism.temp tmin,prism.temp tmax,prism.temp ppt,prism.temp tmean where tmin.filename='us_tmin_$1.$2' and tmax.filename='us_tmax_$1.$2' and ppt.filename='us_ppt_$1.$2' and tmean.filename='us_tmean_$1.$2'";
# 	touch $$@
# 	rm -f us_*_$1.$2

# endef

# $(foreach y,${years},$(foreach m,${months},$(eval $(call prism-climate,$y,$m))))

# db/prism.avg:
# 	${PG} -c "set search_path=prism,public; select * from create_avg();"
# 	touch $@;