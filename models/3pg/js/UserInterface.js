/** this is an example of adding a toolbar menu**/



function go() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries;
  menuEntries = [
                  {name: "Model 4 Months", functionName: "runModel4"},
                  {name: "Model 5 Years", functionName: "runModel60"},
                  {name: "Model 10 Years", functionName: "runModel120"}];
  ss.addMenu("Action", menuEntries);
}


function runModel60(){
	m3PG.run(60);
} 

function runModel120(){
	m3PG.run(120);
}  

function runModel4(){
	m3PG.run(60);
}  
  
/** this function with use default value when user value not provided. Otherwhise NA? */
function defaultOrUser(defaultVal, userVal) {
  if (userVal == undefined || userVal==""){
   return defaultVal;
  } else {
    return userVal;
  }
}