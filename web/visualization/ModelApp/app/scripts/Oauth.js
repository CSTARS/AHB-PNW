define([], function () {
	// must install this for native phonegap support:
	// https://github.com/phonegap-build/ChildBrowser

  var win = null;

    /* the key for refresh Token in local Storage */
    var tokenKey = 'refresh_token';
        
    /* stores the accessToken after retrieval from google server */
    var accessToken = null;
                
    /* stores the Time when access token was last received from server */
    var accessTokenTime = null;
                
    /* stores access Token's Expiry Limit. Uses 58 min. instead of 60 min. */
    var accessTokenExpiryLimit = 58 * 60 * 1000;
                        
    /* A temporary variable storing callback function */
    var callbackFunc = false;
                
    // are we running native or browser mode?
    var isNative = window.location.href.match(/^file.*/) ? true : false;

	var CLIENT_ID = isNative ? 
						"344190713465-diimtferh4tjb03169bkl9mkoqvq2ru9.apps.googleusercontent.com" :
					 	"344190713465.apps.googleusercontent.com";

	var APP_ID = "344190713465";

	var OAUTH_SCOPES = 'https://www.googleapis.com/auth/drive.file '
			+ 'https://www.googleapis.com/auth/drive.install '
			+ 'https://www.googleapis.com/auth/userinfo.profile';

    /* config values for Google API (gapi) */
    var gapiConfig = {
    	endpoint: "https://accounts.google.com/o/oauth2/auth",
      endtoken: "https://accounts.google.com/o/oauth2/token", // token endpoint
    	redirect_uri : "http://localhost",
    	client_secret : '6rOQ9l0fynh137MRXGK-G_Zg',
    	response_type : "code",
    	client_id : CLIENT_ID,
    	state : "gdriveinit",
    	access_type : "offline",
    	scope : OAUTH_SCOPES,

    	/* As defined in the OAuth 2.0 specification, this field must contain a value 
         * of "authorization_code" or "refresh_token" */                        
        grantTypes: { AUTHORIZE: "authorization_code", REFRESH: "refresh_token" },
   	};
                
    /** 
     * Enum for Status values
     * 
     * @enum {number}
     *  
     * SUCCESS - Successfully data received from server
     * ERROR - Error occurred when trying to receive from server
     * NOT_DETERMINED - undetermined
     */
    var status = { 
            SUCESS: 1, 
            ERROR: -1, 
            NOT_DETERMINED: 0 
    }
                
    requestStatus = 0;
    
    /* stores the authorization Code internally */
    authCode = false;
    
    /* stores the error message when an error happens from google server */
    errorMessage = false;
    
    var log = function(msg) {
    	console.log("***OAUTH***: "+msg);
    }

    /**
     * Attempts to authorize user using OAuth
     * Opens up Another window where user allows access or denies it.
     *  
     * @param {function} callBack   A callback function which is invoked
     */
    var authorize = function(callBack) {
    	log("attempting to authorize");
        
        var authUri = gapiConfig.endpoint + '?' 
        + 'scope=' + encodeURIComponent(gapiConfig.scope) 
        + '&' + 'redirect_uri=' + encodeURIComponent(gapiConfig.redirect_uri) 
        + '&' + 'response_type=' + encodeURIComponent(gapiConfig.response_type) 
        + '&' + 'client_id=' + encodeURIComponent(gapiConfig.client_id);
        //+ '&' + 'state=' + encodeURIComponent(gapiConfig.state)
        //+ '&' + 'access_type=' + encodeURIComponent(gapiConfig.access_type)
        //+ '&' + 'approval_prompt=force'; // @TODO - check if we really need this param
        
        callbackFunc = callBack;
        requestStatus = status.NOT_DETERMINED;
        
 


        log("opening InAppBrowser");

        try {

			    // Now open new browser
          win = window.open(authUri, '_blank', 'location=no,toolbar=no');

          $(win).on('loadstart',function(e){
            log("InAppBrowser loadstart");
            console.log(e.originalEvent.url);
            onAuthUrlChange(e.originalEvent.url);
          });

        	//window.plugins.childBrowser.showWebPage(authUri, {showLocationBar : true});                 
        	//window.plugins.childBrowser.onClose = onAuthClose;                
        	//window.plugins.childBrowser.onLocationChange = onAuthUrlChange;  
        } catch(e) {
          log("Error opening InAppBrowser");
        	log(e);
        }
                  
    };

    if( !isNative ) {
    	authorize = function(callback, immediate) {
			gapi.auth.authorize({
				client_id : CLIENT_ID,
				scope : OAUTH_SCOPES,
				immediate : immediate
			}, function() {
				authCode = gapi.auth.getToken();
				callback(authCode);
			});

    	}
    }
        
    /* Auth Window closed */
    var onAuthClose = function() {
            //console.log("Auth window closed");
    };
    
    /* OAuth Successfully done */
    var onAuthSuccess = function() {
            //console.log('Auth Success?');
    };
                
    /** 
     * Gets Invoked when the URL changes on OAuth authorization process 
     * 
     * Success URL Pattern: 
     * "redirect_uri" + "?code=" [secret code val]
     *  
     * Success Sample URL: 
     * http://localhost/?code=4/WOpRLQfvvhHE0tuMUDDqnn76lCTT.8nXC4IebMEAUuJJVnL49Cc8AQGr8cQI
     * 
     * Denied Access URL Pattern: "redirect_uri" + ?error=access_denied
     * Denied Access Sample: http://localhost/?error=access_denied
     * 
     * @param {string} uriLocation The URI Location 
     */
    var onAuthUrlChange = function(uriLocation) {
        console.log("InAppBrowser url changed "+uriLocation);
        if(uriLocation.indexOf("code=") != -1) {
            requestStatus = status.SUCCESS;
                    
            /* Store the authCode temporarily */
            authCode = getParameterByName("code", uriLocation);
            log("Found auth code: "+authCode);
            
            getRefreshToken(callbackFunc);
                    
            // close the childBrowser
            win.close();
        } else if(uriLocation.indexOf("error=") != -1)  {
            requestStatus = status.ERROR;                            
            errorMessage = getParameterByName("error", uriLocation);
            callbackFunc();
            win.close();
        } else {
            requestStatus = status.NOT_DETERMINED;
            //callbackFunc();
        }
	};
           
           
   /**
    * Gets the Refresh from Access Token. This method is only called internally, 
    * and once, only after when authorization of Application happens.
    * 
    * @param paramObj An Object containing authorization code
    * @param paramObj.auth_code The Authorization Code for getting Refresh Token 
    * 
    * @param {Function} callback callback function which is to be invoked after
    *                            successful retrieval of data from google's server
    *
    */
    var getRefreshToken = function(callback) {
    	console.log("access refresh token");
       $.ajax({
              type: "POST",
              url: gapiConfig.endtoken,
              data: {
                       client_id    : gapiConfig.client_id,
                       client_secret: gapiConfig.client_secret,        
                       code         : authCode,
                       redirect_uri : gapiConfig.redirect_uri,
                       grant_type   : gapiConfig.grantTypes.AUTHORIZE                                  
               }
        })
        .done(function(data) {
        		console.log("success getting refresh token");

            /* upon sucess, do a callback with the data received */
            // temporary storing access token
            accessToken     = data.access_token;
            accessTokenTime = (new Date()).getTime();

            // set the token for the js api
            gapi.auth.setToken(data);

            /* set the error of data to false, as it was successful */
            data.error = false;
            
		        window.localStorage.setItem(tokenKey, data.refresh_token);

            /* now invoke the callback */
            callback({access_token: accessToken});
        })
        .fail(function(xhr, textStatus) {
                callback({
                        error: true,
                        message: xhr.responseText
                });
        })
        .always(function() { 
                //console.log("Token request complete"); 
        });                   
    };

    if( !isNative ) {
    	getRefreshToken = function(callback) {
			gapi.auth.authorize({
				client_id : CLIENT_ID,
				scope : OAUTH_SCOPES,
				immediate : true
			}, function() {
				token = gapi.auth.getToken();
				if( callback ) callback(token);
			});
    	}
    }
           
           
   /**
    * This method should ONLY be called locally from within this class. 
    * Returns the Refresh Token from the local database.
    * 
    * @return {String} The refresh Token
    *  
    */
    var getToken = function() {
        return window.localStorage.getItem(tokenKey);
    };
           
           
   /**
    * This method is invoked externally. It retrieves the Access Token by at first
    * checking if current access token has expired or not. If its not expired, it
    * simply returns that, otherwise, it gets the refresh Token from the local database 
    * (by invoking getToken) and then connecting with Google's Server (using OAuth) 
    * to get the Access Token.
    * 
    * @param {Function} callback   A callBack function which is to be invoked after
    *                             data is retrieved from the google's server. The data
    *                             from google server is passed to callback as args.
    * 
    */
    var getAccessToken = function(callback) {
       var currentTime = (new Date()).getTime();           
       
       console.log("getting access token");
       
       /* check if current Token has not expired (still valid) */
       if (accessToken && accessToken != false && 
               currentTime < (accessTokenTime + accessTokenExpiryLimit)) {
               callback({ access_token: accessToken });
                       
               return;
       }

       console.log("ACCESS TOKEN PARAMS: "+accessToken+" "+accessTokenTime+" "+accessTokenExpiryLimit);

       /* else, get the refreshToken from local storage and get a new access Token */
       var refreshToken = getToken();
       
       //   console.log("Refresh Token >> " + refreshToken);
       $.ajax({
              type: "POST",
              url: gapiConfig.endtoken,
              data: {
                      client_id    : gapiConfig.client_id,
                      client_secret: gapiConfig.client_secret,        
                      refresh_token: refreshToken,
                      grant_type   : gapiConfig.grantTypes.REFRESH,                                                  
              }
        })
        .done(function(data) {
                /* upon sucess, do a callback with the data received */
                // temporary storing access token
                accessToken = data.access_token;
                accessTokenTime = (new Date()).getTime();

                // set the token for the js api
                gapi.auth.setToken(data);
                
                /* set the error to false */
                data.error = false;
                callback(data);
               })
        .fail(function(xhr, textStatus) {
                console.log("Token request error ?? >>" + xhr.responseText);
                callback({
                        error: true,
                        message: xhr.responseText
                });
        })
        .always(function() { //console.log("Token request complete"); 
        });                           
    };

    if( !isNative ) {
    	getAccessToken = function(callback) {
	       var currentTime = (new Date()).getTime();           

	       if (accessToken && 
	               currentTime < (accessTokenTime + accessTokenExpiryLimit)) {
	               callback(accessToken);
	                       
	               return;
	       }

    		gapi.auth.authorize({
				client_id : CLIENT_ID,
				scope : OAUTH_SCOPES,
				immediate : true
			}, function() {
				token = gapi.auth.getToken();
				accessToken = token;
				accessTokenTime = (new Date()).getTime();
				if( callback ) callback(token);
			});
    	}
    }     
           
           
           
   /**
    * Saves the Refresh Token in a local database or localStorage
    * This method shall be invoked from externally only <b>once</b> after an 
    * authorization code is received from google's server. This method 
    * calls the other method (getRefreshToken) to get the refresh Token and
    * then saves it locally on database and invokes a callback function
    * 
    * @param tokenObj A Object containing authorization code
    * @param {String} tokenObj.auth_code The authorization code from google's server
    * 
    * @param {Function} callback The function to be invoked with parameters
    */
    var saveRefreshToken = function(tokenObj, callback) {
	       getRefreshToken(tokenObj, function(data) {

	               /* if there's no error */
	               if (!data.error) {
	                      // @TODO: make another method saveToken to abstract the storing of token
	                  window.localStorage.setItem(tokenKey, data.refresh_token);
	               }
	               callback(data);
	       });
    };
           
           
           
   /**
    * Checks if user has authorized the App or not
    * It does so by checking if there's a refresh_token
    * available on the current database table.
    * 
    * @return {Boolean} true if authorized, false otherwise
    */
    var isAuthorized = function(callback) {
          var tokenValue = window.localStorage.getItem(tokenKey);
          
          callback(((tokenValue !== null) && (typeof tokenValue !== 'undefined')));  
    };

    if( !isNative ) {
    	isAuthorized = function(callback) {
    		gapi.auth.authorize({
				client_id : CLIENT_ID,
				scope : OAUTH_SCOPES,
				immediate : true
			}, function() {
				token = gapi.auth.getToken();
				if( callback ) callback(token);
			});
    	}
    }
           
           
   /**
    * Extracts the code from the url. Copied from online
    * @TODO needs to be simplified. 
    *  
    * @param name The parameter whose value is to be grabbed from url 
    * @param url  The url to be grabbed from.
    * 
    * @return Returns the Value corresponding to the name passed 
    */
   var getParameterByName = function(name, url) {
      name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
      var regexS = "[\\?&]" + name + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(url);
      
      if(results == null) {
        return false;
      }
      else 
        return decodeURIComponent(results[1].replace(/\+/g, " "));
    };
	                        

	return {
		authorize : authorize,
		isAuthorized : isAuthorized,
		getAccessToken : getAccessToken,
    APP_ID : APP_ID
	}

});