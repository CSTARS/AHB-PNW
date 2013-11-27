define([],function() {
	// TODO: going to need access to user information.
	// 

	// REALTIME (rt) Objects
	// rt json field, used to send updates to peers
	var rtJson = null;
	// rt document
	var rtDoc = null;
	// has the rt api been loaded?
	var _rtLoaded = false;
	// timer to buffer the firing of updates from rt events
	var _rtTimer = -1;

	// list of current rt edits to input files
	var rtEdits = {};
	// google drive rt model - map
	var liveEdits = null;
	// local lock on an element
	var lock = {};

	// loaded file id
	var loadedFile;

	/***
	 * Setup the rt api for the current file.  This will actually load the api if needed
	 ***/
	function initRtApi(file) {
		rtJson = null; // kill off any old listners
		loadedFile = file;

		// close any old connection
		if( rtDoc ) rtDoc.close();

		// get out of here if we don't have a loaded file
		if( loadedFile == null ) return;

		// load api if needed
		if( !_rtLoaded ) {
			gapi.load('drive-realtime', function(){
				// setup rt hooks
				_rtLoaded = true;
				_loadRtFile();
			});
		} else {
			// setup rt hooks
			_loadRtFile();
		}

		// setup input handlers
		$('#inputs input').on('focus',function(e){
			var ele = $(e.target);
			_setLocalLock({
				id        : ele.attr("id"),
				value     : ele.val(),
				timestamp : new Date().getTime(),
				user      : window.userinfo ? window.userinfo.name : "unknown"
			});
		});
		$('#inputs input').on('blur',function(e){
			_removeLocalLock($(e.target).attr("id"));
		});
		$('#inputs input').on('keyup',function(e){
			if( e.which == 13 ) return;
			var ele = $(e.target);
			_updateLocalLock(ele.attr("id"), ele.val());
		});
	}

	function _setLocalLock(lock) {
		// TODO: this should mark the current lock
		if( liveEdits.has[lock.id] ) return;		
		liveEdits.set(lock.id, lock);
	}

	function _updateLocalLock(id, val) {
		var lock = {
			id : id,
			value : val,
			timestamp : new Date().getTime(),
			user      : window.userinfo ? window.userinfo.name : "unknown"
		}

		liveEdits.set(id, lock);
	}

	function _removeLocalLock(id) {
		liveEdits.delete(id);
	}

	function _removeRemoteLock(lock) {
		$("#"+lock.id).removeAttr("disabled");
		$("#"+lock.id+"-editing").remove();
		delete rtEdits[lock.id];
	}

	function _updateLock(lock) {
		$("#"+lock.id).val(lock.value).attr("disabled","disabled");
		if( $("#"+lock.id+"-editing").length == 0 ) {
			$("#"+lock.id).parent().after("<span id='"+lock.id+"-editing' class='label label-warning'></span>");
		}
		$("#"+lock.id+"-editing").html(lock.user);
		rtEdits[lock.id] = lock;
	}

	/***
	 * Update the list of realtime edits as well as the input UI based on the rtDoc event
	 * TODO: this is a bit nasty right now
	 **/
	function _updateRtEdits(e) {
		if( e.isLocal ) return;

		var keys = liveEdits.keys();

		// remove old timestamps TODO
		/*for( var i = 0; i < values.length; i++ ) {
			if( now - values[i].timestamp > 1000 * 60 ) {
				_removeLock(values[i]); // does this fire updates?
			}
		}*/


		// set new edits
		for( var i = 0; i < keys.length; i++ ) {
			_updateLock(liveEdits.get(keys[i]));
		}

		// remove old edits
		for( var key in rtEdits ) {
			if( keys.indexOf(key) == -1 ) {
				_removeRemoteLock(rtEdits[key]);
			}
		}
	}

	/***
	 *	Setup the rt hooks for the current file.  The api needs to already be loaded
	 ***/
	function _loadRtFile() {
		// get the rt doc
		gapi.drive.realtime.load(loadedFile,
			// rt doc loaded
			function(file){
				rtDoc = file;

				// get our rt attribute.  Triggering changes on rtJson will push events
				// to all listening clients
				var json = file.getModel().getRoot().get("json");
				liveEdits = file.getModel().getRoot().get("liveEdits");

				// if there is no json attr, we need to initialize the model
				if( json == null || liveEdits == null) {
					// initialize our rt model
					_onRtModelLoad(file.getModel());
					// grab rt json attr now that we are initialized
					json = file.getModel().getRoot().get("json");
					liveEdits = file.getModel().getRoot().get("liveEdits");
				}

				// badness happened :(
				if( !json ) return console.log("Failed to connect to rt json");
				// set that attr global to class
				rtJson = json;

				// get current list of users
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

				// add event listeners for when people come and go
				file.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, function(e){
					users = file.getCollaborators();
					_updateActiveUsers(users);
				});
				file.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function(e){
					users = file.getCollaborators();
					_updateActiveUsers(users);
				});

				// add event listeners for the rtJson object
				// when this updates, we want to re-run the model
				json.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, function(e){
					if( e.isLocal ) return;
					_rerunRt(users, e.userId);
			  	});
			  	json.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, function(e){
			  		if( e.isLocal ) return;
			  		_rerunRt(users, e.userId);
			  	});

			  	// live edit updates
                liveEdits.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, function(e){
                   	_updateRtEdits(e);
                });

			  	// show who is listening
			  	_updateActiveUsers(users);

			  	// set input handlers for rt events
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


	/***
	 * Update the display of active users for the model.
	 ***/
	function _updateActiveUsers(users) {
		// if it's just us, don't show anything
		if( !users ) return $("#active-users").html("");
		if( users.length <= 1 ) return $("#active-users").html("");

		// we only want unique users
		var unique = [];
		var uusers = [];
		for( var i = 0; i < users.length; i++ ) {
			if( unique.indexOf(users[i].userId) == -1 ) {
				unique.push(users[i].userId);
				uusers.push(users[i]);
			}
		}
		if( uusers.length <= 1 ) return $("#active-users").html("");

		// add pic of user to display panel
		var html = "Active Users ";
		for( var i = 0; i < uusers.length; i++ ) {
			if( uusers[i].photoUrl ) {
				html += "<img src='"+uusers[i].photoUrl+"' title='"+uusers[i].displayName+"' style='margin:0 5px;width:32px;height:32px' class='img-rounded' /> ";
			} else {
				html += "<span style='width:32px;height:32px;margin:0 5px;background-color:"+uusers[i].color+"' title='"+uusers[i].displayName+"' ></span> ";
			}
		}
		$("#active-users").html(html);
	}

	/***
  	 *	Re-run the model.  Events can come in quickly in many parts.  Buffer the events so we don't re-run the model too many times.
  	 ***/
	function _rerunRt(users, userId) {
		// this is badness
		if( !rtJson ) return;

		// clear any queued run
		if( _rtTimer != -1 ) clearTimeout(_rtTimer);

		// queue up a run and wait to make sure there are no updates
		_rtTimer = setTimeout(function(){
			_rtTimer = -1;

			// find the user who is running the model and diplay popup of that users information
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

			// parse the new model data and load it as our current setup
			var data = JSON.parse(rtJson.getText());
			m3PGIO.loadSetup(loadedFile, data, true);
		}, 300);
	}

	/***
	 * initialize a new rt model
	 ***/
	function _onRtModelLoad(model) {
		// currently we just want to use this single attribute to broadcast events
		var json = model.getRoot().get("json");
		if( json == null ) {
			var string = model.createString("{}");
			model.getRoot().set("json", string);
		}

		var liveEdits = model.getRoot().get("liveEdits");
		if( liveEdits == null ) {
			var field = model.createMap();
			model.getRoot().set("liveEdits", field);
		}
		
	}

	/***
	 * let the world know what we are doing :)
	 * This should be called when a local user runs the model.  It updates the 'json'
	 * attribute which is then broadcast to all listening parties
	 ***/
	function runModelRt() {
		if( rtJson ) rtJson.setText(JSON.stringify( m3PGIO.exportSetup() ));
	}

	return {
		runModelRt : runModelRt,
		initRtApi  : initRtApi
	}

});