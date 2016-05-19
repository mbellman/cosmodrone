(function(scope){
	/**
	 * Key code -> Key name map
	 */
	var KeyCodes =
	{
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
	 * An input manager allowing for custom key event queues
	 */
	function InputHandler()
	{
		// Private:
		var _ = this;
		var bound = false;
		var events = {};

		/**
		 * Check key input and dispatch appropriate events
		 */
		function handle_input(event)
		{
			var key = KeyCodes[event.keyCode];
			var handlers = events[key];

			if (!!handlers)
			{
				for (var h = 0 ; h < handlers.length ; h++)
				{
					handlers[h](key);
				}
			}
		}

		// Public:
		this.listen = function()
		{
			if (!bound)
			{
				$(document).on('keydown.InputHandler', handle_input);
				bound = true;
			}

			return _;
		};

		this.unlisten = function()
		{
			if (bound)
			{
				$(document).off('keydown.InputHandler');
				bound = false;
			}

			return _;
		}

		this.on = function(key, handler)
		{
			if (!bound)
			{
				listen();
			}

			if (typeof events[key] === 'undefined')
			{
				events[key] = [];
			}

			events[key].push(handler);
			return _;
		}

		this.unbindKey = function(key)
		{
			if (events.hasOwnProperty(key))
			{
				delete events[key];
			}
		}

		this.unbindEvents = function()
		{
			for (var key in events)
			{
				if (events.hasOwnProperty(key))
				{
					delete events[key];
				}
			}

			events = {};
			return _;
		}
	}

	/**
	 * A boolean list of key-press states for common game keys
	 */
	function Keys()
	{
		// Private:
		var _ = this;
		var bound = false;
		var listener = new InputHandler();
		var state =
		{
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
		 * Toggle the key state depending on the event type
		 */
		function set_state(event)
		{
			var key_name = KeyCodes[event.keyCode] || 'null';

			if (typeof state[key_name] !== 'undefined')
			{
				if (event.type === 'keydown')
				{
					state[key_name] = true;
				}

				if (event.type === 'keyup')
				{
					state[key_name] = false;
				}
			}
		}

		// Public:
		this.listen = function()
		{
			if (!bound)
			{
				$(document).on('keydown.Keys keyup.Keys', set_state);
				bound = true;
			}

			return _;
		}

		this.unlisten = function()
		{
			if (bound)
			{
				$(document).off('keydown.Keys keyup.Keys');
				bound = false;
			}

			return _;
		}

		this.holding = function(key)
		{
			return !!state[key];
		}

		this.reset = function()
		{
			for (var key in state)
			{
				if (state.hasOwnProperty(key))
				{
					state[key] = false;
				}
			}

			return _;
		}
	}

	scope.InputHandler = InputHandler;
	scope.Keys = Keys;
})(window);