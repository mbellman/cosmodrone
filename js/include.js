( function( scope ) {
	/**
	 * ---------------------
	 * Class: IncludeManager
	 * ---------------------
	 *
	 * (INTERNAL) Script loader resource
	 */
	function IncludeManager( includes )
	{
		// -- Private: --
		var _ = this;
		var scriptCount = includes.length;
		var loaded = 0;
		var events = {
			progress: function(){},
			error: function(){},
			complete: function(){}
		};

		/**
		 * Load an individual script
		 */
		function load_script( file )
		{
			var script = document.createElement( 'script' );
			script.src = file;

			script.onload = function() {
				events.progress( file );

				if ( ++loaded >= scriptCount ) {
					events.complete();
				}
			};

			script.onerror = function() {
				events.error( file );
				document.body.removeChild( script );
			}

			document.body.appendChild( script );
		}

		/**
		 * Load all included scripts
		 */
		function load_scripts()
		{
			for ( var s = 0 ; s < scriptCount ; s++ ) {
				load_script( includes[s] );
			}
		}

		// -- Public: --
		/**
		 * Bind event handlers
		 */
		this.on = function( event, callback )
		{
			if ( typeof events[event] !== 'undefined' ) {
				events[event] = callback;
			}

			return _;
		};

		/**
		 * Save scripts load completion callback and start loading
		 */
		this.then = function( callback )
		{
			events.complete = callback || events.complete;
			load_scripts();
		};
	}

	/**
	 * IncludeManager factory function
	 */
	function include( scripts )
	{
		return new IncludeManager( scripts );
	}

	scope.include = include;
} )( window );