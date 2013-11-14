define(["Oauth"],function(Oauth) {

	var MIME_TYPE = "application/vnd.ahb-3pg.run";
	var TREE_MIME_TYPE = "application/vnd.ahb-3pg.tree";
	var DRIVE_API_VERSION = "v2";
	
	// google oauth access token
	var token = "";
	
	var loadedFile = null;
	var fileList = [];
	var client = null;

	// loaded tree and management
	var loadedTree = null;
	var treeList = [];

	// current MIME TYPE we are saving
	var saveMimeType = "";

	// rt json
	var rtJson = null;
	var rtDoc = null;

	function init(callback) {
		$("#save-modal").modal({
			show : false
		});
		$("#load-modal").modal({
			show : false
		});

		// the about modal link is created below, so why not...
		$("#about-modal").modal({
			show : false
		});
		
		$("#save-update-btn").on('click', function() {
			_setSaveMessage('<i class="icon-spinner icon-spin"></i> Updating...','info');

			var file = {};
			var data = {};

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

			updateFile(file, 
					data, 
					function(resp){
						if( resp.error ) return _setSaveMessage('Failed to update on Google Drive :(','danger');
						else _setSaveMessage('Update Successful.','success');

						setTimeout(function(){
							$("#save-modal").modal('hide');
						},1500);
						
						if( saveMimeType == MIME_TYPE ) {
							_updateFileList();
						} else if ( saveMimeType == TREE_MIME_TYPE ) {
							_updateTreeList();
						}
					}
			);
		});
		
		$("#save-new-btn").on('click', function() {
			var name = $("#save-name-input").val();
			if( name.length == 0 ) {
				_setSaveMessage('Please provide a filename.','info');
				return;
			}
			
			if( saveMimeType == MIME_TYPE ) {
				data = m3PGIO.exportSetup();
			} else if ( saveMimeType == TREE_MIME_TYPE ) {
				data = m3PGIO.exportSetup().tree;
			} else { // badness
				alert("Unknown MIME_TYPE: "+saveMimeType);
				return;
			}

			_setSaveMessage('<i class="icon-spinner icon-spin"></i> Saving File...','info');
			saveFile(name,
					$("#save-description-input").val(),
					saveMimeType, 
					data, 
					function(resp) {
						if( resp.error ) return _setSaveMessage('Failed to save to Google Drive :(','danger');
						else _setSaveMessage('Sucessfully saved.','success');

						setTimeout(function(){
							$("#save-modal").modal('hide');
						},1500);

						

						// show the share btn
						if( saveMimeType == MIME_TYPE ) {
							_updateFileList();

							$("#share-btn").parent().show();
							$("#open-in-drive").attr("href","https://docs.google.com/file/d/"+resp.id).parent().show();

							loadedFile = resp.id;
						} else if ( saveMimeType == TREE_MIME_TYPE ) {
							_updateTreeList();
							$("#share-tree-btn").show();
							$("#loaded-tree-name").html(name).parent().show();
							loadedTree = resp.id;
						}
					}
			);
		});
		
		_createLoginBtn();

		_loadApi(function() {
			Oauth.isAuthorized(function(refreshToken){
				if( !refreshToken ) {
					callback();
					return;
				}
				Oauth.getAccessToken(function(t){
					token = t;
					if( token ) _setUserInfo();
					callback();
				});
			});
			
			setInterval(function() {
				_checkToken();
			}, 1000 * 5 * 60);
		});

		$("#share-tree-btn").on('click', function(){
			if( client == null ) {
				gapi.load('drive-share', function(){
				 	client = new gapi.drive.share.ShareClient(Oauth.APP_ID);
		    		client.setItemIds([loadedTree]);
				 	client.showSettingsDialog();
				 });
			} else {
				client.setItemIds([loadedFile]);
			 	client.showSettingsDialog();
			}
		});

	}

	function _setLoadMessage(msg, type) {
		if( !msg ) return $("#gdrive-file-msg").html("");
		$('#gdrive-file-msg').html('<div class="alert alert-'+type+'">'+msg+'</div>');
	}

	function _setSaveMessage(msg, type) {
		if( !msg ) return $("#gdrive-save-msg").html("");
		$('#gdrive-save-msg').html('<div class="alert alert-'+type+'">'+msg+'</div>');
	}

	function _createLoginBtn() {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" style="cursor:pointer">Login<b class="caret"></b></a>'
				+ '<ul class="dropdown-menu">'
				+ '<li><a id="about"><i class="icon-info-sign"></i> About</a></li>'
				+ '<li><a id="login-with-google"><i class="icon-signin"></i> Login with Google</a></li>'
				+ '</ul></li>');

		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		btn.find('#about').on('click', function() {
			btn.toggleClass('open');
			$("#about-modal").modal('show');
		});

		btn.find('#login-with-google').on('click',function() {
			btn.toggleClass('open');
			signIn(function(token) {
				_setUserInfo();
			});
		});

		$("#login-header").html("").append(btn);
	};
	
	function _setUserInfo() {
		// load user name
		$.ajax({
			url : "https://www.googleapis.com/oauth2/v1/userinfo",
			beforeSend : function(request) {
				request.setRequestHeader("Authorization",'Bearer '+ token.access_token);
			},
			success : function(data, status,xhr) {
				try {
					data = JSON.parse(data);
				} catch (e) {
				}

				_createLogoutBtn(data);

			},
			error : function() {
			}
		});
		
		// load user files, trees
		_updateFileList();
		_updateTreeList();
	}
	
	var _rtLoaded = false;
	var _rtTimer = -1;
	function _initRtApi() {
		rtJson = null; // kill off any old listners
		if( rtDoc ) rtDoc.close();

		if( loadedFile == null ) return;

		if( !_rtLoaded ) {
			gapi.load('drive-realtime', function(){
				_rtLoaded = true;
				_loadRtFile();
			});
		} else {
			_loadRtFile();
		}
	}

	function _loadRtFile() {
		gapi.drive.realtime.load(loadedFile,
			// file loaded
			function(file){
				rtDoc = file;
				var json = file.getModel().getRoot().get("json");

				if( json == null ) {
					_onRtModelLoad(file.getModel());
					json = file.getModel().getRoot().get("json");
				}

				if( !json ) return console.log("Failed to connect to rt json");
				rtJson = json;

				var users = file.getCollaborators();
				
				// TODO: this needs works ...
				// see if there are active changes to the model
				/*if( users.length > 0 && JSON.stringify(m3PGIO.exportSetup()) != rtJson.getText() ) {
					// let things settle
					setTimeout(function(){
						if( confirm("There are active changes to this model, would you like to load them?") ) {
							var data = JSON.parse(rtJson.getText());
							m3PGIO.loadSetup(loadedFile, data, true);
						}
					}, 2000);
				}*/

				file.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, function(e){
					users = file.getCollaborators();
					_updateActiveUsers(users);
				});
				file.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function(e){
					users = file.getCollaborators();
					_updateActiveUsers(users);
				});

				// add event listeners
				json.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, function(e){
					if( e.isLocal ) return;
					_rerunRt(users, e.userId);
			  	});
			  	json.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, function(e){
			  		if( e.isLocal ) return;
			  		_rerunRt(users, e.userId);
			  	});

			  	_updateActiveUsers(users);
			},
			// model loaded
			function(model){
				_onRtModelLoad(model);
			},
			// errors
			function(err) {
				console.log("RT ERRORS: ");
				console.log(err);
			}
		);
	}

	function _updateActiveUsers(users) {
		if( !users ) return $("#active-users").html("");
		if( users.length <= 1 ) return $("#active-users").html("");

		var html = "Active Users ";
		for( var i = 0; i < users.length; i++ ) {
			if( users[i].photoUrl ) {
				html += "<img src='"+users[i].photoUrl+"' title='"+users[i].displayName+"' style='margin:0 5px;width:32px;height:32px' class='img-rounded' /> ";
			} else {
				html += "<span style='width:32px;height:32px;margin:0 5px;background-color:"+users[i].color+"' title='"+users[i].displayName+"' ></span> ";
			}
		}
		$("#active-users").html(html);
	}

	function _rerunRt(users, userId) {
		if( !rtJson ) return;

		if( _rtTimer != -1 ) clearTimeout(_rtTimer);

		_rtTimer = setTimeout(function(){
			_rtTimer = -1;

			for( var i = 0; i < users.length; i++ ) {
				if( users[i].userId == userId ) {
					var panel = $("<div class='init-loading-outer' ><div class='init-loading' style='width:400px'> "+
									(users[i].photoUrl ? "<img src='"+users[i].photoUrl+"' /> " : "")+users[i].displayName+" is updating the model...</div></div>");
			        $("body").append(panel);
			        setTimeout(function(){
			            panel.css("opacity",".9");
			        },50);
			        setTimeout(function(){
			            panel.remove();
			        }, 3500);
			        break;
				}
			}

			var data = JSON.parse(rtJson.getText());
			m3PGIO.loadSetup(loadedFile, data, true);
		},200);
	}

	function _onRtModelLoad(model) {
		var json = model.getRoot().get("json");
		if( json == null ) {
			var string = model.createString("{}");
			model.getRoot().set("json", string);
		}
	}

	// let the world know what we are doing :)
	function runModelRt() {
		if( rtJson ) rtJson.setText(JSON.stringify( m3PGIO.exportSetup() ));
	}



	// TODO: add search to the following functions,
	// limit to 10 results
	function _updateFileList() {
		listFiles("mimeType = '"+MIME_TYPE+"'", function(resp){
			fileList = resp.result.items;
		});
	}

	function _updateTreeList() {
		listFiles("mimeType = '"+TREE_MIME_TYPE+"'", function(resp){
			treeList = resp.result.items;
		});
	}


	function _showDriveFiles() {
		if( !fileList ) return $("#gdrive-file-list").html("<li>No Files</li>");
		if( fileList.length == 0 ) return $("#gdrive-file-list").html("<li>No Files</li>");
		$("#gdrive-file-list").html("<h4>Select File</h4>");

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
		
		$("#gdrive-file-list a").on('click', function(){
			var id = $(this).attr("id");

			_setLoadMessage('<i class="icon-spinner icon-spin"></i> Loading File...','info');
			getFile(id, $(this).attr("url"), function(file) {
				if( !file  ) return _setLoadMessage('Failed to load file from Google Drive :(','danger');
				if( file.error  ) return _setLoadMessage('Failed to load file from Google Drive :(','danger');

				// hide any loaded trees
				$("#share-tree-btn").hide();
				$("#loaded-tree-name").html("").parent().hide();
				loadedTree = null;

				_setLoadMessage('File Loaded.','success');
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
				_initRtApi();
				
				setTimeout(function(){
					// hide the modal
					$("#load-modal").modal('hide');
				},1500);

			});
		});
	}
	
	function _showTreeFiles() {
		$("#gdrive-file-list").html("");
		$("#gdrive-file-list").append($("<li class='list-group-item'><h5>Select Tree</h5></li>"));

		if( !treeList ) return $("#gdrive-file-list").append($("<li class='list-group-item'>No Trees Available</li>"));
		if( treeList.length == 0 ) return $("#gdrive-file-list").append($("<li class='list-group-item'>No Trees Available</li>"));

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
		
		$("#gdrive-file-list a").on('click', function(){
			var id = $(this).attr("id");
			var name = $(this).attr("name");

			_setLoadMessage('<i class="icon-spinner icon-spin"></i> Loading Tree...','info');
			getFile(id, $(this).attr("url"), function(file) {
				if( !file  ) return _setLoadMessage('Failed to load tree from Google Drive :(','danger');
				if( file.error  ) return _setLoadMessage('Failed to load tree from Google Drive :(','danger');

				$("#share-tree-btn").show();
				$("#loaded-tree-name").html(name).parent().show();

				_setLoadMessage('Tree Loaded.','success');
				loadedTree = id;					

				m3PGIO.loadTree(file);
				
				setTimeout(function(){
					// hide the modal
					$("#load-modal").modal('hide');
				},1500);

			});
		});
	}

	function showLoadTreePanel() {
		_showTreeFiles();
		_setLoadMessage(null);
		$("#load-modal").modal('show');
	}

	function showSaveTreePanel() {
		saveMimeType = TREE_MIME_TYPE;

		$("#gdrive-save-subheader").html("<h5>Save Tree</h5>");

		if( loadedTree != null) {
			var tree = {};
			for( var i = 0; i < treeList.length; i++ ) {
				if( treeList[i].id == loadedTree) {
					tree = treeList[i];
					break;
				}
			}
			$("#save-update-panel").show();
			var d = new Date(tree.modifiedDate);
			$("#save-update-panel-inner").html("<b>"+tree.title+"</b><br />" +
				  "<span style='color:#888'>"+tree.description+"</span><br />"+
				  "<span style='font-style:italic;font-size:11px;'>Last Modified: " + 
				  d.toDateString()+" "+d.toLocaleTimeString()+" by "+tree.lastModifyingUserName+"</span><br />"+
				  "<a href='https://drive.google.com/file/d/"+tree.id+"'' target='_blank'><i class='icon-link'></i> Open in Google Drive</a>");
		} else {
			$("#save-update-panel").hide();
		}
		
		// clear any message
		_setSaveMessage(null);

		$("#save-modal").modal('show');
	}

	function load(id) {
		if( !token ) {
			signIn(function(token) {
				_setUserInfo();
				
				getFileMetadata(id, function(metadata){
					getFile(id, metadata.downloadUrl, function(file) {
						_onInitFileLoaded(metadata,file);
					});
				});
				
			});
		} else {
			getFileMetadata(id, function(metadata){
				getFile(id, metadata.downloadUrl, function(file) {
					_onInitFileLoaded(metadata,file);
				});
			});
		}
	}

	function _onInitFileLoaded(metadata, file) {
		if( !file ) {
			if( hideInitLoading ) hideInitLoading();
			return alert("Failed to load from Google Drive :/");
		}
		if( metadata.code == 404 ) {
			if( hideInitLoading ) hideInitLoading();
			return alert("Google Drive: "+metadata.message);
		}

		if( metadata.mimeType == MIME_TYPE ) {
			loadedFile = metadata.id;
						
			// show the share btn
			$("#share-btn").parent().show();
			$("#open-in-drive").attr("href","https://docs.google.com/file/d/"+metadata.id).parent().show();
			
			// show title
			$("#loaded-model-title").html("<span style='color:#333'>Loaded Model </span> "+metadata.title);

			// setup model
			m3PGIO.loadSetup(metadata.id, file);

			// setup realtime events
			_initRtApi();
		} else if ( metadata.mimeType == TREE_MIME_TYPE ) {
			loadedTree = metadata.id;
			$("#share-tree-btn").show();
			$("#loaded-tree-name").html(metadata.title).parent().show();
			m3PGIO.loadTree(file);
			if( hideInitLoading ) hideInitLoading();
		} else {
			alert("Loaded unknown file type from Google Drive: "+metadata.mimeType);
		}
	}

	function _createLogoutBtn(userdata) {
		var btn = $('<li class="dropdown">'
				+ '<a class="dropdown-toggle" style="cursor:pointer"><img class="img-rounded" src="'+userdata.picture
				+ '" style="margin:-5px 5px -5px 0;width:28px;height:28px;border:1px solid white" /> ' + userdata.name
				+ '<b class="caret"></b></a>' + '<ul class="dropdown-menu">'
				+ '<li><a id="save"><i class="icon-cloud-upload"></i> Save Model</a></li>'
				+ '<li style="display:none"><a id="share-btn"><i class="icon-share"></i> Share Model</a></li>'
				+ '<li style="display:none"><a id="open-in-drive" target="_blank"><i class="icon-external-link-sign"></i> Open in Google Drive</a></li>' 
				+ '<li><a id="load"><i class="icon-cloud-download"></i> Load Model</a></li>'
				+ '<li><a id="about"><i class="icon-info-sign"></i> About</a></li>' 
				+ '<li><a id="logout"><i class="icon-signout"></i> Logout</a></li>' 
				+ '</ul></li>');
		
		btn.find('a.dropdown-toggle').on('click', function(){
			$(this).parent().toggleClass('open');
		});

		btn.find('#save').on('click', function() {
			saveMimeType = MIME_TYPE;
			$("#gdrive-save-subheader").html("<h5>Save Model</h5>");

			btn.toggleClass('open');
			if( loadedFile != null) {
				var file = {};
				for( var i = 0; i < fileList.length; i++ ) {
					if( fileList[i].id == loadedFile) {
						file = fileList[i];
						break;
					}
				}
				$("#save-update-panel").show();
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

			$("#save-modal").modal('show');
		});

		btn.find("#share-btn").on('click', function(){
			if( client == null ) {
				gapi.load('drive-share', function(){
				 	client = new gapi.drive.share.ShareClient(Oauth.APP_ID);
		    		client.setItemIds([loadedFile]);
				 	client.showSettingsDialog();
				 });
			} else {
				client.setItemIds([loadedFile]);
			 	client.showSettingsDialog();
			}
		});
		
		btn.find('#about').on('click', function() {
			btn.toggleClass('open');
			$("#about-modal").modal('show');
		});

		btn.find('#load').on('click', function() {
			btn.toggleClass('open');

			// hide any existing message
			_setLoadMessage(null);

			// show the modal
			$("#load-modal").modal('show');
			_showDriveFiles();
		});
				
		btn.find('#logout').on('click', function() {
			btn.toggleClass('open');
			token = null;
			_createLoginBtn();
		});

		$("#login-header").html("").append(btn);
	};

	// tokens expire, every once in awhile check the current token hasn't
	// if it has, then update
	function _checkToken() {
		if (!token)
			return;
		Oauth.getAccessToken(function(t) {
			if( t != null ) token = t;
		});
	};

	function checkSignedIn(callback) {		
		Oauth.isAuthorized(function(token){
			if (token != null)
				callback(true);
			else
				callback(false);
		});
	};

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

	function getToken() {
		return token;
	};

	function _loadApi(callback) {
		gapi.client.load("drive", DRIVE_API_VERSION, function() {
			callback();
		});
	};

	function listFiles(query, callback) {
		gapi.client.drive.files.list({
			q : query + " and trashed = false"
		}).execute(function(resp) {
			callback(resp);
		});
	};

	function getFileMetadata(id, callback) {
		gapi.client.drive.files.get({
			'fileId' : id
		}).execute(function(resp) {
			callback(resp);
		});
	};

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

	function saveFile(name, description, mimeType, json, callback, options) {
		if( !options ) options = {}

		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";

		var metadata = {
			'title' : name,
			'description' : description,
			'mimeType' : mimeType,
		// parents : [{id: folderId}] TODO
		};

		if( options.parent ) {
			metadata.parents = [{id: options.parent}];
		}

		if (typeof json == 'object') json = JSON.stringify(json);
		var base64Data = btoa(json);
		var multipartRequestBody = delimiter
				+ 'Content-Type: application/json\r\n\r\n'
				+ JSON.stringify(metadata) + delimiter + 'Content-Type: '
				+ mimeType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n'
				+ '\r\n' + base64Data + close_delim;

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
	
	function updateFile(fileId, json, callback) {
		var boundary = '-------314159265358979323846';
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";
	
		 var metadata = {};
	
	    var base64Data = btoa(JSON.stringify(json));
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
	
	    var request = gapi.client.request({
	        'path': '/upload/drive/v2/files/'+fileId,
	        'method': 'PUT',
	        'params': {'uploadType': 'multipart'},
	        'headers': {
	          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
	        },
	        'body': multipartRequestBody});
	    
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
