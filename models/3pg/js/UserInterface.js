/** this is an example of adding a toolbar menu**/
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries;
  menuEntries = [
                  {name: "Model 4 Months", functionName: "runModel4"},
                  {name: "Model 5 Years", functionName: "runModel60"},
                  {name: "Model 10 Years", functionName: "runModel120"}];
  ss.addMenu("Action", menuEntries);
}


function runModel60(){
  runModel(60);
} 

function runModel120(){
  runModel(120);
}  

function runModel4(){
  runModel(4);
}  
  
/** this function with use default value when user value not provided. Otherwhise NA? */
function defaultOrUser(defaultVal, userVal) {
  if (userVal == undefined || userVal==""){
   return defaultVal;
  } else {
    return userVal;
  }
}

//NODE EXPORT HOOK
if (typeof module !== 'undefined' && module.exports) {
  exports.dump = function() {
    var functions = "";
    var fList = ["defaultOrUser", "runModel4", "runModel120", "runModel60", "onOpen"];
    
    for( var i = 0; i < fList.length; i++ ) {
      functions += eval('('+fList[i]+'.toString())');
    }
    return functions;
  }
}