/**
 * Asynchronous script loader
 *
 * Returns an instance with chainable on() event delegation and a then() completion callback.
 */
function include(scripts) {
	function IncludeManager(includes) {
		// Private:
		var _ = this;
		var scriptCount = includes.length;
		var loaded = 0;
		var events = {
			progress: function(){},
			error: function(){},
			complete: function(){}
		};

		function loadScript(file) {
			var script = document.createElement('script');
			script.src = file;
			script.onload = function(){
				events.progress(file);
				if (++loaded >= scriptCount) {
					events.complete();
				}
			};
			script.onerror = function(){
				events.error(file);
				document.body.removeChild(script);
			}
			document.body.appendChild(script);
		}

		function loadScripts() {
			for (var s = 0 ; s < scriptCount ; s++) {
				loadScript(includes[s]);
			}
		}

		// Public:
		this.on = function(event, callback) {
			if (typeof events[event] !== 'undefined') {
				events[event] = callback;
			}
			return _;
		}

		this.then = function(callback) {
			events.complete = callback || events.complete;
			loadScripts();
		}
	}

	return new IncludeManager(scripts);
}