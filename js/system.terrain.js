/**
 * Generates and prerenders terrain for the game scene
 */
function Terrain()
{
	// Private:
	var _ = this;
	var Generator = new RNG();                // Deterministic PRNG
	var height_canvas;                        // Default terrain rendering
	var city_canvas;                          // City layer rendering
	var cloud_canvas;                         // Cloud layer rendering
	var time_canvas;                          // Time-of-day rendering (composite of heightmap, cities, and clouds)
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
			city: {r: 50, g: 50, b: 50},
			city2: {r: 255, g: 250, b: 170}
		},
		elevation:
		{
			red: function(e)
			{
				if (e < sea_line) return 20 + Math.round(e/4);
				if (e <= sea_line+5) return 180 - 2*e;
				if (e <= tree_line) return 80-e;
				if (e <= 80) return 140 - e;
				return 110+e;
			},
			green: function(e)
			{
				if (e < sea_line) return 40 + Math.round(e/4);
				if (e <= sea_line+5) return 180-e;
				if (e <= tree_line) return 10 + Math.round(2*e);
				if (e <= 80) return 140-e;
				return 90+e;
			},
			blue: function(e)
			{
				if (e < sea_line) return 25 + Math.round(e/4);
				if (e <= sea_line+5) return 66-e;
				if (e <= tree_line) return Math.round(0.6*e);
				if (e <= 80) return 100-e;
				return 110+e;
			}
		},
		temperature:
		{
			red: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > tree_line) return -55+t;
				if (e < sea_line) return 95-t-(sea_line-e);
				return -65+t;
			},
			green: function(t, e)
			{
				if (e >= 80) return 0;
				if (e > tree_line) return -50+t;
				if (e < sea_line) return 110-Math.round(t/2)-(sea_line-e);
				return -130+t;
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

				layout[y][x] -= (Math.round(10 * (center_distance/center)) - Generator.random(0, 2));
			}
		}

		return layout;
	}

	/**
	 * Generates and renders [city_count] city areas on the map
	 */
	function generate_cities(sea_level, tree_level)
	{
		var height_data = height_map.data();
		var map_size = height_data.length;
		var total = 0;
		// Size of partitioned city regions
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
			var min_elevation = (is_last_quarter ? sea_level+8 : sea_level+2);
			var max_elevation = (is_last_quarter ? tree_level-20 : sea_level+6);
			var max_size = is_last_quarter ? Math.min(max_city_size, 5) : max_city_size;

			// Check to see if a city can exist here
			if (elevation < min_elevation || elevation > max_elevation)
			{
				continue;
			}

			// Pick a random size (within range) and generate the layout
			var r = Generator.random();
			var city_size = 1 + Math.ceil((r*r*r) * Generator.random(0, max_size));
			var city_layout = generate_city(city_size);

			// Draw the layout directly onto height_canvas
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
							r: color.presets.city.r - color_reduction + Generator.random(-20, 20),
							g: color.presets.city.g - color_reduction + Generator.random(-20, 20),
							b: color.presets.city.b - color_reduction + Generator.random(-20, 20)
						};

						// Only draw tiles above a certain density
						if (city_layout[y][x] > 0)
						{
							city_canvas.draw.rectangle(tile.x*tile_size, tile.y*tile_size, tile_size, tile_size).fill(rgb(hue.r, hue.g, hue.b));
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

				city_canvas.draw.rectangle(position.x*tile_size, position.y*tile_size, tile_size, tile_size).fill(rgb(hue.r, hue.g, hue.b));
			}

			d += 1 + Math.floor(3*remoteness);

			offset.y += Generator.random(-1, 1);
			offset.x += Generator.random(-1, 1);
		}
	}

	/**
	 * Generates and renders highways between nearby cities
	 */
	function generate_roads(sea_level)
	{
		var height_data = height_map.data();
		var chunks = city_chunks.length;

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
								generate_road_between(city1, city2, city_distance, height_data, sea_level);
							}
						}
					}
				}
			}
		}
	}

	/**
	 * Generates and renders the cloud layer
	 */
	function generate_clouds()
	{

	}

	/**
	 * Render terrain with appropriate coloration and lighting
	 */
	function render()
	{
		// Image buffer for base heightmap
		var height_image = height_canvas.data.create();
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

			// Render coastal roads to [city_canvas]
			if (_elevation > sea_line+2 && _elevation < sea_line+6 && Generator.random() < 0.2)
			{
				var light_reduction = Generator.random(0, 20) + (_elevation !== sea_line+4 ? 20 : 0);

				var road_hue =
				{
					r: color.presets.city.r - light_reduction,
					g: color.presets.city.g - light_reduction,
					b: color.presets.city.b - light_reduction
				};

				city_canvas.draw.rectangle(x*tile_size, y*tile_size, tile_size, tile_size).fill(rgb(road_hue.r, road_hue.g, road_hue.b));
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
					height_image.data[_p] = hue.r;
					height_image.data[_p+1] = hue.g;
					height_image.data[_p+2] = hue.b;
					height_image.data[_p+3] = 255;
				}
			}
		});

		// Write image buffer data back into the canvas
		height_canvas.data.put(height_image);
		// Generate random city centers and
		// roads separately from the heightmap
		generate_cities(sea_level, tree_level);
		generate_roads(sea_level);
		generate_clouds();
		// Store the base rendering to time_canvas
		time_canvas.data.put(height_canvas.data.get());
	}

	/**
	 * Runs through the heightmap, city, and cloud layers
	 * to composite the results to time_canvas. Accepts an
	 * argument to specify the time of day for the rendering.
	 */
	function composite_layers(hour)
	{
		if (isNaN(hour)) hour = 12;
		hour = (hour < 0 ? 0 : (hour > 24 ? 24 : hour));

		// Create composite image data buffer
		var map_w = height_canvas.getSize().width;
		var map_h = height_canvas.getSize().height;
		var composite = height_canvas.data.get();
		// Grab image data for various layers
		var height_image = height_canvas.data.get().data;
		var city_image = city_canvas.data.get().data;
		// Light 'level' on a scale from 0-12; processed by the [color.time] formulas
		var light_level = 12 - Math.abs(12-hour);
		// Increasingly reduce city lights over the course of the night
		var city_light_reduction = 30 * (mod(hour-8, 24) - 16);
		var clr_3q = Math.round(0.75 * city_light_reduction);
		// Special light setting flags
		var is_twilight = (light_level === 5);
		var is_night = (light_level < 5);
		// Light level color modifiers
		var light =
		{
			red: color.time.red(light_level),
			green: color.time.green(light_level),
			blue: color.time.blue(light_level)
		};

		for (var p = 0 ; p < composite.data.length ; p += 4)
		{
			// Get heightmap color data
			var height_color_r = height_image[p];
			var height_color_g = height_image[p+1];
			var height_color_b = height_image[p+2];
			// Get city color data
			var city_color_r = city_image[p];
			var city_color_g = city_image[p+1];
			var city_color_b = city_image[p+2];
			// Determine whether or not this tile is a city
			var is_city = (city_color_r > 0);

			//  Nighttime city lighting
			if (is_night && is_city)
			{
				var density_light_reduction = Math.pow(clamp(45-city_color_r, 0, 45), 2);
				var dlr_3q = Math.round(0.75 * density_light_reduction);

				composite.data[p] = color.presets.city2.r - city_light_reduction - density_light_reduction;
				composite.data[p+1] = color.presets.city2.g - city_light_reduction - density_light_reduction - Generator.random(0, 60);
				composite.data[p+2] = color.presets.city2.b - clr_3q - dlr_3q - Generator.random(0, 75);

				continue;
			}

			// Composite remaining layers together
			var red = (is_city ? Math.round((height_color_r + 3*city_color_r) / 4) : height_color_r);
			var green = (is_city ? Math.round((height_color_g + 3*city_color_g) / 4) : height_color_g);
			var blue = (is_city ? Math.round((height_color_b + 3*city_color_b) / 4) : height_color_b);
			var average = Math.round((red + green + blue) / 3) - 15*(4 - light_level);

			composite.data[p] = light.red + (is_twilight ? Math.round((red + average) / 2) : (is_night ? average : red));
			composite.data[p+1] = light.green + (is_twilight ? Math.round((green + average) / 2) : (is_night ? average : green));
			composite.data[p+2] = light.blue + (is_twilight ? Math.round((blue + average) / 2) : (is_night ? average : blue));
		}

		time_canvas.data.put(composite);
	}

	// Public:
	this.canvas;

	this.build = function(settings)
	{
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
		// Instantiate each layer as its own Canvas
		height_canvas = new Canvas(new Element('canvas'));
		city_canvas = new Canvas(new Element('canvas'));
		cloud_canvas = new Canvas(new Element('canvas'));
		time_canvas = new Canvas(new Element('canvas'));
		// Public canvas is sourced from time_canvas
		_.canvas = time_canvas.element();
		// Seed the PRNG
		Generator.seed('height');
		return _;
	}

	this.setTileSize = function(size)
	{
		tile_size = size;
		var canvas_size = tile_size * height_map.size();

		height_canvas.setSize(canvas_size, canvas_size);
		city_canvas.setSize(canvas_size, canvas_size);
		cloud_canvas.setSize(canvas_size, canvas_size);
		time_canvas.setSize(canvas_size, canvas_size);

		return _;
	}

	this.setLightAngle = function(angle)
	{
		light_angle = Math.PI/180 * angle;
		return _;
	}

	this.setTime = function(hour)
	{
		composite_layers(hour);
		return _;
	}

	this.render = function()
	{
		if (isNaN(light_angle)) light_angle = Math.PI/2;
		setTimeout(render, 100);
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