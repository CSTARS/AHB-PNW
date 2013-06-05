/** this is an example of adding a toolbar menu**/

// this is required to be copied inside spreadsheet
// ie.. it cannot be side loaded
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries;
  menuEntries = [
                  {name: "Model 4 Months", functionName: "runModel4"},
                  {name: "Model 2 Years", functionName: "runModel24"},
                  {name: "Model 5 Years", functionName: "runModel60"},
                  {name: "Model 10 Years", functionName: "runModel120"}];
  ss.addMenu("Action", menuEntries);
}

function runModel4(){
    m3PG.run(4);
}  

function runModel24(){
    m3PG.run(24);
}  

function runModel60(){
	m3PG.run(60);
} 

function runModel120(){
	m3PG.run(120);
}  
  
/** this function with use default value when user value not provided. Otherwhise NA? */
function defaultOrUser(defaultVal, userVal) {
  if (userVal == undefined || userVal==""){
   return defaultVal;
  } else {
    return userVal;
  }
}


try {
  var source = UrlFetchApp.fetch("https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/InputOutput.js").getContentText();
  eval(source);
  
  source = UrlFetchApp.fetch("https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/Model3PG.js").getContentText();
  eval(source);
  
  source = UrlFetchApp.fetch("https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/SingleRunFunctions.js").getContentText();
  eval(source);

}catch (e){
  Logger.log(e);
}
  