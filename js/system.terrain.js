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
	var max_city_size = 50;                   // Largest city size (in approximate diameter)
	var city_chunks = [];                     // Regional chunks containing local cities
	var sea_line = 40;                        // Sea level as a percent of max elevation
	var tree_line = 65;                       // Height at which to reduce green as a percent of max elevation

	// Tile color formulas based on elevation, temperature, and time of day
	var color =
	{
		presets:
		{
			beach: {r: 200, g: 180, b: 70},
			reef: {r: 10, g: 150, b: 160},
			city: {r: 70, g: 70, b: 70},
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
				x: x
			},
			right:
			{
				y: y,
				x: mod(x+1, map_size)
			},
			bottom:
			{
				y: mod(y+1, map_size),
				x: x
			},
			left:
			{
				y: y,
				x: mod(x-1, map_size)
			}
		}
	}

	/**
	 * Return [y,x] index for neighboring city chunks
	 */
	function neighbor_chunks(y, x, chunks)
	{
		return [
			// Self
			{
				y: y,
				x: x
			},
			// North
			{
				y: mod(y-1, chunks),
				x: x
			},
			// South
			{
				y: mod(y+1, chunks),
				x: x
			},
			// East
			{
				y: y,
				x: mod(x+1, chunks)
			},
			// West
			{
				y: y,
				x: mod(x-1, chunks)
			},
			// Northwest
			{
				y: mod(y-1, chunks),
				x: mod(x-1, chunks)
			},
			// Northeast
			{
				y: mod(y-1, chunks),
				x: mod(x+1, chunks)
			},
			// Southwest
			{
				y: mod(y+1, chunks),
				x: mod(x-1, chunks)
			},
			// Southeast
			{
				y: mod(x+1, chunks),
				x: mod(x+1, chunks)
			}
		];
	}

	/**
	 * Returns an array of square chunks
	 * representing regions of a heightmap
	 */
	function map_to_chunks(map_size, chunk_size)
	{
		var size = Math.ceil(map_size/chunk_size);
		var chunks = new Array(size);

		for (var y = 0 ; y < size ; y++)
		{
			chunks[y] = new Array(size);
			for (var x = 0 ; x < size ; x++)
			{
				chunks[y][x] = [];
			}
		}

		return chunks;
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
	 * Generates a pseudo-random city layout
	 */
	function generate_city(size)
	{
		// Force odd-sized area for easy center handling
		size = (size % 2 === 0 ? size+1 : size);

		// Set up an empty 2D array of size [size]
		// filled with 5s to express max density
		// (the density of a tile determines its
		// luminosity during night renderings)
		var layout = new Array(size);
		for (var y = 0 ; y < size ; y++)
		{
			layout[y] = new Array(size);
			for (var x = 0 ; x < size ; x++)
			{
				layout[y][x] = 5;
			}
		}

		// Return 1x1 or 2x2 cities as-is
		if (size < 3)
		{
			return layout;
		}

		// Start on larger cities by gradually
		// reducing density from city center
		var center = Math.round(size/2);

		for (var y = 0 ; y < size ; y++)
		{
			for (var x = 0 ; x < size ; x++)
			{
				var dx = center-x;
				var dy = center-y;
				var center_distance = Math.sqrt(dx*dx + dy*dy);

				layout[y][x] -= Math.round(5 * (center_distance/center)) + Generator.random(0, 2);
			}
		}

		// Introduce random roads
		// ...

		return layout;
	}

	/**
	 * Generates [city_count] city areas on the map
	 */
	function generate_cities(sea_level, tree_level)
	{
		var height_data = height_map.data();
		var map_size = height_data.length;
		var total = 0;
		// Size of square partitioned city regions
		var chunk_size = 100;

		city_chunks = map_to_chunks(map_size, chunk_size);

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
			var is_last_quarter = total > Math.max(Math.round(city_count*0.75), 5);
			var min_elevation = sea_level+2;
			var max_elevation = (is_last_quarter ? tree_level-20 : sea_level+6);

			// Check to see if a city can exist here
			if (elevation < min_elevation || elevation > max_elevation)
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

			// Store city location in its respective chunk
			var city_y = location.y + Math.round(city_size/2);
			var city_x = location.x + Math.round(city_size/2);

			var chunk =
			{
				y: Math.floor(city_y / chunk_size),
				x: Math.floor(city_x / chunk_size)
			};

			city_chunks[chunk.y][chunk.x].push(
				{
					y: city_y,
					x: city_x,
					size: city_size
				}
			);

			total++;
		}
	}

	/**
	 * Returns the closest distance between two cities
	 */
	function proper_distance(city1, city2)
	{
		var map_size = height_map.data().length;

		// Direct coordinate distance
		var dx1 = city2.x - city1.x;
		var dy1 = city2.y - city1.y;
		var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);

		// Distance from wrapping across x
		var dx2 = (map_size - city2.x) + city1.x;
		var dy2 = dy1;
		var dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);

		// Distance from wrapping across y
		var dx3 = dx1;
		var dy3 = (map_size - city2.y) + city1.y;
		var dist3 = Math.sqrt(dx3*dx3 + dy3*dy3);

		// Distance from wrapping across x and y
		var dx4 = dx2;
		var dy4 = dy3;
		var dist4 = Math.sqrt(dx4*dx4 + dy4*dy4);

		return minimum(dist1, dist2, dist3, dist4);
	}

	/**
	 * Draws a highway between two cities
	 */
	function generate_road_between(city1, city2, distance, height_data, sea_level)
	{
		var map_size = height_data.length;

		var move_y = (city2.y - city1.y) < (map_size - city2.y + city1.y) ? 1 : -1;
		var move_x = (city2.x - city1.x) < (map_size - city2.x + city1.x) ? 1 : -1;

		var dx = Math.min(city2.x - city1.x, (map_size - city2.x) + city1.x);
		var dy = Math.min(city2.y - city1.y, (map_size - city2.y) + city1.y);

		var d = 0;
		var offset =
		{
			y: Generator.random(-1, 1),
			x: Generator.random(-1, 1)
		};

		while(d < distance)
		{
			var ratio = d/distance;
			var remoteness = Math.sin(Math.PI * ratio);

			var position =
			{
				y: mod(city1.y + Math.round(move_y * dy * ratio) + offset.y, map_size),
				x: mod(city1.x + Math.round(move_x * dx * ratio) + offset.x, map_size)
			};

			if (height_data[position.y][position.x] > sea_level)
			{
				var color_reduction = Math.round(25 * remoteness);

				var hue =
				{
					r: color.presets.city.r - color_reduction,
					g: color.presets.city.g - color_reduction,
					b: color.presets.city.b - color_reduction
				};

				og_canvas.draw.rectangle(position.x, position.y, 1, 1).fill(rgb(hue.r, hue.g, hue.b));
			}

			d += 1 + Math.floor(3*remoteness);

			offset.y += Generator.random(-1, 1);
			offset.x += Generator.random(-1, 1);
		}
	}

	/**
	 * Generates highways between nearby cities
	 */
	function generate_roads(sea_level)
	{
		var height_data = height_map.data();
		var chunks = city_chunks.length;

		var t = Date.now();
		var roads = 0;

		// Iterate over all chunk regions
		for (var y = 0 ; y < chunks ; y++)
		{
			for (var x = 0 ; x < chunks ; x++)
			{
				var chunk = city_chunks[y][x];
				var neighbor = neighbor_chunks(y, x, chunks);

				// Iterate over cities in this chunk
				for (var c = 0 ; c < chunk.length ; c++)
				{
					var city1 = chunk[c];

					// Now iterate over all neighboring city chunks
					// (including self) and check city distances
					for (var n = 0 ; n < neighbor.length ; n++)
					{
						var neighbor_cities = city_chunks[neighbor[n].y][neighbor[n].x];

						// Finally iterate over all cities from a neighbor chunk
						for (var c2 = 0 ; c2 < neighbor_cities.length ; c2++)
						{
							var city2 = neighbor_cities[c2];
							var city_distance = proper_distance(city1, city2);

							if (city_distance < 100 && city2.x > city1.x && (Math.abs(city2.size - city1.size) < 10 || Generator.random() < 0.2))
							{
								roads++;
								generate_road_between(city1, city2, city_distance, height_data, sea_level);
							}
						}
					}
				}
			}
		}

		console.log(roads + ' roads in ' + (Date.now()-t) + 'ms');
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

			// Special coloration for shoreline tiles
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

			// Coloration for coastal towns and roads
			if (_elevation > sea_line+2 && _elevation < sea_line+6 && Generator.random() < 0.2)
			{
				var light_reduction = Generator.random(0, 20) + (_elevation !== sea_line+4 ? 20 : 0);

				hue =
				{
					r: color.presets.city.r - light_reduction,
					g: color.presets.city.g - light_reduction,
					b: color.presets.city.b - light_reduction
				};
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
		// Generate random city centers and
		// roads separately from the heightmap
		generate_cities(sea_level, tree_level);
		generate_roads(sea_level);
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

			//  Nighttime city lighting
			if (night && (red > 0 && red === green && red === blue))
			{
				var density_light_reduction = Math.pow(clamp(65-red, 0, 65), 2);

				light.data[p] = color.presets.city2.r - city_light_reduction - density_light_reduction;
				light.data[p+1] = color.presets.city2.g - city_light_reduction - density_light_reduction;
				light.data[p+2] = color.presets.city2.b - city_light_reduction - density_light_reduction;

				continue;
			}

			// Normal lighting
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