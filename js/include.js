/**
 * Asynchronous script loader
 *
 * Returns an instance with chainable on() event
 * delegation and a then() completion callback.
 */
function include(scripts) {
	function IncludeManager(includes) {
		// Private:
		var _ = this;
		var scriptCount = includes.length;
		var loaded = 0;
		var e = {
			progress: function(){},
			error: function(){},
			complete: function(){}
		};

		function loadOne(file) {
			var tag = document.createElement('script');
			tag.src = file;
			tag.onload = function(){
				e.progress(file);
				if (++loaded >= scriptCount) {
					e.complete();
				}
			};
			tag.onerror = function(){
				e.error(file);
				document.body.removeChild(tag);
			}
			document.body.appendChild(tag);
		}

		function loadAll() {
			for (var s = 0 ; s < scriptCount ; s++) {
				loadOne(includes[s]);
			}
		}

		// Public:
		this.on = function(event, callback) {
			if (typeof e[event] !== 'undefined') {
				e[event] = callback;
			}
			return _;
		}

		this.then = function(callback) {
			e.complete = callback || e.complete;
			loadAll();
		}
	}

	return new IncludeManager(scripts);
}