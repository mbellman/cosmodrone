/**
 * A class for generating a 3D topographical map with various parameters
 */
function HeightMap()
{
	// Private:
	var _ = this;
	var Generator = new RNG();                  // Deterministic PRNG
	var settings = default_settings();          // Store default settings
	var mean = 0;                               // Average elevation; recalculated upon initialization with parameters
	var height_skew = 0;                        // Max amount of skew for random height sampler; recalculated upon initialization (see: sample())
	var map = [];                               // Height map data

	/**
	 * Default generator parameters
	 */
	function default_settings()
	{
		return {
			// Number of subdivisions for the heightmap fractal
			iterations: 6,
			// Maximum elevation for the heightmap
			elevation: 50,
			// Average point elevation as a percentage of the maximum
			concentration: 50,
			// Smoothness of the landscape, as a value from 1 - 20
			smoothness: 4,
			// Iterations of erosive processes after the primary landscape is formed
			erosion: 1,
			// Whether or not to wrap the edges of the heightmap
			repeat: false
		};
	}

	/**
	 * Restricts settings as appropriate after initialization
	 */
	function normalize_settings()
	{
		settings.iterations = clamp(settings.iterations, 1, 12);
		settings.concentration = clamp(settings.concentration, 0, 100);
		settings.smoothness = clamp(settings.smoothness, 1, 20);
		settings.erosion = clamp(settings.erosion, 0, 10);
		settings.repeat = (typeof settings.repeat === 'boolean' ? settings.repeat : false);
	}

	/**
	 * A pseudo-random decimal value from [0-1) cubed. Used
	 * to skew the elevation sampler function toward the
	 * mean by providing a smaller-tending multiplier.
	 */
	function r3()
	{
		var r = Generator.random();
		return r*r*r;
	}

	/**
	 * Grab a point at coordinate [y, x]; wraps out-of-bounds coordinates
	 */
	function get_point(y, x)
	{
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
	function set_point(y, x, value)
	{
		if (map[y][x] === null)
		{
			map[y][x] = clamp(value, 0, settings.elevation);
		}
	}

	/**
	 * Retrieve elevation values for four adjacent tiles to a point
	 */
	function get_adjacents(y, x)
	{
		return {
			top: get_point(y-1, x),
			right: get_point(y, x+1),
			bottom: get_point(y+1, x),
			left: get_point(y, x-1)
		};
	}

	/**
	 * Returns the average of an array of numbers
	 */
	function average(set)
	{
		var sum = 0, i = 0;

		while (typeof set[i] !== 'undefined')
		{
			if (set[i] === null)
			{
				set.splice(i, 1);
				continue;
			}

			sum += set[i++];
		}

		return Math.round(sum / set.length);
	}

	/**
	 * Returns the average elevation of four corners
	 * from a central point [point] where each corner
	 * is [unit] tiles away along the x and y axes
	 */
	function corners(point, unit)
	{
		return average(
			[
				get_point(point.y - unit, point.x - unit),
				get_point(point.y - unit, point.x + unit),
				get_point(point.y + unit, point.x - unit),
				get_point(point.y + unit, point.x + unit)
			]
		);
	}

	/**
	 * Returns the average elevation of four adjacents
	 * next to a central point [unit] tiles away
	 */
	function adjacents(point, unit)
	{
		return average(
			[
				get_point(point.y, point.x - unit),
				get_point(point.y, point.x + unit),
				get_point(point.y - unit, point.x),
				get_point(point.y + unit, point.x)
			]
		);
	}

	/**
	 * Returns a randomly picked elevation value skewed
	 * toward the mean as defined by the max elevation
	 * and the 'average concentration %' parameter
	 */
	function sample()
	{
		var value = mean + Math.round((Generator.random(0,1) === 1 ? -r3()*height_skew : r3()*height_skew));
		return clamp(value, 0, settings.elevation);
	}

	/**
	 * Returns a random offset for rough surface formation,
	 * taking the 'smoothness' parameter and magnitude, which
	 * tapers off with fractal iterations, into account
	 */
	function offset(magnitude)
	{
		magnitude = (magnitude < 1 ? 1 : magnitude);
		return Math.round(Generator.random(-8, 8) * settings.smoothness / magnitude);
	}

	/**
	 * Returns a blank map array
	 */
	function empty_map(size)
	{
		var set = new Array(size);
		for (var i = 0 ; i < size ; i++)
		{
			set[i] = new Array(size);
			for (var j = 0 ; j < size ; j++)
			{
				set[i][j] = null;
			}
		}

		return set;
	}

	/**
	 * Returns a randomly generated 2D elevation line
	 */
	function random_line(start_height)
	{
		var line = new Array(Math.pow(2, settings.iterations) + 1);
		line[0] = start_height;
		line[line.length - 1] = start_height;

		for (var step = 1 ; step <= settings.iterations ; step++)
		{
			var unit = Math.pow(2, (settings.iterations-step));
			var unit2 = unit * 2;
			var points = Math.pow(2, (step-1));

			for (var p = 0 ; p < points ; p++)
			{
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
	function wrap_edges(corner_height)
	{
		var top_line = random_line(corner_height);
		var left_line = random_line(corner_height);
		var size = map.length;

		for (var p = 0 ; p < top_line.length ; p++)
		{
			set_point(0, p, top_line[p]);
			set_point(size-1, p, top_line[p] + offset(settings.iterations-1));
		}

		for (var p = 0 ; p < left_line.length ; p++)
		{
			set_point(p, 0, left_line[p]);
			set_point(p, size-1, left_line[p] + offset(settings.iterations-1));
		}
	}

	/**
	 * Instance of a single tile's data, with chainable methods
	 */
	function Tile(y, x, value)
	{
		// Private:
		var _ = this;

		// Public:
		this.x = x;
		this.y = y;
		this.value = value;

		this.justAbove = function(limit)
		{
			var neighbor = get_adjacents(_.y, _.x);
			return (_.value > limit && (neighbor.top <= limit || neighbor.right <= limit || neighbor.bottom <= limit || neighbor.left <= limit));
		}

		this.justBelow = function(limit)
		{
			var neighbor = get_adjacents(_.y, _.x);
			return (_.value < limit && (neighbor.top >= limit || neighbor.right >= limit || neighbor.bottom >= limit || neighbor.left >= limit));
		}
	}

	// Public:
	this.seed = function(_seed)
	{
		Generator.seed(_seed);
		return _;
	}

	this.generate = function(_settings)
	{
		// Determine/bound new parameters
		_settings = _settings || {};

		for (var key in _settings)
		{
			if (_settings.hasOwnProperty(key) && key !== 'repeat')
			{
				settings[key] = isNaN(_settings[key]) ? settings[key] : _settings[key];
			}
		}

		settings.repeat = _settings.repeat || settings.repeat;
		normalize_settings();

		// Start heightmap generation
		var size = Math.pow(2, settings.iterations) + 1;

		mean = Math.round(settings.elevation * (settings.concentration / 100));
		height_skew = Math.max(mean, settings.elevation - mean);
		map = empty_map(size);

		if (settings.repeat)
		{
			wrap_edges(sample());
		}
		else
		{
			set_point(0, 0, sample());
			set_point(0, size-1, sample());
			set_point(size-1, 0, sample());
			set_point(size-1, size-1, sample());
		}

		for (var step = 1 ; step <= settings.iterations ; step++)
		{
			// Get subdivided tile size for this iteration
			var unit = Math.pow(2, (settings.iterations-step));
			var unit2 = 2*unit;
			var tiles = Math.pow(2, (step-1));

			// Diamond (center elevation)
			for (var y = 0 ; y < tiles ; y++)
			{
				for (var x = 0 ; x < tiles ; x++)
				{
					var center = {y: unit + unit2*y, x: unit + unit2*x};
					var centerheight = corners(center, unit) + (step === settings.iterations ? 0 : offset(step));

					if (Generator.random() < 0.75 && step < Math.max(settings.iterations-5, 4))
					{
						// Try and force certain tiles toward the mean
						centerheight = sample();
					}

					set_point(center.y, center.x, centerheight);
				}
			}

			// Square (sides' elevation)
			for (var y = 0 ; y < tiles ; y++)
			{
				for (var x = 0 ; x < tiles ; x++)
				{
					var center = {y: unit + unit2*y, x: unit + unit2*x};
					var top = {y: center.y - unit, x: center.x};
					var right = {y: center.y, x: center.x + unit};
					var bottom = {y: center.y + unit, x: center.x};
					var left = {y: center.y, x: center.x - unit};

					var _offset = (step === settings.iterations ? 0 : offset(step));

					set_point(top.y, top.x, adjacents(top, unit) + _offset);
					set_point(right.y, right.x, adjacents(right, unit) + _offset);
					set_point(bottom.y, bottom.x, adjacents(bottom, unit) + _offset);
					set_point(left.y, left.x, adjacents(left, unit) + _offset);
				}
			}
		}

		return _;
	}

	this.scan = function(handler, yrange, xrange)
	{
		var size = map.length;
		xrange = xrange || {start: 0, end: size};
		yrange = yrange || {start: 0, end: size};

		for (var y = yrange.start ; y < yrange.end ; y++)
		{
			for (var x = xrange.start ; x < xrange.end ; x++)
			{
				handler(y, x, get_point(y, x));
			}
		}

		return _;
	}

	this.data = function()
	{
		return map;
	}

	this.tile = function(y, x)
	{
		return new Tile(y, x, get_point(y,x));
	}

	this.getSize = function()
	{
		return map.length;
	}

	this.getHeightRange = function()
	{
		return settings.elevation;
	}
}