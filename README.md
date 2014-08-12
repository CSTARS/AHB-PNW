## Repo Layout ##
- **database:** schemas, makefiles for various backends
  - **afri:**
  - **prism:**
  - **public_view:**
  - **statsgo:**
  - **to_bcam:**
- **models:** code for various models
  - **3pg:** 3PG model code.  Contains the core js library, plv8js wrappers, and postgres tests
  - **data:** 3PG validation data for various locations.
  - **data_harvest:** NodeJS web scrapper for helioclim data cause the site doesn't have any nice export functionality
  - **gbsm:**
  - **radiation:** Node script for calculating extraterrestrial radiation for a given point on a given day of year
- **web:** stuff for the interwebs
  - **visualization:** online visualizations app
    - **KmlGenerator:** creates a KML 3D visualization of poplar growth based on alder db (kinda out of place here)
    - **ModelApp:** 3PG Model Application (poplarmodel.org).  Online application for running the 3PG Model.
    - **WeatherApp:** 3PG Data Application (data.poplarmodel.org).  Online application for visualizating precooked alder db data.  For historical reasons dir is called 'WeatherApp'.
    - **test:**


## Online Application Location ##
3PG Data App:
http://data.poplarmodel.org

3PG Model App:
http://poplarmodel.org
