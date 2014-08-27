require.config({
    catchError:false,
    paths: {
        jquery: '../bower_components/jquery/jquery',
        bootstrapAffix: '../bower_components/sass-bootstrap/js/affix',
        bootstrapAlert: '../bower_components/sass-bootstrap/js/alert',
        bootstrapButton: '../bower_components/sass-bootstrap/js/button',
        bootstrapCarousel: '../bower_components/sass-bootstrap/js/carousel',
        bootstrapCollapse: '../bower_components/sass-bootstrap/js/collapse',
        bootstrapDropdown: '../bower_components/sass-bootstrap/js/dropdown',
        bootstrapModal: '../bower_components/sass-bootstrap/js/modal',
        bootstrapPopover: '../bower_components/sass-bootstrap/js/popover',
        bootstrapScrollspy: '../bower_components/sass-bootstrap/js/scrollspy',
        bootstrapTab: '../bower_components/sass-bootstrap/js/tab',
        bootstrapTooltip: '../bower_components/sass-bootstrap/js/tooltip',
        bootstrapTransition: '../bower_components/sass-bootstrap/js/transition',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        requirejs: '../bower_components/requirejs/require',
        owlCarousel: '../bower_components/owlcarousel/owl-carousel/owl.carousel',
        'sass-bootstrap': '../bower_components/sass-bootstrap/dist/js/bootstrap',
    },
    shim: {
        owlCarousel: {
            deps: [
                'jquery'
            ]
        },
        bootstrap: {
            deps: [
                'jquery'
            ]
        },
        bootstrapAffix: {
            deps: [
                'jquery'
            ]
        },
        bootstrapAlert: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapButton: {
            deps: [
                'jquery'
            ]
        },
        bootstrapCarousel: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapCollapse: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapDropdown: {
            deps: [
                'jquery'
            ]
        },
        bootstrapModal: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapPopover: {
            deps: [
                'jquery',
                'bootstrapTooltip'
            ]
        },
        bootstrapScrollspy: {
            deps: [
                'jquery'
            ]
        },
        bootstrapTab: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapTooltip: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapTransition: {
            deps: [
                'jquery'
            ]
        }
    }
});

require(['jquery', 'bootstrap','app','gdrive', 'offline', 'owlCarousel','flashblock-detector', 'weatherFileReader'], function ($, bootstrap, app, gdrive, offline) {

    window.hideInitLoading = null;
    function initLoading() {
        var panel = $("<div class='init-loading-outer'><div class='init-loading'><i class='icon-spinner icon-spin'></i> Initializing from Google Drive...</div></div>");
        $("body").append(panel);
        setTimeout(function(){
            panel.css("opacity",".9");
        },50);

        window.hideInitLoading = function() {
            $(".init-loading-outer").css("opacity","0");
            setTimeout(function(){
                $(".init-loading-outer").remove();
                window.hideInitLoading = null;
            },500);
        }
    }

    onChartsLoadedFired = false;
    function onChartsLoaded() {
        if( onChartsLoadedFired ) return;
        onChartsLoadedFired = true;

			$("#status").html("3pg model");
			
			var version = app.qs("version");
			var devmode = app.qs("devmode");
			
            // TODO
            //if( devmode ) app.devmode = true;
			
			app.loadModelCode(version, function(){
				$("#status").html("3pg data");
			    $("body").html("").load("app.html", function(){
					app.init(function(){
                        if( offlineMode ) {
                            offline.render();
                        } else {
                            gdrive.init(function(){
                                var file = app.qs("file");
                                if( file ) {
                                    gdrive.load(file, initLoading);
                                }
                                // see if we are loading for google drive
                                var state = app.qs("state");
                                if( state ) {
                                    state = JSON.parse(state);
                                    initLoading();
                                    gdrive.load(state.ids[0], initLoading);
                                }
                            });
                        }
					});
				});
		    });
    };

    if( chartsLoaded ) {
        onChartsLoaded();
    } else {
        chartsCallback = onChartsLoaded;
    }

    window.showAbout = function(){
        $("#about-modal").modal('show');
    };

    window.showHelpInit = false;
    window.showHelp = function() {
        $("#help-modal").modal('show');
        if( !showHelpInit ) {
            showHelpInit = true;
            setTimeout(function(){
                $("#videoRoot").html('<iframe width="560" height="315" src="//www.youtube.com/embed/CjMs8lDPqbw" frameborder="0" allowfullscreen></iframe>');
            }, 500);
        }
    }
		
	// override the log function
	window.log = function(msg) {
		if( app.debug ) console.log(msg);
	};

    if( offlineMode ) offline.init();

});
