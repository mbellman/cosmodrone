/**
 * A class for generating a 3D topographical map with various parameters
 */
function HeightMap() {
	// Private:
	var _ = this;
	var seed = Date.now();
	var settings = getDefaultSettings();
	var map = [];

	function getDefaultSettings() {
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

	function clamp(value, min, max) {
		return (value > max ? max : (value < min ? min : value));
	}

	function clampPoint(elevation) {
		return clamp(elevation, 0, settings.elevation);
	}

	function getPoint(y, x) {
		if (y < 0) return getPoint(map.length - 1, x);
		if (y >= map.length) return getPoint(0, x);
		if (x < 0) return getPoint(y, map.length - 1);
		if (x >= map.length) return getPoint(y, 0);
		return map[y][x];
	}

	function average(set) {
		var sum = 0;
		for (var i = 0 ; i < set.length ; i++) {
			sum += set[i];
		}
		return Math.round(sum / set.length);
	}

	function averageCorners(point, unit) {
		return average([
			getPoint(point.y - unit, point.x - unit),
			getPoint(point.y - unit, point.x + unit),
			getPoint(point.y + unit, point.x - unit),
			getPoint(point.y + unit, point.x + unit)
		]);
	}

	function averageSides(point, unit) {
		return average([
			getPoint(point.y, point.x - unit),
			getPoint(point.y, point.x + unit),
			getPoint(point.y - unit, point.x),
			getPoint(point.y + unit, point.x)
		]);
	}

	function randomOffset(point, magnitude) {
		return Math.round((Math.random()*settings.elevation) / (4*magnitude)) - Math.round(settings.smoothness/magnitude);
	}

	function FlatTerrain(size) {
		var terrain = new Array(size);
		for (var i = 0 ; i < size ; i++) {
			terrain[i] = new Array(size);
			for (var j = 0 ; j < size ; j++) {
				terrain[i][j] = 0;
			}
		}
		return terrain;
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
		settings.smoothness = clamp(settings.smoothness, 1, 10);
		settings.erosion = clamp(settings.erosion, 0, 10);
		settings.repeat = (typeof _settings.repeat === 'boolean' ? _settings.repeat : false);

		// Generate fractal terrain
		var size = Math.pow(2, settings.iterations) + 1;
		var average = Math.round(settings.elevation * (settings.concentration / 100));

		map = FlatTerrain(size);
		map[0][0] = seed % average + randomOffset({y:0,x:0}, 1);
		map[0][size - 1] = seed % average + randomOffset({y:0,x:size-1}, 1);
		map[size - 1][0] = seed % average + randomOffset({y:size-1,x:0}, 1);
		map[size - 1][size - 1] = seed % average + randomOffset({y:size-1,x:size-1}, 1);

		for (var step = 1 ; step <= settings.iterations ; step++) {
			// Get subdivision size for this iteration
			var unit = Math.pow(2, (settings.iterations - step));
			var unit2 = unit * 2;
			var points = Math.pow(2, (step - 1));

			// Diamond (center elevation)
			for (var y = 0 ; y < points ; y++) {
				for (var x = 0 ; x < points ; x++) {
					var center = {y: unit + unit2 * y, x: unit + unit2 * x};
					var centerHeight = averageCorners(center, unit) + randomOffset(center, step);

					map[center.y][center.x] = clampPoint(centerHeight);
				}
			}

			// Square (sides' elevation)
			for (var y = 0 ; y < points ; y++) {
				for (var x = 0 ; x < points ; x++) {
					var center = {y: unit + unit2 * y, x: unit + unit2 * x};
					var top = {y: center.y - unit, x: center.x};
					var left = {y: center.y, x: center.x - unit};
					var right = {y: center.y, x: center.x + unit};
					var bottom = {y: center.y + unit, x: center.x};

					map[top.y][top.x] = averageSides(top, unit) + randomOffset(top, step);
					map[left.y][left.x] = averageSides(left, unit) + randomOffset(left, step);
					map[right.y][right.x] = averageSides(right, unit) + randomOffset(right, step);
					map[bottom.y][bottom.x] = averageSides(bottom, unit) + randomOffset(bottom, step);
				}
			}
		}

		return _;
	}

	this.scan = function(handler) {
		for (var y = 0 ; y < map.length ; y++) {
			for (var x = 0 ; x < map.length ; x++) {
				handler(y, x, map[y][x]);
			}
		}
		return _;
	}
}