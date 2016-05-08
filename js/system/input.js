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

	/**
	 * Sets up a listener for key input
	 */
	function listen()
	{
		$(document).on('keydown.InputHandler', handle_input);
		bound = true;
	}

	// Public:
	this.listen = listen;

	this.unlisten = function()
	{
		$(document).off('keydown.InputHandler');
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
	var listener = new InputHandler();
	var state =
	{
		UP: false,
		RIGHT: false,
		DOWN: false,
		LEFT: false
	};
	var map =
	{
		'arrowup': 'UP',
		'arrowright': 'RIGHT',
		'arrowdown': 'DOWN',
		'arrowleft': 'LEFT'
	};

	/**
	 * Toggle the key state depending on the event type
	 */
	function set_state(event)
	{
		var key_name = KeyCodes[event.keyCode];
		var mapped_key = map[key_name] || 'null';

		if (typeof state[mapped_key] !== 'undefined')
		{
			if (event.type === 'keydown')
			{
				state[mapped_key] = true;
			}

			if (event.type === 'keyup')
			{
				state[mapped_key] = false;
			}
		}
	}

	/**
	 * Listen for key events and pass to set_state()
	 */
	function listen()
	{
		$(document).on('keydown.Keys keyup.Keys', set_state);
	}

	// Public:
	this.listen = listen;

	this.unlisten = function()
	{
		$(document).off('keydown.Keys keyup.Keys');
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

var KeyCodes =
{
	37: 'arrowleft',
	38: 'arrowup',
	39: 'arrowright',
	40: 'arrowdown'
};