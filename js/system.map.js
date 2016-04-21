/**
 * A class for generating a 3D topographical map with various parameters
 */
function HeightMap() {
	// Private:
	var _ = this;
	var seed = Date.now();
	var settings = defaultSettings();
	var mean = 0;
	var distribution = 0;
	var map = [];

	/**
	 * Default generator parameters
	 */
	function defaultSettings() {
		return {
			// Number of iterations for to subdivide the map
			iterations: 4,
			// Maximum elevation of points on the map
			elevation: 50,
			// Average point elevation as a percentage of the maximum
			concentration: 50,
			// Smoothness of the landscape, as a value from 1 - 10
			smoothness: 3,
			// Iterations of erosive processes after the primary landscape is formed
			erosion: 1,
			// Whether or not the opposite edges of the map should connect
			repeat: false
		};
	}

	/**
	 * Negative-friendly modulus operation
	 */
	function mod(n, m) {
		return ((n%m)+m)%m;
	}

	/**
	 * A random decimal value from [0-1) cubed. Used to
	 * skew the elevation sampler function toward the
	 * mean by maintaining a smaller-tending deviation.
	 */
	function r3() {
		var r = Math.random();
		return r*r*r;
	}

	/**
	 * Inclusive low <-> high random number generator
	 */
	function rand(low, high) {
		return low + Math.floor(Math.random() * (high - low + 1));
	}

	/**
	 * Keep a value within a certain range
	 */
	function clamp(value, min, max) {
		return (value > max ? max : (value < min ? min : value));
	}

	/**
	 * Grab a point at coordinate [y, x]; wraps out-of-bounds coordinates
	 */
	function getPoint(y, x) {
		return map[mod(y,map.length)][mod(x,map.length)];
	}

	/**
	 * Overwrite a null tile's elevation value. The condition
	 * for null-only values is specified as not to overwrite
	 * the initially generated random edges for tileable maps.
	 */
	function setPoint(y, x, value) {
		if (map[y][x] === null) {
			map[y][x] = clamp(value, 0, settings.elevation);
		}
	}

	/**
	 * Returns the average of a set of numbers
	 */
	function average(set) {
		var sum = 0, i = 0;
		while (typeof set[i] !== 'undefined') {
			if (set[i] === null) {
				set.splice(i, 1);
				continue;
			}
			sum += set[i++];
		}
		return Math.round(sum / set.length);
	}

	/**
	 * Returns the average elevation of four corners
	 * from a central point {point} where each corner
	 * is [unit] tiles away along the x and y axes
	 */
	function corners(point, unit) {
		return average([
			getPoint(point.y - unit, point.x - unit),
			getPoint(point.y - unit, point.x + unit),
			getPoint(point.y + unit, point.x - unit),
			getPoint(point.y + unit, point.x + unit)
		]);
	}

	/**
	 * Returns the average elevation of four
	 * adjacents next to a central point
	 */
	function adjacents(point, unit) {
		return average([
			getPoint(point.y, point.x - unit),
			getPoint(point.y, point.x + unit),
			getPoint(point.y - unit, point.x),
			getPoint(point.y + unit, point.x)
		]);
	}

	/**
	 * Returns a randomly generated elevation value skewed
	 * toward the mean as defined by the max elevation
	 * and the 'average concentration %' parameter
	 */
	function sample() {
		return clamp(mean + Math.round((rand(0,1) == 1 ? -r3()*distribution : r3()*distribution)), 0, settings.elevation);
	}

	/**
	 * Returns a random offset for rough surface formation,
	 * taking the 'smoothness' parameter and magnitude, which
	 * tapers off with fractal iterations, into account
	 */
	function offset(point, magnitude) {
		magnitude = (magnitude < 1 ? 1 : magnitude);
		return Math.round(rand(-8, 8) * settings.smoothness / magnitude);
	}

	/**
	 * Returns a blank map array to be written to
	 */
	function emptyset(size) {
		var set = new Array(size);
		for (var i = 0 ; i < size ; i++) {
			set[i] = new Array(size);
			for (var j = 0 ; j < size ; j++) {
				set[i][j] = null;
			}
		}
		return set;
	}

	/**
	 * Returns a randomly generated 2D elevation line
	 */
	function randline(edgeValue) {
		var line = new Array(Math.pow(2, settings.iterations) + 1);
		line[0] = edgeValue;
		line[line.length - 1] = edgeValue;
		for (var step = 1 ; step <= settings.iterations ; step++) {
			var unit = Math.pow(2, (settings.iterations-step));
			var unit2 = unit * 2;
			var points = Math.pow(2, (step-1));
			for (var p = 0 ; p < points ; p++) {
				var point = unit + unit2*p;
				var left = line[point - unit];
				var right = line[point + unit];
				line[point] = average([left, right]) + offset(null, step);
			}
		}
		return line;
	}

	/**
	 * Generates a random edge for the top and left
	 * sides of the map and 'stitches' them to the
	 * opposite ends with slight height adjustments
	 */
	function wrap(cornerValue) {
		var topline = randline(cornerValue);
		var leftline = randline(cornerValue);
		var size = map.length;
		for (var p = 0 ; p < topline.length ; p++) {
			setPoint(0, p, topline[p]);
			setPoint(size-1, p, topline[p] + offset(null, settings.iterations-1));
		}
		for (var p = 0 ; p < leftline.length ; p++) {
			setPoint(p, 0, leftline[p]);
			setPoint(p, size-1, leftline[p] + offset(null, settings.iterations-1));
		}
	}

	// Public:
	this.seed = function(_seed) {
		seed = _seed;
		return _;
	}

	this.generate = function(_settings) {
		// Determine/bound new parameters
		_settings = _settings || {};

		for (var key in _settings) {
			if (_settings.hasOwnProperty(key) && key !== 'repeat') {
				settings[key] = isNaN(_settings[key]) ? settings[key] : _settings[key];
			}
		}

		settings.iterations = clamp(settings.iterations, 1, 10);
		settings.concentration = clamp(settings.concentration, 0, 100);
		settings.smoothness = clamp(settings.smoothness, 1, 20);
		settings.erosion = clamp(settings.erosion, 0, 10);
		settings.repeat = (typeof _settings.repeat === 'boolean' ? _settings.repeat : false);

		// Generate fractal terrain using diamond-square method
		var size = Math.pow(2, settings.iterations) + 1;
		mean = Math.round(settings.elevation * (settings.concentration / 100));
		distribution = Math.max(mean, settings.elevation - mean);

		map = emptyset(size);

		if (settings.repeat) {
			wrap(sample());
		} else {
			setPoint(0, 0, sample());
			setPoint(0, size-1, sample());
			setPoint(size-1, 0, sample());
			setPoint(size-1, size-1, sample());
		}

		for (var step = 1 ; step <= settings.iterations ; step++) {
			// Get subdivided tile size for this iteration
			var unit = Math.pow(2, (settings.iterations-step));
			var unit2 = unit * 2;
			var tiles = Math.pow(2, (step-1));

			// Diamond (center elevation)
			for (var y = 0 ; y < tiles ; y++) {
				for (var x = 0 ; x < tiles ; x++) {
					var center = {y: unit + unit2 * y, x: unit + unit2 * x};
					var centerHeight = corners(center, unit) + offset(center, step);

					if (Math.random() < 0.75 && step < 4) {
						centerHeight = sample();
					}

					setPoint(center.y, center.x, centerHeight);
				}
			}

			// Square (sides' elevation)
			for (var y = 0 ; y < tiles ; y++) {
				for (var x = 0 ; x < tiles ; x++) {
					var center = {y: unit + unit2 * y, x: unit + unit2 * x};
					var top = {y: center.y - unit, x: center.x};
					var left = {y: center.y, x: center.x - unit};
					var right = {y: center.y, x: center.x + unit};
					var bottom = {y: center.y + unit, x: center.x};

					setPoint(top.y, top.x, adjacents(top, unit) + offset(top, step));
					setPoint(left.y, left.x, adjacents(left, unit) + offset(left, step));
					setPoint(right.y, right.x, adjacents(right, unit) + offset(right, step));
					setPoint(bottom.y, bottom.x, adjacents(bottom, unit) + offset(bottom, step));
				}
			}
		}

		return _;
	}

	this.scan = function(handler) {
		var size = map.length;
		for (var y = 0 ; y < size ; y++) {
			for (var x = 0 ; x < size ; x++) {
				handler(y, x, map[y][x]);
			}
		}
		return _;
	}
}