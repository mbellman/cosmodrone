/**
 * Generates and prerenders terrain for the game scene
 */
function Terrain()
{
	// Private:
	var _ = this;
	var ogcanvas;					// Default terrain rendering
	var timecanvas;					// Time-of-day rendering
	var tilesize;					// Pixel size of map tiles
	var heightmap;					// Terrain elevation map
	var tempmap;					// Terrain temperature map
	var lightangle;					// Direction of light source
	var sealine = 40;				// Sea level as a percent of max elevation
	var treeline = 65;				// Height at which to reduce green as a percent of max elevation

	// dy and dx for light angle directions
	var direction =
	{
		n: {y: -1, x: 0},
		s: {y: 1, x: 0},
		e: {y: 0, x: 1},
		w: {y: 0, x: -1},
		nw: {y: -1, x: -1},
		ne: {y: -1, x: 1},
		sw: {y: 1, x: -1},
		se: {y: 1, x: 1}
	};
	// Tile color formulas based on elevation, temperature, and time of day
	var color =
	{
		presets:
		{
			beach: {r: 200, g: 180, b: 70},
			reef: {r: 10, g: 150, b: 160}
		},
		elevation:
		{
			red: function(e)
			{
				if (e < sealine) return 30 + Math.round(e/4);
				if (e <= sealine+5) return 180 - 2*e;
				if (e <= treeline) return 80-e;
				if (e <= 80) return 140 - e;
				return 120+e;
			},
			green: function(e)
			{
				if (e < sealine) return 50 + Math.round(e/4);
				if (e <= sealine+5) return 180-e;
				if (e <= treeline) return 10 + Math.round(2*e);
				if (e <= 80) return 140-e;
				return 100+e;
			},
			blue: function(e)
			{
				if (e < sealine) return 30 + Math.round(e/4);
				if (e <= sealine+5) return 66-e;
				if (e <= treeline) return Math.round(0.6*e);
				if (e <= 80) return 100-e;
				return 120+e;
			}
		},
		temperature:
		{
			red: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > treeline) return -55+t;
				if (e < sealine) return 5+e;
				return -70+t;
			},
			green: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > treeline) return -50+t;
				if (e < sealine) return 25+e;
				return -125+t;
			},
			blue: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > treeline) return -65+t;
				if (e < sealine) return 20+e;
				return Math.round(t/25);
			}
		},
		time:
		{
			red: function(h)
			{
				if (h > 4) return -1 * Math.round(0.0001*Math.pow(h-12, 6));
				return -140;
			},
			green: function(h)
			{
				if (h > 4) return -1 * Math.round(0.03*Math.pow(h-12, 4));
				return -100;
			},
			blue: function(h)
			{
				if (h > 4) return -1 * Math.round(Math.pow(h-12, 2));
				return -50;
			}
		}
	};

	/**
	 * Return adjacent tile elevations from height map data
	 */
	function adjacents(data, y, x)
	{
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
	function sunlit(data, y, x)
	{
		var elevation = data[y][x];
		var dy = direction[lightangle].y;
		var dx = direction[lightangle].x;

		for (var i = 0 ; i < 6 ; i++)
		{
			var _y = y + dy*i;
			var _x = x + dx*i;
			var height = data[mod(_y, data.length)][mod(_x, data.length)];

			if (height > elevation+i) return false;
		}

		return true;
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation below or equal to [limit]
	 */
	function tile_just_above(data, y, x, limit)
	{
		var elevation = data[y][x];
		var neighbor = adjacents(data, y, x);
		return (elevation > limit && (neighbor.top <= limit || neighbor.right <= limit || neighbor.bottom <= limit || neighbor.left <= limit));
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation above or equal to [limit]
	 */
	function tile_just_below(data, y, x, limit)
	{
		var elevation = data[y][x];
		var neighbor = adjacents(data, y, x);
		return (elevation < limit && (neighbor.top >= limit || neighbor.right >= limit || neighbor.bottom >= limit || neighbor.left >= limit));
	}

	/**
	 * Render the whole map with appropriate coloration and lighting
	 */
	function render()
	{
		// Create image buffer
		var image = ogcanvas.data.create();
		// Saving info for elevation map
		var height =
		{
			data: heightmap.data(),
			range: heightmap.heightRange(),
			size: heightmap.size()
		};
		// Saving info for temperature map
		var temp =
		{
			data: tempmap.data(),
			size: tempmap.size()
		};
		// For scaling any arbitrary elevation range to [0-100]
		var ratio = 100 / height.range;
		var sealevel = Math.round(sealine/ratio);

		var t = Date.now();

		heightmap.scan(function(y, x, elevation)
		{
			// Scale elevation to [0-100] for use by the tile coloration formulas
			var _elevation = Math.round(elevation*ratio);
			// Get temperature and lighting info for this tile
			var tx = mod(y, temp.size);
			var ty = mod(x, temp.size);
			var temperature = 5+temp.data[ty][tx];
			var sun = (_elevation < sealine ? false : _elevation < sealine+6 || sunlit(height.data, y, x));

			// Determine tile coloration
			var hue =
			{
				r: color.elevation.red(_elevation) + color.temperature.red(temperature, _elevation) + (sun ? 0 : -60),
				g: color.elevation.green(_elevation) + color.temperature.green(temperature, _elevation) + (sun ? 0 : -80),
				b: color.elevation.blue(_elevation) + color.temperature.blue(temperature, _elevation) + (sun ? 0 : -20)
			};

			// Override coloration on specific tiles
			if (_elevation > sealine-6 && _elevation < sealine+6)
			{
				if (tile_just_above(height.data, y, x, sealevel))
				{
					hue = color.presets.beach;
				}
				else
				if (tile_just_below(height.data, y, x, sealevel))
				{
					hue = color.presets.reef;
				}
			}

			// Top left pixel to start at
			var p = 4*(y*height.size*tilesize*tilesize + x*tilesize);

			for (var py = 0 ; py < tilesize ; py++)
			{
				for (var px = 0 ; px < tilesize ; px++)
				{
					// Sub-tile offset for per-pixel drawing of larger tiles
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
		timecanvas.data.put(image);

		console.log((Date.now() - t) + 'ms render');
	}

	/**
	 * Re-render the terrain to [timecanvas]
	 * with a different time-of-day setting
	 */
	function set_time(hour)
	{
		hour = (hour < 0 ? 0 : (hour > 24 ? 24 : hour));

		var light = ogcanvas.data.get();
		var lightlevel = 12 - Math.abs(12-hour);
		var twilight = (lightlevel === 5);
		var night = (lightlevel < 5);
		var r = color.time.red(lightlevel);
		var g = color.time.green(lightlevel);
		var b = color.time.blue(lightlevel);

		for (var p = 0 ; p < light.data.length ; p += 4)
		{
			var average = Math.round((light.data[p] + light.data[p+1] + light.data[p+2]) / 3) - 15*(4 - lightlevel);

			var red = light.data[p];
			var green = light.data[p+1];
			var blue = light.data[p+2];

			light.data[p] = r + (twilight ? Math.round((red + average) / 2) : (night ? average : red));
			light.data[p+1] = g + (twilight ? Math.round((green + average) / 2) : (night ? average : green));
			light.data[p+2] = b + (twilight ? Math.round((blue + average) / 2) : (night ? average : blue));
		}

		timecanvas.data.put(light);
	}

	// Public:
	this.canvas;

	this.build = function(settings)
	{
		var t = Date.now();
		// Generate an elevation map
		heightmap = new HeightMap();
		heightmap.seed('height').generate(settings);
		// Generate a temperature map
		tempmap = new HeightMap();
		tempmap.generate(
			{
				iterations: Math.min(settings.iterations-1, 10),
				elevation: 100,
				smoothness: 2,
				concentration: 75,
				repeat: true
			}
		);
		console.log((Date.now() - t) + 'ms generation');
		// Target for primary lighting render
		ogcanvas = new Canvas(document.createElement('canvas'));
		timecanvas = new Canvas(document.createElement('canvas'));
		_.canvas = timecanvas.element();
		return _;
	}

	this.setTileSize = function(size)
	{
		tilesize = size;
		ogcanvas.setSize(tilesize*heightmap.size(), tilesize*heightmap.size());
		timecanvas.setSize(ogcanvas.getSize().width, ogcanvas.getSize().height);
		return _;
	}

	this.setLightSource = function(_light)
	{
		lightangle = _light;
		return _;
	}

	this.setTime = function(hour)
	{
		set_time(hour);
		return _;
	}

	this.render = function()
	{
		if (typeof lightangle === 'undefined') lightangle = 'n';
		render();
		return _;
	}

	this.size = function()
	{
		return heightmap.size();
	}

	this.tileSize = function()
	{
		return tilesize;
	}
}