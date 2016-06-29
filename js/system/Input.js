( function( scope ) {
	/**
	 * ----------------
	 * Object: KeyCodes
	 * ----------------
	 *
	 * (INTERNAL) Key code -> Key name map
	 */
	var KeyCodes = {
		13: 'ENTER',
		16: 'SHIFT',
		37: 'LEFT',
		38: 'UP',
		39: 'RIGHT',
		40: 'DOWN',
		65: 'A',
		68: 'D',
		83: 'S',
		87: 'W'
	};

	/**
	 * -------------------
	 * Class: InputHandler
	 * -------------------
	 *
	 * An input manager allowing for custom key event queues
	 */
	function InputHandler()
	{
		// -- Private: --
		var _ = this;
		var timestamp = Date.now();
		var enable_time = timestamp;
		var bound = false;
		var disabled = false;

		var events = {
			input: []
		};

		/**
		 * Returns a uniquely namespaced [event] string
		 */
		function get_namespaced_event( event )
		{
			return event + '.InputHandler-' + timestamp;
		}

		/**
		 * Fire all event handlers for a specific key input [event]
		 */
		function dispatch_event( event, data )
		{
			var handlers = events[event];

			if ( typeof handlers !== 'undefined' ) {
				for ( var h = 0 ; h < handlers.length ; h++) {
					handlers[h]( data );
				}
			}
		}

		/**
		 * Check key input and dispatch appropriate handlers
		 */
		function handle_input( event )
		{
			if ( disabled || Date.now() - enable_time < 150 ) {
				return;
			}

			// Dispatch base input event by default
			dispatch_event( 'input', event.keyCode );
			dispatch_event( KeyCodes[event.keyCode] );
		}

		// -- Public: --
		/**
		 * Start listening for inputs
		 */
		this.listen = function()
		{
			if ( !bound ) {
				$( document ).on( get_namespaced_event( 'keydown' ), handle_input );
				bound = true;
			}

			return _;
		};

		/**
		 * Stop listening for inputs
		 */
		this.unlisten = function()
		{
			if ( bound ) {
				$( document ).off( get_namespaced_event( 'keydown' ) );
				bound = false;
			}

			return _;
		};

		/**
		 * Bind a key input handler
		 */
		this.on = function( key, handler )
		{
			if ( !bound ) {
				listen();
			}

			if ( typeof events[key] === 'undefined' ) {
				events[key] = [];
			}

			events[key].push( handler );
			return _;
		};

		/**
		 * Remove a key input handler
		 */
		this.unbindKey = function( key )
		{
			if ( events.hasOwnProperty( key ) ) {
				events[key].length = 0;
				delete events[key];
			}
		};

		/**
		 * Remove all key input handlers
		 */
		this.unbindEvents = function()
		{
			for ( var key in events ) {
				if ( events.hasOwnProperty( key ) ) {
					delete events[key];
				}
			}

			events = {};
			return _;
		};

		/**
		 * Internally disable input callbacks
		 * without destroying any bindings
		 */
		this.disable = function()
		{
			disabled = true;
			return _;
		};

		/**
		 * Re-enable the disabled listener state
		 */
		this.enable = function()
		{
			enable_time = Date.now();
			disabled = false;
			return _;
		};
	}

	/**
	 * -----------
	 * Class: Keys
	 * -----------
	 *
	 * A boolean list of key-press states for common game keys
	 */
	function Keys()
	{
		// -- Private: --
		var _ = this;
		var timestamp = Date.now();
		var bound = false;
		var listener = new InputHandler();

		var state = {
			ENTER: false,
			SHIFT: false,
			UP: false,
			RIGHT: false,
			DOWN: false,
			LEFT: false,
			W: false,
			A: false,
			S: false,
			D: false
		};

		/**
		 * Returns any number of space-separated [events]
		 * values as a new string of namespaced events
		 */
		function get_namespaced_events( events )
		{
			events = events.split( ' ' );

			for ( var e = 0 ; e < events.length ; e++ ) {
				events[e] += '.Keys-' + timestamp;
			}

			return events.join( ' ' );
		}

		/**
		 * Toggle the key [state] to true/false depending
		 * on whether the [event] is 'keydown' or 'keyup'
		 */
		function set_state( event )
		{
			var key = KeyCodes[event.keyCode] || 'null';

			if ( typeof state[key] !== 'undefined' ) {
				if ( event.type === 'keydown' ) {
					state[key] = true;
				}

				if ( event.type === 'keyup' ) {
					state[key] = false;
				}
			}
		}

		// -- Public: --
		/**
		 * Start listening for inputs
		 */
		this.listen = function()
		{
			if ( !bound ) {
				$( document ).on( get_namespaced_events( 'keydown keyup' ), set_state );
				bound = true;
			}

			return _;
		};

		/**
		 * Stop listening for inputs
		 */
		this.unlisten = function()
		{
			if ( bound ) {
				$( document ).off( get_namespaced_events( 'keydown keyup' ) );
				bound = false;
			}

			return _;
		};

		/**
		 * Check to see if [key] is being held
		 */
		this.holding = function( key )
		{
			return !!state[key];
		};

		/**
		 * Set all key held states to false
		 */
		this.reset = function()
		{
			for ( var key in state ) {
				if ( state.hasOwnProperty( key ) ) {
					state[key] = false;
				}
			}

			return _;
		};
	}

	scope.InputHandler = InputHandler;
	scope.Keys = Keys;
} )( window );