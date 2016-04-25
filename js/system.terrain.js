/**
 * Generates and prerenders terrain for the game's graphics
 */
function Terrain() {
	// Private:
	var _ = this;
	var ogcanvas;
	var timecanvas;
	var tilesize;
	var heightmap;
	var tempmap;
	var lightangle;
	var sealine = 40;
	var treeline = 65;
	// dy and dx for light angle directions
	var direction = {
		n: {y: -1, x: 0},
		s: {y: 1, x: 0},
		e: {y: 0, x: 1},
		w: {y: 0, x: -1},
		nw: {y: -1, x: -1},
		ne: {y: -1, x: 1},
		sw: {y: 1, x: -1},
		se: {y: 1, x: 1}
	};
	// Tile color formulas based on elevation and temperature
	var color = {
		presets: {
			beach: {r: 200, g: 180, b: 70},
			reef: {r: 10, g: 150, b: 160}
		},
		elevation: {
			red: function(v) {
				if (v < sealine) return 30 + Math.round(v/4);
				if (v <= sealine+5) return 180 - 2*v;
				if (v <= treeline) return 80-v;
				if (v <= 80) return 140 - v;
				return 120+v;
			},
			green: function(v) {
				if (v < sealine) return 50 + Math.round(v/4);
				if (v <= sealine+5) return 180-v;
				if (v <= treeline) return 10 + Math.round(2*v);
				if (v <= 80) return 140-v;
				return 100+v;
			},
			blue: function(v) {
				if (v < sealine) return 30 + Math.round(v/4);
				if (v <= sealine+5) return 66-v;
				if (v <= treeline) return Math.round(0.6*v);
				if (v <= 80) return 100-v;
				return 120+v;
			}
		},
		temperature: {
			red: function(t, e) {
				if (e >= 80) return 0;
				if (e > treeline) return -55+t;
				if (e < sealine) return 5+e;
				return -70+t;
			},
			green: function(t, e) {
				if (e >= 80) return 0;
				if (e > treeline) return -50+t;
				if (e < sealine) return 15+e;
				return -125+t;
			},
			blue: function(t, e) {
				if (e >= 80) return 0;
				if (e > treeline) return -65+t;
				if (e < sealine) return 5+e;
				return Math.round(t/25);
			}
		}
	};

	/**
	 * Negative-friendly modulus operation
	 */
	function mod(n, m) {
		return ((n%m)+m)%m;
	}

	/**
	 * Return adjacent tile elevations from height map data
	 */
	function adjacents(data, y, x) {
		return {
			top: data[mod(y-1, data.length)][mod(x, data.length)],
			right: data[mod(y, data.length)][mod(x+1, data.length)],
			bottom: data[mod(y+1, data.length)][mod(x, data.length)],
			left: data[mod(y, data.length)][mod(x-1, data.length)]
		};
	}

	/**
	 * Determine whether a map tile is in sunlight
	 */
	function sunlit(data, y, x) {
		var elevation = data[y][x];
		var dy = direction[lightangle].y;
		var dx = direction[lightangle].x;
		for (var i = 0 ; i < 6 ; i++) {
			var _y = y + dy*i;
			var _x = x + dx*i;
			var height = data[mod(_y, data.length)][mod(_x, data.length)];
			if (height > elevation+i) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation below or equal to [limit]
	 */
	function tilejustabove(data, y, x, limit) {
		var elevation = data[y][x];
		var neighbor = adjacents(data, y, x);
		return (elevation > limit && (neighbor.top <= limit || neighbor.right <= limit || neighbor.bottom <= limit || neighbor.left <= limit));
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation above or equal to [limit]
	 */
	function tilejustbelow(data, y, x, limit) {
		var elevation = data[y][x];
		var neighbor = adjacents(data, y, x);
		return (elevation < limit && (neighbor.top >= limit || neighbor.right >= limit || neighbor.bottom >= limit || neighbor.left >= limit));
	}

	/**
	 * Render the whole map with appropriate coloration and lighting
	 */
	function render() {
		// Create image buffer
		var image = ogcanvas.data.create();
		// Saving info for elevation map
		var height = {
			data: heightmap.data(),
			range: heightmap.heightRange(),
			size: heightmap.size()
		};
		// Saving info for temperature map
		var temp = {
			data: tempmap.data(),
			size: tempmap.size()
		};
		// For scaling any arbitrary elevation range to [0-100]
		var ratio = 100 / height.range;
		var sealevel = Math.round(sealine/ratio);

		var t = Date.now();

		heightmap.scan(function(y, x, elevation){
			// Scale elevation to [0-100] for use by the tile coloration formulas
			var _elevation = Math.round(elevation*ratio);
			// Get temperature and lighting info for this tile
			var tx = mod(y, temp.size);
			var ty = mod(x, temp.size);
			var temperature = 5+temp.data[ty][tx];
			var sun = (_elevation < sealine ? false : _elevation < sealine+6 || sunlit(height.data, y, x));

			// Determine tile coloration
			var hue = {
				r: color.elevation.red(_elevation) + color.temperature.red(temperature, _elevation) + (sun ? 0 : -60),
				g: color.elevation.green(_elevation) + color.temperature.green(temperature, _elevation) + (sun ? 0 : -80),
				b: color.elevation.blue(_elevation) + color.temperature.blue(temperature, _elevation) + (sun ? 0 : -20)
			};

			// Override coloration on specific tiles
			if (_elevation > sealine-6 && _elevation < sealine+6) {
				if (tilejustabove(height.data, y, x, sealevel)) {
					hue = color.presets.beach;
				} else
				if (tilejustbelow(height.data, y, x, sealevel)) {
					hue = color.presets.reef;
				}
			}

			// Top left pixel to start at
			var p = 4*(y*height.size*tilesize*tilesize + x*tilesize);

			for (var py = 0 ; py < tilesize ; py++) {
				for (var px = 0 ; px < tilesize ; px++) {
					// Pixel offset for per-pixel drawing of larger tiles when applicable
					var _p = p + 4*px + 4*py*height.size*tilesize;
					// Write color data into image buffer
					image.data[_p] = hue.r;
					image.data[_p+1] = hue.g;
					image.data[_p+2] = hue.b;
					image.data[_p+3] = 255;
				}
			}
		});

		// Write image buffer data back into the canvas
		ogcanvas.data.put(image);

		console.log((Date.now() - t) + 'ms render');
	}

	function settime(hour) {
		timecanvas.draw.image(ogcanvas.element());
		return;
		/*
		hour = (hour < 0 ? 0 : (hour > 24 ? 24 : hour));
		var lightlevel = Math.abs(12-hour);
		var og = ogcanvas.data.get();
		for (var p = 0 ; p < og.data.length ; p += 4) {
			var avg = Math.round((og.data[p] + og.data[p+1] + og.data[p+2])/3);
			og.data[p] = avg - 12*lightlevel;
			og.data[p+1] = avg - 11*lightlevel;
			og.data[p+2] = avg - 8*lightlevel;
		}
		timecanvas.data.put(og);
		*/
	}

	// Public:
	this.canvas;

	this.setTileSize = function(size) {
		tilesize = size;
		ogcanvas.setSize(tilesize*heightmap.size(), tilesize*heightmap.size());
		timecanvas.setSize(ogcanvas.getSize().width, ogcanvas.getSize().height);
		return _;
	}

	this.setLightSource = function(_light) {
		lightangle = _light;
		return _;
	}

	this.build = function(settings) {
		var t = Date.now();
		// Generate an elevation map
		heightmap = new HeightMap();
		heightmap.seed('height').generate(settings);
		// Generate a temperature map
		tempmap = new HeightMap();
		tempmap.generate({
			iterations: Math.min(settings.iterations-1, 10),
			elevation: 100,
			smoothness: 2,
			concentration: 75,
			repeat: true
		});
		console.log((Date.now() - t) + 'ms generation');
		ogcanvas = new Canvas(document.createElement('canvas'));
		timecanvas = new Canvas(document.createElement('canvas'));
		_.canvas = timecanvas.element();
		return _;
	}

	this.render = function() {
		if (typeof lightangle === 'undefined') {
			lightangle = 'n';
		}
		render();
		settime(2);
		return _;
	}

	this.setTime = function(hour) {
		settime(hour);
	}

	this.size = function() {
		return heightmap.size();
	}

	this.tileSize = function() {
		return tilesize;
	}
}