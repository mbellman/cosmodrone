/**
 * Generates and prerenders terrain for the game scene
 */
function Terrain()
{
	// Private:
	var _ = this;
	var Generator = new RNG();		// Deterministic PRNG
	var ogcanvas;					// Default terrain rendering
	var timecanvas;					// Time-of-day rendering
	var tilesize;					// Pixel size of map tiles
	var heightmap;					// Terrain elevation map
	var tempmap;					// Terrain temperature map
	var lightangle;					// Direction of light source
	var city_probability;			// Prevalence of cities
	var city_max_size;				// Largest city size
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
			reef: {r: 10, g: 150, b: 160},
			city: {r: 90, g: 90, b: 90},
			city2: {r: 255, g: 250, b: 220}
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
	 * Return coordinates for adjacent tiles
	 */
	function adjacent_coordinates(y, x, wrap)
	{
		return {
			top:
			{
				y: mod(y-1, wrap),
				x: mod(x, wrap)
			},
			right:
			{
				y: mod(y, wrap),
				x: mod(x+1, wrap)
			},
			bottom:
			{
				y: mod(y+1, wrap),
				x: mod(x, wrap)
			},
			left:
			{
				y: mod(y, wrap),
				x: mod(x-1, wrap)
			}
		}
	}

	/**
	 * Return adjacent tile elevations from height map data
	 */
	function adjacents(data, y, x)
	{
		var coords = adjacent_coordinates(y, x, data.length);

		return {
			top: data[coords.top.y][coords.top.x],
			right: data[coords.right.y][coords.right.x],
			bottom: data[coords.bottom.y][coords.bottom.x],
			left: data[coords.left.y][coords.left.x]
		};
	}

	/**
	 * Determine whether a map tile is in sunlight
	 */
	function tile_is_lit(data, y, x)
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
	 * Determine whether a map tile should be rendered as a city
	 */
	function tile_is_city(data, y, x, sealevel, treelevel, recursion_level)
	{
		if (--recursion_level > 0)
		{
			var coords = adjacent_coordinates(y, x, data.length);

			return (
				tile_is_city(data, y, x, sealevel, treelevel, 0) &&
				(
					tile_is_city(data, coords.top.y, coords.top.x, sealevel, treelevel, recursion_level) ||
					tile_is_city(data, coords.right.y, coords.right.x, sealevel, treelevel, recursion_level) ||
					tile_is_city(data, coords.bottom.y, coords.bottom.x, sealevel, treelevel, recursion_level) ||
					tile_is_city(data, coords.left.y, coords.left.x, sealevel, treelevel, recursion_level)
				)
			);
		}
		else
		{
			var elevation = data[y][x];
			var neighbor = adjacents(data, y, x);

			return (
				(elevation === sealevel+5) ||
				(elevation < treelevel && neighbor.left === neighbor.right && neighbor.left === neighbor.top && neighbor.left === neighbor.bottom)
			);
		}
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
		// Used to map the heightmap's elevation range to [0-100]
		var ratio = 100 / height.range;
		// Sea line + tree line in heightmap's terms
		var sealevel = Math.round(sealine/ratio);
		var treelevel = Math.round(treeline/ratio);

		var t = Date.now();

		heightmap.scan(function(y, x, elevation)
		{
			// Scale elevation to [0-100] for use by the tile coloration formulas
			var _elevation = Math.round(elevation*ratio);
			// Get temperature and lighting info for this tile
			var tx = mod(y, temp.size);
			var ty = mod(x, temp.size);
			var temperature = 5+temp.data[ty][tx];
			var sun = (_elevation < sealine ? false : _elevation < sealine+6 || tile_is_lit(height.data, y, x));

			// Determine tile coloration
			var hue =
			{
				r: color.elevation.red(_elevation) + color.temperature.red(temperature, _elevation) + (sun ? 0 : -60),
				g: color.elevation.green(_elevation) + color.temperature.green(temperature, _elevation) + (sun ? 0 : -80),
				b: color.elevation.blue(_elevation) + color.temperature.blue(temperature, _elevation) + (sun ? 0 : -20)
			};

			// Override coloration on shoreline tiles
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

			// Override coloration on "city" tiles (determined
			// arbitrarily within the tile_is_city() function)
			if (_elevation > sealine+2 && _elevation < treeline)
			{
				if (tile_is_city(height.data, y, x, sealevel, treelevel, 2))
				{
					var altitude = _elevation-sealine;

					hue =
					{
						r: color.presets.city.r - altitude,
						g: color.presets.city.g - altitude,
						b: color.presets.city.b - altitude
					};
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
	function render_time(hour)
	{
		hour = (hour < 0 ? 0 : (hour > 24 ? 24 : hour));

		var light = ogcanvas.data.get();
		var light_level = 12 - Math.abs(12-hour);
		var city_light_reduction = 30 * (mod(hour-5, 24) - 16);
		var twilight = (light_level === 5);
		var night = (light_level < 5);

		var r = color.time.red(light_level);
		var g = color.time.green(light_level);
		var b = color.time.blue(light_level);

		for (var p = 0 ; p < light.data.length ; p += 4)
		{
			var red = light.data[p];
			var green = light.data[p+1];
			var blue = light.data[p+2];

			if (night && (red > 0 && red === green && red === blue))
			{
				var altitude_light_reduction = Math.pow(clamp(85-red, 0, 85), 2);

				light.data[p] = color.presets.city2.r - city_light_reduction - altitude_light_reduction;
				light.data[p+1] = color.presets.city2.g - city_light_reduction - altitude_light_reduction;
				light.data[p+2] = color.presets.city2.b - city_light_reduction - altitude_light_reduction;

				continue;
			}

			var average = Math.round((red + green + blue) / 3) - 15*(4 - light_level);

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
		ogcanvas = new Canvas(new Element('canvas'));
		timecanvas = new Canvas(new Element('canvas'));
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
		render_time(hour);
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