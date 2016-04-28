/**
 * Generates and prerenders terrain for the game scene
 */
function Terrain()
{
	// Private:
	var _ = this;
	var Generator = new RNG();                // Deterministic PRNG
	var og_canvas;                            // Default terrain rendering
	var time_canvas;                          // Time-of-day rendering
	var tile_size;                            // Pixel size of map tiles
	var height_map;                           // Terrain elevation map
	var temp_map;                             // Terrain temperature map
	var light_angle;                          // Angle of light source
	var city_count = 400;                     // Number of cities
	var max_city_size = 40;                   // Largest city size (in approximate diameter)
	var sea_line = 40;                        // Sea level as a percent of max elevation
	var tree_line = 65;                       // Height at which to reduce green as a percent of max elevation

	// Tile color formulas based on elevation, temperature, and time of day
	var color =
	{
		presets:
		{
			beach: {r: 200, g: 180, b: 70},
			reef: {r: 10, g: 150, b: 160},
			city: {r: 80, g: 80, b: 80},
			city2: {r: 255, g: 250, b: 205}
		},
		elevation:
		{
			red: function(e)
			{
				if (e < sea_line) return 30 + Math.round(e/4);
				if (e <= sea_line+5) return 180 - 2*e;
				if (e <= tree_line) return 80-e;
				if (e <= 80) return 140 - e;
				return 120+e;
			},
			green: function(e)
			{
				if (e < sea_line) return 50 + Math.round(e/4);
				if (e <= sea_line+5) return 180-e;
				if (e <= tree_line) return 10 + Math.round(2*e);
				if (e <= 80) return 140-e;
				return 100+e;
			},
			blue: function(e)
			{
				if (e < sea_line) return 30 + Math.round(e/4);
				if (e <= sea_line+5) return 66-e;
				if (e <= tree_line) return Math.round(0.6*e);
				if (e <= 80) return 100-e;
				return 120+e;
			}
		},
		temperature:
		{
			red: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > tree_line) return -55+t;
				if (e < sea_line) return 95-t-(sea_line-e);
				return -70+t;
			},
			green: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > tree_line) return -50+t;
				if (e < sea_line) return 110-Math.round(t/2)-(sea_line-e);
				return -125+t;
			},
			blue: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > tree_line) return -65+t;
				if (e < sea_line) return 70-Math.round(t/3)-(sea_line-e);
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
	 * Return formatted RGB string from three color parts
	 */
	function rgb(r, g, b)
	{
		return 'rgb('+r+','+g+','+b+')';
	}

	/**
	 * Return coordinates for adjacent tiles
	 */
	function adjacent_coordinates(y, x, map_size)
	{
		return {
			top:
			{
				y: mod(y-1, map_size),
				x: mod(x, map_size)
			},
			right:
			{
				y: mod(y, map_size),
				x: mod(x+1, map_size)
			},
			bottom:
			{
				y: mod(y+1, map_size),
				x: mod(x, map_size)
			},
			left:
			{
				y: mod(y, map_size),
				x: mod(x-1, map_size)
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
		var map_size = data.length;

		for (var i = 0 ; i < 6 ; i++)
		{
			var _y = Math.round(y - Math.sin(light_angle)*(i+1));
			var _x = Math.round(x + Math.cos(light_angle)*(i+1));

			var height = data[mod(_y, map_size)][mod(_x, map_size)];

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

		return (
			elevation > limit &&
			(neighbor.top <= limit || neighbor.right <= limit || neighbor.bottom <= limit || neighbor.left <= limit)
		);
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation above or equal to [limit]
	 */
	function tile_just_below(data, y, x, limit)
	{
		var elevation = data[y][x];
		var neighbor = adjacents(data, y, x);

		return (
			elevation < limit &&
			(neighbor.top >= limit || neighbor.right >= limit || neighbor.bottom >= limit || neighbor.left >= limit)
		);
	}

	/**
	 * Generates a pseudo-random city structure
	 */
	function generate_city(size)
	{
		// Force odd-sized area for easy center handling
		size = (size % 2 === 0 ? size+1 : size);

		// Set up an empty 2D array of size [size]
		// filled with 5s to express max density
		// (the density of a tile determines its
		// luminosity during night renderings)
		var structure = new Array(size);
		for (var y = 0 ; y < size ; y++)
		{
			structure[y] = new Array(size);
			for (var x = 0 ; x < size ; x++)
			{
				structure[y][x] = 5;
			}
		}

		// Return 1x1 or 2x2 cities as-is
		if (size < 3)
		{
			return structure;
		}

		// For larger cities, gradually reduce
		// the density in a controlled manner as
		// we radiate outward from the center
		var radius = Math.floor(size/2);
		var spokes = Generator.random(5, 8);

		for (var y = 0 ; y < size ; y++)
		{
			for (var x = 0 ; x < size ; x++)
			{
				var dx = radius-x;
				var dy = radius-y;
				var center_distance = Math.sqrt(dx*dx + dy*dy);
				var ratio = center_distance/radius;
				var angle = Math.atan2(dx, dy);

				// Create periodic "rings" around the center hub
				if (center_distance < radius && Math.sin((center_distance - 2*Generator.random())) > 0.6)
				{
					structure[y][x] = Math.round(Generator.random(1, 5) * (1-(ratio/2)));
					continue;
				}

				// Create periodic "spokes" from the center outward
				if (center_distance < radius && Math.sin(spokes*angle) > 0.6)
				{
					structure[y][x] = Math.round(Generator.random(1, 5) * (1-(0.75*ratio)));
					continue;
				}

				// Perform random density reduction on remaining tiles
				structure[y][x] -= clamp(Math.ceil(5 * ratio), 0, 5) + Generator.random(0, 2);
			}
		}

		return structure;
	}

	/**
	 * Generates [city_count] city areas on the map
	 */
	function generate_cities(sea_level, tree_level)
	{
		var height_data = height_map.data();
		var map_size = height_data.length;
		var total = 0;

		while (total <= city_count)
		{
			// Pick a random spot for the city
			var location =
			{
				y: Generator.random(0, map_size-1),
				x: Generator.random(0, map_size-1)
			};

			// Skew more cities toward the coastal regions
			var elevation = height_data[location.y][location.x];
			var last_quarter = total > Math.max(Math.round(city_count*0.75), 5);
			var minimum = sea_level+2;
			var maximum = (last_quarter ? tree_level-5 : sea_level+6);

			// Check to see if a city can exist here
			if (elevation < minimum || elevation > maximum)
			{
				continue;
			}

			// Pick a random size (within range) and generate the layout
			var r = Generator.random();
			var city_size = 1 + Math.ceil((r*r*r) * Generator.random(0, max_city_size));
			var city_layout = generate_city(city_size);

			// Draw the layout directly onto og_canvas
			for (var y = 0 ; y < city_layout.length ; y++)
			{
				for (var x = 0 ; x < city_layout.length ; x++)
				{
					var tile =
					{
						y: mod(location.y+y, map_size),
						x: mod(location.x+x, map_size)
					};

					// Regardless of the overall city layout,
					// only draw on tiles above sea level
					if (height_data[tile.y][tile.x] >= sea_level)
					{
						var color_reduction = 6 * (5 - city_layout[y][x]);

						var hue =
						{
							r: color.presets.city.r - color_reduction,
							g: color.presets.city.g - color_reduction,
							b: color.presets.city.b - color_reduction
						};

						// Only draw tiles above a certain density
						if (city_layout[y][x] > 0)
						{
							og_canvas.draw.rectangle(tile.x, tile.y, 1, 1).fill(rgb(hue.r, hue.g, hue.b));
						}
					}
				}
			}

			total++;
		}
	}

	/**
	 * Render the whole map with appropriate coloration and lighting
	 */
	function render()
	{
		// Create image buffer
		var image = og_canvas.data.create();
		// Saving info for elevation map
		var height =
		{
			data: height_map.data(),
			range: height_map.heightRange(),
			size: height_map.size()
		};
		// Saving info for temperature map
		var climate =
		{
			data: temp_map.data(),
			size: temp_map.size()
		};
		// Used to map the heightmap's elevation range to [0-100]
		var ratio = 100 / height.range;
		// Sea line + tree line in heightmap's terms
		var sea_level = Math.round(sea_line/ratio);
		var tree_level = Math.round(tree_line/ratio);

		var t = Date.now();

		height_map.scan(function(y, x, elevation)
		{
			// Scale elevation to [0-100] for use by the tile coloration formulas
			var _elevation = Math.round(elevation*ratio);
			// Get temperature and lighting info for this tile
			var tx = mod(y, climate.size);
			var ty = mod(x, climate.size);
			var temperature = 5 + climate.data[ty][tx];
			var sun = (_elevation < sea_line ? false : _elevation < sea_line+6 || tile_is_lit(height.data, y, x));

			// Determine tile coloration
			var hue =
			{
				r: color.elevation.red(_elevation) + color.temperature.red(temperature, _elevation) + (sun ? 0 : -60),
				g: color.elevation.green(_elevation) + color.temperature.green(temperature, _elevation) + (sun ? 0 : -80),
				b: color.elevation.blue(_elevation) + color.temperature.blue(temperature, _elevation) + (sun ? 0 : -20)
			};

			// Override coloration on shoreline tiles
			if (_elevation > sea_line-6 && _elevation < sea_line+6)
			{
				if (tile_just_above(height.data, y, x, sea_level))
				{
					hue = color.presets.beach;
				}
				else
				if (tile_just_below(height.data, y, x, sea_level))
				{
					hue = color.presets.reef;
				}
			}

			// Top left pixel to start at
			var p = 4*(y*height.size*tile_size*tile_size + x*tile_size);

			for (var py = 0 ; py < tile_size ; py++)
			{
				for (var px = 0 ; px < tile_size ; px++)
				{
					// Sub-tile offset for per-pixel drawing of larger tiles
					var _p = p + 4*px + 4*py*height.size*tile_size;
					// Write color data into image buffer
					image.data[_p] = hue.r;
					image.data[_p+1] = hue.g;
					image.data[_p+2] = hue.b;
					image.data[_p+3] = 255;
				}
			}
		});

		// Write image buffer data back into the canvas
		og_canvas.data.put(image);
		// Generate random city centers separately from the heightmap
		generate_cities(sea_level, tree_level);
		// Take the composited heightmap
		time_canvas.data.put(og_canvas.data.get());

		console.log((Date.now() - t) + 'ms render');
	}

	/**
	 * Re-render the terrain to [time_canvas]
	 * with a different time-of-day setting
	 */
	function render_time(hour)
	{
		hour = (hour < 0 ? 0 : (hour > 24 ? 24 : hour));

		// Various conditions and presets
		var light = og_canvas.data.get();
		var light_level = 12 - Math.abs(12-hour);
		var city_light_reduction = 30 * (mod(hour-8, 24) - 16);
		var twilight = (light_level === 5);
		var night = (light_level < 5);

		// Default light level color
		var r = color.time.red(light_level);
		var g = color.time.green(light_level);
		var b = color.time.blue(light_level);

		for (var p = 0 ; p < light.data.length ; p += 4)
		{
			var red = light.data[p];
			var green = light.data[p+1];
			var blue = light.data[p+2];

			// Account for city lights during the nighttime
			if (night && (red > 0 && red === green && red === blue))
			{
				var altitude_light_reduction = Math.pow(clamp(75-red, 0, 75), 2);

				light.data[p] = color.presets.city2.r - city_light_reduction - altitude_light_reduction;
				light.data[p+1] = color.presets.city2.g - city_light_reduction - altitude_light_reduction;
				light.data[p+2] = color.presets.city2.b - city_light_reduction - altitude_light_reduction;

				continue;
			}

			// Normal light coloration
			var average = Math.round((red + green + blue) / 3) - 15*(4 - light_level);

			light.data[p] = r + (twilight ? Math.round((red + average) / 2) : (night ? average : red));
			light.data[p+1] = g + (twilight ? Math.round((green + average) / 2) : (night ? average : green));
			light.data[p+2] = b + (twilight ? Math.round((blue + average) / 2) : (night ? average : blue));
		}

		time_canvas.data.put(light);
	}

	// Public:
	this.canvas;

	this.build = function(settings)
	{
		var t = Date.now();
		// Generate an elevation map
		height_map = new HeightMap();
		height_map.seed('height').generate(settings);
		// Generate a temperature map
		temp_map = new HeightMap();
		temp_map.generate(
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
		og_canvas = new Canvas(new Element('canvas'));
		time_canvas = new Canvas(new Element('canvas'));
		_.canvas = time_canvas.element();
		// Seed the PRNG
		Generator.seed('height');
		return _;
	}

	this.setTileSize = function(size)
	{
		tile_size = size;
		og_canvas.setSize(tile_size*height_map.size(), tile_size*height_map.size());
		time_canvas.setSize(og_canvas.getSize().width, og_canvas.getSize().height);
		return _;
	}

	this.setLightAngle = function(angle)
	{
		light_angle = Math.PI/180 * angle;
		return _;
	}

	this.setTime = function(hour)
	{
		render_time(hour);
		return _;
	}

	this.render = function()
	{
		if (isNaN(light_angle)) light_angle = Math.PI/2;
		render();
		return _;
	}

	this.size = function()
	{
		return height_map.size();
	}

	this.tileSize = function()
	{
		return tile_size;
	}
}