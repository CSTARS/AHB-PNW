define(["gdrive"],function(gdrive) {

	function init() {
		$("#export-modal").modal({
            show : false
        });

        $("#show-export-csv").on('click', function(){
        	_setMessage(null);

        	$("#export-name").val("3PG Model Results ("+new Date().toISOString().replace(/T/,' ').replace(/\.\d*Z/,'')+")");
            $("#export-modal").modal('show');
        });
	}

	function _setMessage(msg, type, progress) {
		if( !msg ) {
			return $("#export-msg").hide();
		}
		$("#export-msg").show();

		if( progress ) {
			$("#export-msg-progress").show();
		} else {
			$("#export-msg-progress").hide();
		}

		$('#export-msg').attr("class",'alert alert-'+type);
		$('#export-msg-text').html(msg);
	}

	function _updateProgress(index, total) {
		percent = 100 * ( index / total );
		$("#export-msg-progress-bar").attr("aria-valuenow", percent).css("width",percent+"%");
	}

	// see if an error exists, if so, set state
	function _checkError(file) {
		var errorMessage = null;
		if( !file ) errorMessage = "Error creating file on Google Drive :(";
		if( file.error ) errorMessage = file.message;

		if( errorMessage ) {
			_setMessage(errorMessage, "danger");
			$("#export-csv").removeClass("disabled").html("Export");
			return true;
		}
		return false;
	}

		// export as csv
	function exportCsv(results) {
		ga('send', 'event', 'ui', 'interaction', 'export-drive-csv', 1);

		$("#export-csv").addClass("disabled").html("Exporting...");

		var name = $("#export-name").val();
		if( name.length == 0 ) {
			_setMessage("Please provide a folder name", "danger")
			$("#export-csv").removeClass("disabled").html("Export");
			return;
		}

		var data = results.data;

		// create a list so we can recursively iterate
		var keys = [];
		for( var key in data ) keys.push(key);
		
		// create folder
		_setMessage("Creating export folder...", "info", true);
		_updateProgress(1, keys.length+2);
		gdrive.saveFile(name,"AHB 3PG Model Results","application/vnd.google-apps.folder","",function(file){
			if( _checkError(file) ) return;
			var parent = file.id;
			_updateProgress(2, keys.length+2);

			// create a nice file describing the current export
			_setMessage("Creating config file...", "info", true);
			delete results.config.plantation_state;
			var config = JSON.stringify(results.config,null,"  ");
			gdrive.saveFile("config.txt","AHB 3PG Model - Run Configuration","text/plain",config,function(file){
				if( _checkError(file) ) return;
				_updateProgress(3, keys.length+2);

				_createExport(0, keys, data, parent);
			},{parent: parent})
		});
	}

	function _createExport(index, keys, data, parent) {
		
		// we are all done :)
		if( index == keys.length ) {
			_updateProgress(1, 1);
			_setMessage("Export Successful.<br /><a href='https://drive.google.com/#folders/" + parent + 
						"' target='_blank'><i class='icon-external-link-sign'></i> Open in Google Drive</a>", "success");
			$("#export-csv").removeClass("disabled").html("Export");
		} else {

			var key = keys[index];
			var csv = "";

			// TODO: add month and date

			for( var i = 0; i < data[key].length; i++ ) {
				if( data[key][i].length == 0 ) continue; // ignore the blank rows

				for( var j = 0; j < data[key][i].length; j++ ) csv += data[key][i][j]+",";
				csv = csv.replace(/,$/,'')+"\n";
			}

			_setMessage("Creating "+keys[index]+".csv... ", "info", true);
			gdrive.saveFile(keys[index]+".csv","","text/csv",csv,function(file){
				if( _checkError(file) ) return;

				_updateProgress(index+4, keys.length+2);
				
				index++;
				_createExport(index, keys, data, parent);
			},{convert: true, parent: parent});
		}
	};

	return {
		exportCsv : exportCsv,
		init      : init
	}

});