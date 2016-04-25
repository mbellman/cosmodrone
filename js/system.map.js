/**
 * A class for generating a 3D topographical map with various parameters
 */
function HeightMap() {
	// Private:
	var _ = this;
	var seed = hash(Date.now());
	var settings = defaultsettings();
	var mean = 0;
	var heightskew = 0;
	var map = [];

	/**
	 * Default generator parameters
	 */
	function defaultsettings() {
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
	 * Converts any string or number into a pseudo-random
	 * value from the interval [0, 9007199254740991)
	 */
	function hash(value) {
		value = value.toString();
		var len = value.length;
		var code = [];
		var sum = 0;
		var output = '';
		for (var c = 0 ; c < len; c++) {
			var v = value.charCodeAt(c);
			code[c] = v;
			sum += (v+1);
		}
		sum *= sum;
		for (var c = 0 ; c < len ; c++) {
			var v = code[c];
			output += ((sum % v) ^ v) % v;
		}
		return output % Number.MAX_SAFE_INTEGER;
	}

	/**
	 * Takes any number as input and 'hashes' it as a
	 * pseudo-random number within [0, 9007199254740991)
	 */
	function quickhash(value) {
		return (value * 9999) % Number.MAX_SAFE_INTEGER;
	}

	/**
	 * Re-hashes [seed] and uses the result to
	 * yield a traditional [0, 1) decimal figure
	 */
	function prng() {
		seed = quickhash(seed);
		return seed / Number.MAX_SAFE_INTEGER;
	}

	/**
	 * A pseudo-random decimal value from [0-1) cubed. Used
	 * to skew the elevation sampler function toward the
	 * mean by maintaining a smaller-tending deviation.
	 */
	function r3() {
		var r = prng();
		return r*r*r;
	}

	/**
	 * Inclusive low <-> high random number generator
	 */
	function rand(low, high) {
		return low + Math.floor(prng() * (high - low + 1));
	}

	/**
	 * Keep a value within a certain range
	 */
	function clamp(value, min, max) {
		return (value > max ? max : (value < min ? min : value));
	}

	/**
	 * Negative-friendly modulus operation
	 */
	function mod(n, m) {
		return ((n%m)+m)%m;
	}

	/**
	 * Grab a point at coordinate [y, x]; wraps out-of-bounds coordinates
	 */
	function getpoint(y, x) {
		if (y < 0) y = 0;
		if (y > map.length-1) y = map.length-1;
		if (x < 0) x = 0;
		if (x > map.length-1) x = map.length-1;
		return map[y][x];
	}

	/**
	 * Overwrite a null tile's elevation value. The condition
	 * for null-only values is specified as not to overwrite
	 * the initially generated random edges for tileable maps.
	 */
	function setpoint(y, x, value) {
		if (map[y][x] === null) {
			map[y][x] = clamp(value, 0, settings.elevation);
		}
	}

	/**
	 * Retrieve elevation values for four adjacent tiles to a point
	 */
	function getadjacents(y, x) {
		return {
			top: getpoint(y-1, x),
			right: getpoint(y, x+1),
			bottom: getpoint(y+1, x),
			left: getpoint(y, x-1)
		};
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
			getpoint(point.y - unit, point.x - unit),
			getpoint(point.y - unit, point.x + unit),
			getpoint(point.y + unit, point.x - unit),
			getpoint(point.y + unit, point.x + unit)
		]);
	}

	/**
	 * Returns the average elevation of four adjacents
	 * next to a central point [unit] tiles away
	 */
	function adjacents(point, unit) {
		return average([
			getpoint(point.y, point.x - unit),
			getpoint(point.y, point.x + unit),
			getpoint(point.y - unit, point.x),
			getpoint(point.y + unit, point.x)
		]);
	}

	/**
	 * Returns a randomly picked elevation value skewed
	 * toward the mean as defined by the max elevation
	 * and the 'average concentration %' parameter
	 */
	function sample() {
		return clamp(mean + Math.round((rand(0,1) == 1 ? -r3()*heightskew : r3()*heightskew)), 0, settings.elevation);
	}

	/**
	 * Returns a random offset for rough surface formation,
	 * taking the 'smoothness' parameter and magnitude, which
	 * tapers off with fractal iterations, into account
	 */
	function offset(magnitude) {
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
				line[point] = average([left, right]) + offset(step);
			}
		}
		return line;
	}

	/**
	 * Generates a random edge for the top and left
	 * sides of the map and 'stitches' them to the
	 * opposite ends with slight height adjustments
	 */
	function wrapedges(cornerValue) {
		var topline = randline(cornerValue);
		var leftline = randline(cornerValue);
		var size = map.length;
		for (var p = 0 ; p < topline.length ; p++) {
			setpoint(0, p, topline[p]);
			setpoint(size-1, p, topline[p] + offset(settings.iterations-1));
		}
		for (var p = 0 ; p < leftline.length ; p++) {
			setpoint(p, 0, leftline[p]);
			setpoint(p, size-1, leftline[p] + offset(settings.iterations-1));
		}
	}

	/**
	 * Instance of a single tile's data, with chainable methods
	 */
	function Tile(y, x, value) {
		// Private:
		var _ = this;

		// Public:
		this.x = x;
		this.y = y;
		this.value = value;

		this.justAbove = function(limit) {
			var neighbor = getadjacents(_.y, _.x);
			return (_.value > limit && (neighbor.top <= limit || neighbor.right <= limit || neighbor.bottom <= limit || neighbor.left <= limit));
		}

		this.justBelow = function(limit) {
			var neighbor = getadjacents(_.y, _.x);
			return (_.value < limit && (neighbor.top >= limit || neighbor.right >= limit || neighbor.bottom >= limit || neighbor.left >= limit));
		}
	}

	// Public:
	this.seed = function(_seed) {
		seed = hash(_seed);
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

		settings.iterations = clamp(settings.iterations, 1, 12);
		settings.concentration = clamp(settings.concentration, 0, 100);
		settings.smoothness = clamp(settings.smoothness, 1, 20);
		settings.erosion = clamp(settings.erosion, 0, 10);
		settings.repeat = (typeof _settings.repeat === 'boolean' ? _settings.repeat : false);

		// Generate fractal heightmap using an iterative diamond-square method
		var size = Math.pow(2, settings.iterations) + 1;
		var offsetlimit = Math.max(4, settings.iterations);
		mean = Math.round(settings.elevation * (settings.concentration / 100));
		heightskew = Math.max(mean, settings.elevation - mean);
		map = emptyset(size);

		if (settings.repeat) {
			wrapedges(sample());
		} else {
			setpoint(0, 0, sample());
			setpoint(0, size-1, sample());
			setpoint(size-1, 0, sample());
			setpoint(size-1, size-1, sample());
		}

		for (var step = 1 ; step <= settings.iterations ; step++) {
			// Get subdivided tile size for this iteration
			var unit = Math.pow(2, (settings.iterations-step));
			var unit2 = 2*unit;
			var tiles = Math.pow(2, (step-1));

			// Diamond (center elevation)
			for (var y = 0 ; y < tiles ; y++) {
				for (var x = 0 ; x < tiles ; x++) {
					var center = {y: unit + unit2 * y, x: unit + unit2 * x};
					var centerheight = corners(center, unit) + (step >= offsetlimit ? 0 : offset(step));

					if (prng() < 0.75 && step < Math.max(settings.iterations-5, 4)) {
						// Try and force certain tiles toward the mean
						centerheight = sample();
					}

					setpoint(center.y, center.x, centerheight);
				}
			}

			// Square (sides' elevation)
			for (var y = 0 ; y < tiles ; y++) {
				for (var x = 0 ; x < tiles ; x++) {
					var center = {y: unit + unit2 * y, x: unit + unit2 * x};
					var top = {y: center.y - unit, x: center.x};
					var right = {y: center.y, x: center.x + unit};
					var bottom = {y: center.y + unit, x: center.x};
					var left = {y: center.y, x: center.x - unit};

					var _offset = (step >= offsetlimit ? 0 : offset(step));

					setpoint(top.y, top.x, adjacents(top, unit) + _offset);
					setpoint(right.y, right.x, adjacents(right, unit) + _offset);
					setpoint(bottom.y, bottom.x, adjacents(bottom, unit) + _offset);
					setpoint(left.y, left.x, adjacents(left, unit) + _offset);
				}
			}
		}

		return _;
	}

	this.scan = function(handler, yrange, xrange) {
		var size = map.length;
		xrange = xrange || {start: 0, end: size};
		yrange = yrange || {start: 0, end: size};
		for (var y = yrange.start ; y < yrange.end ; y++) {
			for (var x = xrange.start ; x < xrange.end ; x++) {
				handler(y, x, getpoint(y, x));
			}
		}
		return _;
	}

	this.data = function() {
		return map;
	}

	this.tile = function(y, x) {
		return new Tile(y, x, getpoint(y,x));
	}

	this.heightRange = function() {
		return settings.elevation;
	}

	this.size = function() {
		return map.length;
	}
}