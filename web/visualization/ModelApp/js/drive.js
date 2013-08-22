app.drive = (function() {

	var MIME_TYPE = "application/vnd.ahb-3pg.run";
	var TREE_MIME_TYPE = "application/vnd.ahb-3pg.tree";
	var DRIVE_API_VERSION = "v2";

	var CLIENT_ID = "962079416283-mn2f8g2avn4t091f4chlfjac5juc5rmr.apps.googleusercontent.com";

	var OAUTH_SCOPES = 'https://www.googleapis.com/auth/drive.file '
			+ 'https://www.googleapis.com/auth/drive.install '
			+ 'https://www.googleapis.com/auth/userinfo.profile';

	var token = "";

	function init() {
		$("#google-login").modal({
			show : false
		});
		_createLoginBtn();

		$("#login-with-google").

		loadApi(function() {
			setInterval(function() {
				_checkToken();
			}, 1000 * 5 * 60);
		});

	}

	function _createLoginBtn() {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" data-toggle="dropdown">Login<b class="caret"></b></a>'
				+ '<ul class="dropdown-menu">'
				+ '<li><a id="login-with-google">Login with Google</a></li>'
				+ '</ul></li>')

		btn
				.find('#login-with-google')
				.on(
						'click',
						function() {
							$("#google-login").modal('hide');
							signIn(function(token) {
								$
										.ajax({
											url : "https://www.googleapis.com/oauth2/v1/userinfo",
											beforeSend : function(request) {
												request
														.setRequestHeader(
																"Authorization",
																'Bearer '
																		+ token.access_token);
											},
											success : function(data, status,
													xhr) {
												try {
													data = JSON.parse(data);
												} catch (e) {
												}

												_createLogoutBtn(data.name);

											},
											error : function() {
											}
										});
							});
						});

		$("#login-header").html("").append(btn);
	}

	function _createLogoutBtn(name) {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" data-toggle="dropdown">' + name
				+ '<b class="caret"></b></a>' + '<ul class="dropdown-menu">'
				+ '<li><a id="logout">Logout</a></li>' + '</ul></li>')

		btn.find('#logout').on('click', function() {
			token = null;
			_createLoginBtn();
		});

		$("#login-header").html("").append(btn);
	}

	// tokens expire, every once in awhile check the current token hasn't
	// if it has, then update
	function _checkToken() {
		if (!token)
			return;

		if (((parseInt(token.expires_at) * 1000) - new Date().getTime()) < 1000 * 60 * 20) {
			gapi.auth.authorize({
				client_id : CLIENT_ID,
				scope : OAUTH_SCOPES,
				// don't force the popup
				immediate : true
			}, function() {
				token = gapi.auth.getToken();
			});
		}
	}

	function checkSignedIn(callback) {
		if (!token)
			callback(false);
		gapi.auth.authorize({
			client_id : CLIENT_ID,
			scope : OAUTH_SCOPES,
			// don't force the popup
			immediate : true
		}, function() {
			token = gapi.auth.getToken();
			if (token != null)
				callback(true);
			else
				callback(false);
		});
	}

	function signIn(callback) {
		gapi.auth.authorize({
			client_id : CLIENT_ID,
			scope : OAUTH_SCOPES,
			// force the popup
			immediate : false
		}, function() {
			token = gapi.auth.getToken();
			// you can check if login was successful based on token
			callback(token);
		});
	}

	function getToken() {
		return token;
	}

	function loadApi(callback) {
		gapi.client.load("drive", DRIVE_API_VERSION, function() {
			callback();
		});
	}

	function listFiles(query, callback) {
		gapi.client.drive.files.list({
			q : query + " and trashed = false"
		}).execute(function(resp) {
			callback(resp);
		});
	}

	function getFileMetadata(id, callback) {
		gapi.client.drive.files.get({
			'fileId' : fileId
		}).execute(function(resp) {
			callback(resp);
		});
	}

	function getFile(id, downloadUrl, callback) {
		$.ajax({
			url : downloadUrl,
			beforeSend : function(request) {
				request.setRequestHeader("Authorization", 'Bearer '
						+ token.access_token);
			},
			success : function(data, status, xhr) {
				try {
					data = JSON.parse(data);
				} catch (e) {
				}

				callback(data, id);
			},
			error : function() {
				callback({
					error : true,
					message : "Failed to load file from Google Drive"
				});
			}
		});
	}

	function saveFile(name, description, mimeType, json, callback) {
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";

		var metadata = {
			'title' : name,
			'description' : description,
			'mimeType' : mimiType,
		// parents : [{id: folderId}] TODO
		};

		if (typeof json == 'object')
			json = JSON.stringify(json);
		var base64Data = btoa(json);
		var multipartRequestBody = delimiter
				+ 'Content-Type: application/json\r\n\r\n'
				+ JSON.stringify(metadata) + delimiter + 'Content-Type: '
				+ mimeType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n'
				+ '\r\n' + base64Data + close_delim;

		var request = gapi.client.request({
			'path' : '/upload/drive/v2/files',
			'method' : 'POST',
			'params' : {
				'uploadType' : 'multipart'
			},
			'headers' : {
				'Content-Type' : 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body' : multipartRequestBody
		});

		request.execute(function(resp) {
			if (resp.id)
				callback(resp);
			else
				callback({
					error : true,
					message : "Failed to save"
				});
		});
	}

	return {
		init : init,
		checkSignedIn : checkSignedIn,
		signIn : signIn,
		getToken : getToken,
		listFiles : listFiles,
		getFileMetadata : getFileMetadata,

		MIME_TYPE : MIME_TYPE
	}

})();