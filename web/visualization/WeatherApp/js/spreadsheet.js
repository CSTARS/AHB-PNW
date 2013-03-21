AHB.spreadsheet = (function(){
	
	function init() {
		//var scope = 'http://docs.google.com/feeds/';
		var scope = 'http://drive.google.com/feeds/';
		  if (google.accounts.user.checkLogin(scope)) {     
		    var service = new google.gdata.client.GoogleService('writely', 'DocList-App-v1.0');   
		    service.getFeed(scope + 'documents/private/full/', handleFeed, handleError);  
		  } else {  
		    var token = google.accounts.user.login(scope); // can ignore returned token  
		  } 
	}
	
	return {
		init : init
	}
	
})();