(function(scope){
	/**
	 * Internal asynchronous script loader resource;
	 * features progress/error/completion handlers
	 */
	function IncludeManager(includes)
	{
		// Private:
		var _ = this;
		var scriptCount = includes.length;
		var loaded = 0;
		var events =
		{
			progress: function(){},
			error: function(){},
			complete: function(){}
		};

		/**
		 * Load an individual script
		 */
		function load_script(file)
		{
			var script = document.createElement('script');
			script.src = file;

			script.onload = function()
			{
				events.progress(file);

				if (++loaded >= scriptCount)
				{
					events.complete();
				}
			};

			script.onerror = function()
			{
				events.error(file);
				document.body.removeChild(script);
			}

			document.body.appendChild(script);
		}

		/**
		 * Load all included scripts
		 */
		function load_scripts()
		{
			for (var s = 0 ; s < scriptCount ; s++)
			{
				load_script(includes[s]);
			}
		}

		// Public:
		this.on = function(event, callback)
		{
			if (typeof events[event] !== 'undefined')
			{
				events[event] = callback;
			}

			return _;
		}

		this.then = function(callback)
		{
			events.complete = callback || events.complete;
			load_scripts();
		}
	}

	/**
	 * Public script loader instance 'factory' function
	 */
	function include(scripts)
	{
		return new IncludeManager(scripts);
	}

	scope.include = include;
})(window);