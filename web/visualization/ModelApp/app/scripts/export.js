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

	function _setMessage(msg, type) {
		if( !msg ) return $("#export-msg").html("");
		$('#export-msg').html('<div class="alert alert-'+type+'">'+msg+'</div>');
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
		$("#export-csv").addClass("disabled").html("Exporting...");

		var name = $("#export-name").val();
		if( name.length == 0 ) {
			_setMessage("Please provide a folder name", "danger")
			$("#export-csv").removeClass("disabled").html("Export");
			return;
		}

		var data = results.data;
		
		// create folder
		_setMessage("<i class='icon-spinner icon-spin'></i> Creating export folder...", "info");
		gdrive.saveFile(name,"AHB 3PG Model Results","application/vnd.google-apps.folder","",function(file){
			if( _checkError(file) ) return;
			var parent = file.id;

			// create a nice file describing the current export
			_setMessage("<i class='icon-spinner icon-spin'></i> Creating config file...", "info");
			delete results.config.plantation_state;
			var config = JSON.stringify(results.config,null,"  ");
			gdrive.saveFile("config.txt","AHB 3PG Model - Run Configuration","text/plain",config,function(file){
				if( _checkError(file) ) return;

				// create a list so we can recursively iterate
				var keys = [];
				for( var key in data ) keys.push(key);

				_createExport(0, keys, data, parent);
			},{parent: parent})
		});
	}

	function _createExport(index, keys, data, parent) {
		
		// we are all done :)
		if( index == keys.length ) {
			_setMessage("Export Successful.<br /><a href='https://drive.google.com/#folders/" + parent + 
						"' target='_blank'><i class='icon-external-link-sign'></i> Open in Google Drive</a>", "success");
			$("#export-csv").removeClass("disabled").html("Export");
		} else {

			var key = keys[index];
			var csv = "";
			for( var i = 0; i < data[key].length; i++ ) {
				if( data[key][i].length == 0 ) continue; // ignore the blank rows
				
				for( var j = 0; j < data[key][i].length; j++ ) csv += data[key][i][j]+",";
				csv = csv.replace(/,$/,'')+"\n";
			}

			_setMessage("<i class='icon-spinner icon-spin'></i> Creating "+keys[index]+".csv... ", "info");
			gdrive.saveFile(keys[index]+".csv","","text/csv",csv,function(file){
				if( _checkError(file) ) return;
				
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