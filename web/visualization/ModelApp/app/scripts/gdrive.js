define(["require","Oauth","gdriveRT"],function(require) {

	var MIME_TYPE = "application/vnd.ahb-3pg.run";
	var TREE_MIME_TYPE = "application/vnd.ahb-3pg.tree";
	var DRIVE_API_VERSION = "v2";

	var Oauth, gdriveRT;

	// google oauth access token
	var token = "";
	
	// currently loaded gdrive file id
	var loadedFile = null;
	// list of currently loaded files (metadata)
	var fileList = [];
	// google drive share client
	var client = null;

	// loaded tree and management
	var loadedTree = null;
	// list of currently loaded tree files (metadata)
	var treeList = [];

	// current MIME TYPE we are saving
	var saveMimeType = "";

	/***
	 *	Initialize google drive panels, btns and login  
	 ***/
	function init(callback) {
		Oauth = require("Oauth");
		gdriveRT = require("gdriveRT");

		// init bootstrap modal
		$("#save-modal").modal({
			show : false
		});

		// init bootstrap modal
		$("#load-modal").modal({
			show : false
		});

		// the about modal link is created below, so why not...
		$("#about-modal").modal({
			show : false
		});

		// the about modal link is created below, so why not...
		$("#help-modal").modal({
			show : false
		});
		
		// set the 'update' btn click handler
		$("#save-update-btn").on('click', function() {
			_updateCurrentFile();
		});
		
		// set the 'new' btn click handler
		$("#save-new-btn").on('click', function() {
			_saveNewFile();
		});
		
		// create the top right menu
		_createLoginBtn();

		// load the google auth and drive api's
		_loadApi(function() {
			// if the user is authorized grab the refresh token
			Oauth.isAuthorized(function(refreshToken){
				// if there is no refresh token, leave, we are initialized
				if( !refreshToken ) return callback();

				// if we have a refesh token, then user is all set,
				// get a new access token so we can start using the api's
				// grab their information and display 
				Oauth.getAccessToken(function(t){
					token = t;
					if( token ) _setUserInfo();
					callback();
				});
			});
			
			// check if access token has expired
			setInterval(function() {
				_checkToken();
			}, 1000 * 5 * 60);
		});

		// setup the tree 'share' btn
		$("#share-tree-btn").on('click', function(){
			// see if we have a share client
			if( client == null ) {
				// no client, load api
				gapi.load('drive-share', function(){
					// on load, show the share popup with the current tree
				 	client = new gapi.drive.share.ShareClient(Oauth.APP_ID);
		    		client.setItemIds([loadedTree]);
				 	client.showSettingsDialog();
				 });
			} else {
				// we have a client, show the share popup with current tree
				client.setItemIds([loadedFile]);
			 	client.showSettingsDialog();
			}
		});

	}

	/***
	 * Save the current model as a new google drive file
	 ***/
	function _saveNewFile() {
		ga('send', 'event', 'ui', 'interaction', 'save-drive-file', 1);

		// grab the name of the new file
		var name = $("#save-name-input").val();
		if( name.length == 0 ) { // we always want a name, alert and quit
			_setSaveMessage('Please provide a filename.','info');
			return;
		}
		
		// see what kind of file we are creating based on the saveMimeType var
		if( saveMimeType == MIME_TYPE ) {
			data = m3PGIO.exportSetup();
		} else if ( saveMimeType == TREE_MIME_TYPE ) {
			data = m3PGIO.exportSetup().tree;
		} else { // badness
			alert("Unknown MIME_TYPE: "+saveMimeType);
			return;
		}

		// set the user know what we are doing
		_setSaveMessage('<i class="icon-spinner icon-spin"></i> Saving File...','info');

		// save the file
		saveFile(name,
				$("#save-description-input").val(),
				saveMimeType, 
				data, 
				function(resp) {
					// let the user know what happened
					if( resp.error ) return _setSaveMessage('Failed to save to Google Drive :(','danger');
					else _setSaveMessage('Sucessfully saved.','success');

					// wait a tick to hide the popup, so user sees success message
					setTimeout(function(){
						$("#save-modal").modal('hide');
					},1500);

					// show the share btn
					if( saveMimeType == MIME_TYPE ) {
						// we have a new file, update our list
						_updateFileList();

						// show the share btns
						$("#share-btn").parent().show();
						$("#open-in-drive").attr("href","https://docs.google.com/file/d/"+resp.id).parent().show();

						// set the loaded file id
						loadedFile = resp.id;
					} else if ( saveMimeType == TREE_MIME_TYPE ) {
						// we have a new tree, update the list
						_updateTreeList();

						// show the tree share btns
						$("#share-tree-btn").show();
						$("#loaded-tree-name").html(name).parent().show();

						// set the loaded trees
						loadedTree = resp.id;
					}
				}
		);
	}

	/***
	 * Update the currently loaded google drive file
	 ***/
	function _updateCurrentFile() {
		ga('send', 'event', 'ui', 'interaction', 'update-drive-file', 1);

		// let the user know what we are doing
		_setSaveMessage('<i class="icon-spinner icon-spin"></i> Updating...','info');

		var file = {};
		var data = {};

		// grab the corrent data and fileid based on mimeType
		if( saveMimeType == MIME_TYPE ) {
			file = loadedFile;
			data = m3PGIO.exportSetup();
		} else if ( saveMimeType == TREE_MIME_TYPE ) {
			file = loadedTree;
			data = m3PGIO.exportSetup().tree;
		} else { // badness
			alert("Unknown MIME_TYPE: "+saveMimeType);
			return;
		}

		// update the google drive file
		updateFile(file, 
				data, 
				function(resp){
					// let the user know what happened
					if( resp.error ) return _setSaveMessage('Failed to update on Google Drive :(','danger');
					else _setSaveMessage('Update Successful.','success');

					// wait a tick so the user knows update was success
					setTimeout(function(){
						$("#save-modal").modal('hide');
					},1500);
					
					// update the list for whatever type was updated
					if( saveMimeType == MIME_TYPE ) {
						_updateFileList();
					} else if ( saveMimeType == TREE_MIME_TYPE ) {
						_updateTreeList();
					}
				}
		);
	}

	/***
	 * set a message for the 'load from drive' popup.
	 *  type - boostrap alert type
	 ***/
	function _setLoadMessage(msg, type) {
		if( !msg ) return $("#gdrive-file-msg").html("");
		$('#gdrive-file-msg').html('<div class="alert alert-'+type+'">'+msg+'</div>');
	}

	/***
	 * set a message for the 'save to drive' popup
	 * type - boostrap alert type
	 ***/
	function _setSaveMessage(msg, type) {
		if( !msg ) return $("#gdrive-save-msg").html("");
		$('#gdrive-save-msg').html('<div class="alert alert-'+type+'">'+msg+'</div>');
	}

	/***
	 * create the top right menu. This menu is for when the user is not logged in
	 ***/
	function _createLoginBtn() {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" style="cursor:pointer">Login<b class="caret"></b></a>'
				+ '<ul class="dropdown-menu">'
				+ '<li><a id="help"><i class="icon-question-sign"></i> Help</a></li>'
				+ '<li><a id="about"><i class="icon-info-sign"></i> About</a></li>'
				+ '<li><a id="login-with-google"><i class="icon-signin"></i> Login with Google</a></li>'
				+ '</ul></li>');

		// set click handlers for popup
		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		// about click handler
		btn.find('#about').on('click', function() {
			btn.toggleClass('open');
			$("#about-modal").modal('show');
		});

		btn.find('#help').on('click', function() {
			btn.toggleClass('open');
			showHelp();
		});

		// login click handler
		btn.find('#login-with-google').on('click',function() {
			ga('send', 'event', 'ui', 'interaction', 'user-login', 1);
			btn.toggleClass('open');
			signIn(function(token) {
				_setUserInfo();
			});
		});

		// add menu
		$("#login-header").html("").append(btn);
	};
	
	/***
	 * Create the top right menu for when the user is logged in
	 ***/
	function _createLogoutBtn(userdata) {
		// set btn html
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" style="cursor:pointer"><img class="img-rounded" src="'+userdata.picture
				+ '" style="margin:-5px 5px -5px 0;width:28px;height:28px;border:1px solid white" /> ' + userdata.name
				+ '<b class="caret"></b></a>' + '<ul class="dropdown-menu">'
				+ '<li><a id="save"><i class="icon-cloud-upload"></i> Save Model</a></li>'
				+ '<li style="display:none"><a id="share-btn"><i class="icon-share"></i> Share Model</a></li>'
				+ '<li style="display:none"><a id="open-in-drive" target="_blank"><i class="icon-external-link-sign"></i> Open in Google Drive</a></li>' 
				+ '<li><a id="load"><i class="icon-cloud-download"></i> Load Model</a></li>'
				+ '<li><a id="help"><i class="icon-question-sign"></i> Help</a></li>' 
				+ '<li><a id="about"><i class="icon-info-sign"></i> About</a></li>' 
				+ '<li><a id="logout"><i class="icon-signout"></i> Logout</a></li>' 
				+ '</ul></li>');
		
		// add click handler to show menu
		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		// show the save popup
		btn.find('#save').on('click', function() {
			// set the current save mimeType
			saveMimeType = MIME_TYPE;

			// let the user know what typ they are saving
			$("#gdrive-save-subheader").html("<h5>Save Model</h5>");

			btn.toggleClass('open');

			// if the file is loaded, show the update panel
			if( loadedFile != null) {
				// grab the current files metadata
				var file = {};
				for( var i = 0; i < fileList.length; i++ ) {
					if( fileList[i].id == loadedFile) {
						file = fileList[i];
						break;
					}
				}

				// show the update panel
				$("#save-update-panel").show();

				// render the files metadata in the update panel
				var d = new Date(file.modifiedDate);
				$("#save-update-panel-inner").html("<b>"+file.title+"</b><br />" +
					  "<span style='color:#888'>"+file.description+"</span><br />"+
					  "<span style='font-style:italic;font-size:11px;'>Last Modified: " + 
					  d.toDateString()+" "+d.toLocaleTimeString()+" by "+file.lastModifyingUserName+"</span><br />"+
					  "<a href='https://drive.google.com/file/d/"+file.id+"'' target='_blank'><i class='icon-link'></i> " +
					  "Link to Share</a> <span style='color:#888'>(must have permission)</span><br /><br />");
			} else {
				$("#save-update-panel").hide();
			}
			
			// clear any message
			_setSaveMessage(null);

			// show the save popup
			$("#save-modal").modal('show');
		});

		// click handler for share btn
		btn.find("#share-btn").on('click', function(){
			ga('send', 'event', 'ui', 'interaction', 'open-drive-share', 1);

			// has the share client been loaded
			if( client == null ) {
				// load the share popup
				gapi.load('drive-share', function(){
					// create and show the share popup
				 	client = new gapi.drive.share.ShareClient(Oauth.APP_ID);
		    		client.setItemIds([loadedFile]);
				 	client.showSettingsDialog();
				 });
			} else {
				// show the share popup
				client.setItemIds([loadedFile]);
			 	client.showSettingsDialog();
			}
		});
		
		// show about panel
		btn.find('#about').on('click', function() {
			btn.toggleClass('open');
			$("#about-modal").modal('show');
		});

		btn.find('#help').on('click', function() {
			btn.toggleClass('open');
			showHelp();
		});

		// show the 'load from drive' panel
		btn.find('#load').on('click', function() {
			btn.toggleClass('open');

			// hide any existing message
			_setLoadMessage(null);

			// render the model files in the popup files 
			_showDriveFiles();

			// show the modal
			$("#load-modal").modal('show');
		});

		// load the user out				
		btn.find('#logout').on('click', function() {
			ga('send', 'event', 'ui', 'interaction', 'user-logout', 1);

			btn.toggleClass('open');

			// kill the access token
			token = null;

			// update the menu panel
			_createLoginBtn();
		});

		// attach the menu
		$("#login-header").html("").append(btn);
	};

	/***
	 *	Request the user's information.  When loaded, update the top right menu
	 ***/
	function _setUserInfo() {
		// load user name
		$.ajax({
			url : "https://www.googleapis.com/oauth2/v1/userinfo",
			beforeSend : function(request) {
				// always set your access stoken
				request.setRequestHeader("Authorization",'Bearer '+ token.access_token);
			},
			success : function(data, status,xhr) {
				// parse your json response
				try {
					data = JSON.parse(data);
				} catch (e) {}

				// update top right menu
				_createLogoutBtn(data);
				
				// set to window scope
				window.userinfo = data;
			},
			error : function() {
				// TODO: should we alert this?
			}
		});
		
		// load user files, trees
		_updateFileList();
		_updateTreeList();
	}
	
	/***
	 *	Search for the users models
	 *
	 * TODO: add search to the following functions,
	 *  limit to 10 results
	 ***/
	function _updateFileList() {
		listFiles("mimeType = '"+MIME_TYPE+"'", function(resp){
			fileList = resp.result.items;
		});
	}

	/***
	 *	Search for the users trees
	 *
	 * TODO: add search to the following functions,
	 *  limit to 10 results
	 ***/
	function _updateTreeList() {
		listFiles("mimeType = '"+TREE_MIME_TYPE+"'", function(resp){
			treeList = resp.result.items;
		});
	}

	/***
	 *	Render the users current models onto the 'load from drive' popup
	 ***/
	function _showDriveFiles() {
		// if they have no files, say so and get out of here
		if( !fileList ) return $("#gdrive-file-list").html("<li>No Files</li>");
		if( fileList.length == 0 ) return $("#gdrive-file-list").html("<li>No Files</li>");

		// show a title, there are multiple types that can be loaded from drive
		$("#gdrive-file-list").html("<h4>Select File</h4>");

		// create the list elements for each files metadata
		for( var i = 0; i < fileList.length; i++ ) {
			var item = fileList[i];
			var d = new Date(item.modifiedDate);
			$("#gdrive-file-list").append(
				$("<li class='list-group-item'><a id='"+item.id+"' url='"+item.downloadUrl+"' style='cursor:pointer'><i class='icon-file'></i> "+item.title+"</a>" +
				  "<div style='color:#888;padding: 5px 0 0 10px'>"+item.description+"</div>"+
				  "<div style='font-style:italic;font-size:11px;padding-left:10px'>Last Modified: "+d.toDateString()+" "+d.toLocaleTimeString()+" by "+item.lastModifyingUserName+"<div></li>"
				  )
			);
		}
		
		// add click handler for each file
		$("#gdrive-file-list a").on('click', function(){
			ga('send', 'event', 'ui', 'interaction', 'load-drive-model', 1);

			var id = $(this).attr("id");

			// let the user know what we are doing
			_setLoadMessage('<i class="icon-spinner icon-spin"></i> Loading File...','info');

			// grab the five from drive
			getFile(id, $(this).attr("url"), function(file) {
				// if badness, let the user know
				if( !file  ) return _setLoadMessage('Failed to load file from Google Drive :(','danger');
				if( file.error  ) return _setLoadMessage('Failed to load file from Google Drive :(','danger');

				// hide any loaded trees,
				$("#share-tree-btn").hide();
				$("#loaded-tree-name").html("").parent().hide();
				loadedTree = null;

				// let the user know we are all good
				_setLoadMessage('File Loaded.','success');

				// set the loaded file id
				loadedFile = id;					

				// set the loaded file name
				for( var i = 0; i < fileList.length; i++ ) {
					if( id == fileList[i].id ) {
						$("#loaded-model-title").html("<span style='color:#333'>Loaded Model </span> "+fileList[i].title);
					}
				}

				// show the share btn
				$("#share-btn").parent().show();
				$("#open-in-drive").attr("href","https://docs.google.com/file/d/"+id).parent().show();

				// setup model
				m3PGIO.loadSetup(id, file);

				// setup realtime events
				gdriveRT.initRtApi(loadedFile);
				
				// wait a tick so user can see success message
				setTimeout(function(){
					// hide the modal
					$("#load-modal").modal('hide');
				},1500);

			});
		});
	}
	
	/***
	 *	Render the users current trees onto the 'load from drive' popup
	 ***/
	function _showTreeFiles() {
		// update the list header, let user know what they are selecting
		$("#gdrive-file-list").html("");
		$("#gdrive-file-list").append($("<li class='list-group-item'><h5>Select Tree</h5></li>"));

		// if there are no trees, say so and get out of here
		if( !treeList ) return $("#gdrive-file-list").append($("<li class='list-group-item'>No Trees Available</li>"));
		if( treeList.length == 0 ) return $("#gdrive-file-list").append($("<li class='list-group-item'>No Trees Available</li>"));

		// create the tree list elements
		for( var i = 0; i < treeList.length; i++ ) {
			var item = treeList[i];
			var d = new Date(item.modifiedDate);
			$("#gdrive-file-list").append(
				$("<li class='list-group-item'><a id='"+item.id+"' name='"+item.title+"' url='"+item.downloadUrl+"' style='cursor:pointer'><i class='icon-leaf'></i> "+item.title+"</a>" +
				  "<div style='color:#888;padding: 5px 0 0 10px'>"+item.description+"</div>"+
				  "<div style='font-style:italic;font-size:11px;padding-left:10px'>Last Modified: "+d.toDateString()+" "+d.toLocaleTimeString()+" by "+item.lastModifyingUserName+"<div></li>"
				  )
			);
		}
		
		// add click handler for titles
		$("#gdrive-file-list a").on('click', function(){
			ga('send', 'event', 'ui', 'interaction', 'load-drive-tree', 1);

			var id = $(this).attr("id");
			var name = $(this).attr("name");

			// tell the user we are loading
			_setLoadMessage('<i class="icon-spinner icon-spin"></i> Loading Tree...','info');

			// load file from drive
			getFile(id, $(this).attr("url"), function(file) {
				// if badness, let user know
				if( !file  ) return _setLoadMessage('Failed to load tree from Google Drive :(','danger');
				if( file.error  ) return _setLoadMessage('Failed to load tree from Google Drive :(','danger');

				// show the tree sharing btns
				$("#share-tree-btn").show();
				$("#loaded-tree-name").html(name).parent().show();

				// let the user know we are succesfull
				_setLoadMessage('Tree Loaded.','success');

				// set the loaded tree id
				loadedTree = id;					

				// loaded tree into model / UI
				m3PGIO.loadTree(file);
				
				// wait a sec so user can see success message
				setTimeout(function(){
					$("#load-modal").modal('hide');
				},1500);

			});
		});
	}

	/***
	 *	show the user the load tree popup
	 ***/
	function showLoadTreePanel() {
		// render the trees into the popup list
		_showTreeFiles();
		// clear any messages
		_setLoadMessage(null);
		// show the popup
		$("#load-modal").modal('show');
	}

	/***
	 *	show the user the save tree popup
	 ***/
	function showSaveTreePanel() {
		// set the current mimeType we are saving
		saveMimeType = TREE_MIME_TYPE;

		// set the header so user knows what type they are saving
		$("#gdrive-save-subheader").html("<h5>Save Tree</h5>");

		// if there is a current tree, show the update panel
		if( loadedTree != null) {
			// find the current tree based on id
			var tree = {};
			for( var i = 0; i < treeList.length; i++ ) {
				if( treeList[i].id == loadedTree) {
					tree = treeList[i];
					break;
				}
			}

			// show the update panel
			$("#save-update-panel").show();

			// render tree metadata on update panel
			var d = new Date(tree.modifiedDate);
			$("#save-update-panel-inner").html("<b>"+tree.title+"</b><br />" +
				  "<span style='color:#888'>"+tree.description+"</span><br />"+
				  "<span style='font-style:italic;font-size:11px;'>Last Modified: " + 
				  d.toDateString()+" "+d.toLocaleTimeString()+" by "+tree.lastModifyingUserName+"</span><br />"+
				  "<a href='https://drive.google.com/file/d/"+tree.id+"'' target='_blank'><i class='icon-link'></i> Open in Google Drive</a>");
		} else {
			// don't show the update panel, this is a new tree
			$("#save-update-panel").hide();
		}
		
		// clear any message
		_setSaveMessage(null);

		// show the popup
		$("#save-modal").modal('show');
	}

	/***
	 * Load a model based on passed id.  This function is really only for loading model on start, when a file id
	 * has been passed in the url either from google drive or from the ?file=id url.
	 ***/
	var loginModalInit = false;
	function load(id, loadFn) {
		// if we don't have an access token, we need to sign in first
		// TODO: if this is a public file, there is no reason to sign in... solution?
		if( !token ) {

			if( !loginModalInit ) {
				$('#google-modal-login').on('click', function(){
					// sign the user in (force oauth popup)
					signIn(function(token) {
						$('#login-modal').modal('hide');

						// set the user information in top left
						_setUserInfo();

						if( loadFn ) loadFn();

						getFileMetadata(id, function(metadata){
							getFile(id, metadata.downloadUrl, function(file) {
								_onInitFileLoaded(metadata,file);
							});
						});
						
					});
				});

				$('#login-modal').modal();
				loginModalInit = true;
			} else {
				$('#login-modal').modal('show');
			}
			
		} else {
			if( loadFn ) loadFn();

			getFileMetadata(id, function(metadata){
				getFile(id, metadata.downloadUrl, function(file) {
					_onInitFileLoaded(metadata,file);
				});
			});
		}
	}

	/***
	 * Initialize UI / model when a file is loaded at start
	 ***/
	function _onInitFileLoaded(metadata, file) {
		// baddness, let the user know
		if( !file ) {
			if( hideInitLoading ) hideInitLoading();
			return alert("Failed to load from Google Drive :/");
		}

		// metadata failed to load, more badness
		if( metadata.code == 404 ) {
			if( hideInitLoading ) hideInitLoading();
			return alert("Google Drive: "+metadata.message);
		}

		// we loaded a model, setup and run
		if( metadata.mimeType == MIME_TYPE ) {
			// set the currently loaded file id
			loadedFile = metadata.id;
						
			// show the share btn
			$("#share-btn").parent().show();
			$("#open-in-drive").attr("href","https://docs.google.com/file/d/"+metadata.id).parent().show();
			
			// show title
			$("#loaded-model-title").html("<span style='color:#333'>Loaded Model </span> "+metadata.title);

			// setup model
			m3PGIO.loadSetup(metadata.id, file);

			// setup realtime events
			gdriveRT.initRtApi(loadedFile);
		} else if ( metadata.mimeType == TREE_MIME_TYPE ) { // we loaded a tree
			// set the loaded tree id
			loadedTree = metadata.id;

			// show the share btn
			$("#share-tree-btn").show();
			$("#loaded-tree-name").html(metadata.title).parent().show();
			
			// set the loaded tree
			m3PGIO.loadTree(file);
			
			// hide the loading popup
			if( hideInitLoading ) hideInitLoading();
		} else {
			alert("Loaded unknown file type from Google Drive: "+metadata.mimeType);
		}
	}

	/***
	 * tokens expire, every once in awhile check the current token hasn't
	 * if it has, then update
	 ***/
	function _checkToken() {
		// ignore if there is no token
		if (!token) return;

		// otherwise, look to update the access token
		Oauth.getAccessToken(function(t) {
			if( t != null ) token = t;
		});
	};

	/***
	 * is the current user signed in?
	 ***/
	function checkSignedIn(callback) {	
		// if isAutherized returns a token, user is logged in	
		Oauth.isAuthorized(function(token){
			if (token != null) callback(true);
			else callback(false);
		});
	};

	/***
	 * Sign a user in using the Oauth class
	 ***/
	function signIn(callback) {
		Oauth.authorize(function(t){
			token = t;
			if (token != null) {
				if( t.error ) return callback(false);
				callback(true);
			} else {
				callback(false);
			}
		})
	};

	/***
	 * Access method for token
	 ***/
	function getToken() {
		return token;
	};

	/***
	 * Load the google drive api code
	 ***/
	function _loadApi(callback) {
		gapi.client.load("drive", DRIVE_API_VERSION, function() {
			callback();
		});
	};

	/***
	 * Get a list of file metadata from google drive based on query
	 ***/
	function listFiles(query, callback) {
		gapi.client.drive.files.list({
			q : query + " and trashed = false"
		}).execute(function(resp) {
			callback(resp);
		});
	};

	/***
	 * Get a single files metadata based on id
	 ***/
	function getFileMetadata(id, callback) {
		gapi.client.drive.files.get({
			'fileId' : id
		}).execute(function(resp) {
			callback(resp);
		});
	};

	/***
	 *	Actually load a files data.  The url to do this is provided in a files metadata.
	 ***/
	function getFile(id, downloadUrl, callback) {
		$.ajax({
			url : downloadUrl,
			beforeSend : function(request) {
				// set access token in header
				request.setRequestHeader("Authorization", 'Bearer '+ token.access_token);
			},
			success : function(data, status, xhr) {
				// parse the response (we only store json in the google drive)
				try {
					data = JSON.parse(data);
				} catch (e) {}

				callback(data, id);
			},
			error : function() {
				callback({
					error : true,
					message : "Failed to load file from Google Drive"
				});

			}
		});
	};

	/***
	 * Save json to google drive
	 ***/
	function saveFile(name, description, mimeType, json, callback, options) {
		if( !options ) options = {}

		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";

		var metadata = {
			'title' : name,
			'description' : description,
			'mimeType' : mimeType
		};

		// if we want to save the file to a specified folder
		if( options.parent ) {
			metadata.parents = [{id: options.parent}];
		}

		// if the json is really an object, turn it to a string
		if (typeof json == 'object') json = JSON.stringify(json);

		// data needs to be base64 encoded for the POST
		var base64Data = btoa(json);

		// create our multipart POST request
		var multipartRequestBody = delimiter
				+ 'Content-Type: application/json\r\n\r\n'
				+ JSON.stringify(metadata);

		if( json.length > 0 ) {
			multipartRequestBody += delimiter + 'Content-Type: '
				+ mimeType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n'
				+ '\r\n' + base64Data;
		} 
		multipartRequestBody += close_delim;

	   	// setup POST request
	   	// if the options.conver=true flag is set, google attempts to convert the file to
	   	// a google doc file.  Mostly, we use this for exporting csv -> Google Spreadsheets
		var request = gapi.client.request({
			'path' : '/upload/drive/v2/files' + ( options.convert ? '?convert=true' : ''),
			'method' : 'POST',
			'params' : {
				'uploadType' : 'multipart'
			},
			'headers' : {
				'Content-Type' : 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body' : multipartRequestBody
		});

		// send the request
		request.execute(function(resp) {
			if (resp.id)
				callback(resp);
			else
				callback({
					error : true,
					message : "Failed to save"
				});
		});
	};
	
	/***
	 * Update a file based on id and given json data
	 ***/
	function updateFile(fileId, json, callback) {
		// start creating the multipart POST request
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";
	
		var metadata = {};
	
		// strinify then base64 encode then object
	    var base64Data = btoa(JSON.stringify(json));

	    // set up the POST body
	    var multipartRequestBody =
	    	delimiter +
	        'Content-Type: application/json\r\n\r\n' +
	        JSON.stringify(metadata) +
	        delimiter +
	        'Content-Type: ' + MIME_TYPE + '\r\n' +
	        'Content-Transfer-Encoding: base64\r\n' +
	        '\r\n' +
	        base64Data +
	        close_delim;
	
		// setup POST request
	    var request = gapi.client.request({
	        'path': '/upload/drive/v2/files/'+fileId,
	        'method': 'PUT',
	        'params': {'uploadType': 'multipart'},
	        'headers': {
	          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
	        },
	        'body': multipartRequestBody});
	    
	    // set request
	    request.execute(function(resp){
	    	if( resp.id ) {
	    		callback(resp);
	    	} else {
	    		callback({
					error : true,
					message : "Failed to update"
				});
	    	}
	    });
	}

	function runModelRt() {
		if( offlineMode ) return;
		ga('send', 'event', 'ui', 'interaction', 'run-model-remote', 1);
		gdriveRT.runModelRt();
	}

	return {
		init : init,
		checkSignedIn : checkSignedIn,
		signIn : signIn,
		getToken : getToken,
		listFiles : listFiles,
		getFileMetadata : getFileMetadata,
		load : load,
		saveFile: saveFile,
		showLoadTreePanel : showLoadTreePanel,
		showSaveTreePanel : showSaveTreePanel,
		runModelRt : runModelRt,

		MIME_TYPE : MIME_TYPE
	}

});
