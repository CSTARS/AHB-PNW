ahb.modelExport = (function(){

	var oauthConfig = {
			client_id: '962079416283-mn2f8g2avn4t091f4chlfjac5juc5rmr.apps.googleusercontent.com',
            scope: ['http://spreadsheets.google.com/feeds/','http://docs.google.com/feeds/'],
            response_type: 'token id_token'
	};
	
	var cKey = "";
	var oauthToken = null;
	var stage = 1;
	
	$(window).bind('weather-export-event', function(e, wdt, sdt, key){
		_onWeatherExport(wdt, sdt, key);
	});
	
	$(window).bind('query-map-event', function(e, ll, id){
		$('#export-3pg-advanced').html("Or visit the advanced 3PG Model tool for you " +
				"current location <a target='_blank' href='http://alder.bioenergy.casil.ucdavis.edu/3pgModel/app.html?ll="+ll.lat()+","+ll.lng()+"'>here.</a>");
	});
	
	function _onLoginComplete(stage, key) {
		if( stage == 1 ) {
			_resetBtn();
			$('#myModal').modal('show');
		} else {
			_getName(cKey);
		}
	}
	
	function init() {
		// see if the user is already logged into google
		// if so grab a token.  Otherwise, we will show the login button
		// when the popup shows
    	gapi.client.load('oauth2', 'v2', function(){
    		oauthConfig.immediate = true;
        	gapi.auth.authorize(oauthConfig, function(){
        		gapi.client.oauth2.userinfo.get().execute(function(resp) {
            		if (!resp.code) {
            			oauthToken = gapi.auth.getToken();
            			$.cookie('access_token', oauthToken.access_token);
            			$.cookie('token_type', oauthToken.token_type);
            			$("#login-here").hide();
            		}
            	});
        	});
    	});
		
		$("#weather-export-modal-btn").on('click', function(){
			_resetBtn();
			$('#modal-msg').html("");
			$('#myModal').modal('show');
			_getName(ckey);
		});

		$("#login-btn").on('click', function(){
			_login();
		});
		
		
		$("#spreadsheet-url-input").on("keyup change", function(){
			var url = $("#spreadsheet-url-input").val();
			if( url.length == 0 ) return $("#spreadsheet-key").html("");
			
			// if success, save the url in localstorage
			if(typeof(Storage)!=="undefined") {
			  localStorage.ss_url = url
			}
			
			var path = url.split("?");
			if( path.length == 1 ) {
				key = path;
			} else {
				path = path[1].split("&");
				for( var i = 0; i < path.length; i++ ) {
					var p = path[i].split("=");
					if( p[0] == "key" ) {
						key = p[1].replace(/#.*/,'');
						break;
					}
				}
			}
			
			$("#spreadsheet-key").html(key);
			
			if( cKey != key ) {
				cKey = key;
				_getName(key);
			}
		});
		
		$("#modal-help-link").on("click", function(){
			$("#modal-help").toggle('slow');
		});
		
		// load value from localstorage or url
		if( typeof(Storage)!=="undefined" ) {
			if( _getUrlVars()["key"] ) {
				$("#spreadsheet-url-input").val(_getUrlVars()["key"]);
				$("#spreadsheet-url-input").trigger("change");
			} else if( localStorage.ss_url ) {
				$("#spreadsheet-url-input").val(localStorage.ss_url);
				$("#spreadsheet-url-input").trigger("change");
			}
		}
	}
	
	function _getName(key) {
		if( oauthToken == null ) {
			_showError("You are not logged in.");
			return;
		}
		
		$.ajax({
			url  : 'rest/getSsName?key='+key,
			type : 'GET',
			success : function(resp){
				if( resp.success ) {
					$("#spreadsheet-name-row").show();
					$("#spreadsheet-date-row").show();
					$("#spreadsheet-name").html(resp.name);
					$('#modal-msg').html("");
				} else {
					$("#spreadsheet-name-row").hide();
					$("#spreadsheet-date-row").hide();
					_showError("Invalid Key<br />Make sure you have access to the spreadsheet.");
				}
			}, 
			error : function(resp) {
				$("#spreadsheet-name-row").hide();
				$("#spreadsheet-date-row").hide();
				_showError("Invalid Key<br />Make sure you have access to the spreadsheet.");
			}
		});
	}
	
	function _resetBtn() {
		$("#weather-export-btn").removeClass("disabled").html("Export");
	}
	
	function _onWeatherExport(wdt, sdt, key) {
		if( oauthToken == null ) {
			_showError("You are not logged in.");
			return;
		}
		
		var date = $("#spreadsheet-date").val();
		if( date == null || date == "" ) {
			_showError("Please provide a planted date");
			return;
		}

		if( $("#weather-export-btn").hasClass("disabled") ) return;
		$("#weather-export-btn").addClass("disabled").html("Exporting..");
		
		$.ajax({
			url  : 'rest/updateModel',
			type : 'POST',
			data : { 
				spreadsheetId : key, 
				table : wdt.toJSON(),
				date  : date,
				soil  : sdt.toJSON()
			},
			success : function(resp){
				if( resp.success ) {
					_showSuccess("Update Success!");
					setTimeout(function(){
						$('#myModal').modal('hide');
					},1000);
				} else {
					_showError("Update Failed<br />Make sure <b>Make sure you have access to the spreadsheet.");
				}
				_resetBtn();
			}, 
			error : function(resp) {
				_showError("Update Failed<br />Make sure <b>Make sure you have access to the spreadsheet.");
				_resetBtn();
			}
		});
	}
	
	function _showSuccess(msg) {
		$("#modal-help").hide('slow');
		$('#modal-msg').html("<div class='alert alert-success' style='text-align:center'>"+msg+"</div>");
	}
	
	function _showError(msg) {
		$("#modal-help").hide('slow');
		$('#modal-msg').html("<div class='alert alert-error' style='text-align:center'>"+msg+"</div>");
	}

    function _login() {
    	_signin(true, _userAuthed);
    }
	

    function _signin(mode, callback) {
    	oauthConfig.immediate = mode;
    	gapi.auth.authorize(oauthConfig, callback);
    }
	
    function _userAuthed() {
    	var request = gapi.client.oauth2.userinfo.get().execute(function(resp) {
    		if (!resp.code) {
    			oauthToken = gapi.auth.getToken();
    			$.cookie('access_token', oauthToken.access_token);
    			$.cookie('token_type', oauthToken.token_type);
    			$("#login-here").hide();
    			_onLoginComplete();
    		} else {
    			_signin(false, _userAuthed);
    		}
    	});
    }
    
    function _getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

	     
	
	return {
		init : init
	}

	
})();