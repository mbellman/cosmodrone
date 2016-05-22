/**
 * Generates and prerenders terrain for the game scene
 */
function Terrain()
{
	// -- Private: --
	var _ = this;
	var Generator = new RNG();                // Deterministic PRNG
	var height_map;                           // Terrain elevation map
	var temp_map;                             // Terrain temperature map
	var terrain_canvas;                       // Default terrain rendering
	var city_canvas;                          // City layer rendering
	var time_canvas;                          // Time-of-day rendering (composite of heightmap + cities)
	var tile_size = 1;                        // Pixel size of map tiles
	var light_angle = Math.PI / 2;            // Angle of light source
	var city_count = 400;                     // Number of cities
	var max_city_size = 50;                   // Largest city size (in approximate diameter)
	var city_chunks = [];                     // Regional chunks containing local cities
	var sea_line = 40;                        // Sea level as a percent of max elevation
	var tree_line = 65;                       // Height at which to reduce green as a percent of max elevation
	var jungle_line = 45;                     // Temperature above which trees receive a darker red-green tint
	var arid_line = 48;                       // Temperature at which trees no longer grow above [sea_line+5]
	var desert_line = 55;                     // In between this temperature and +4 the landscape receives a redder tint
	var shore_line = 42;                      // Below [sea_line+5], trees will grow if the temperature is between this value and value+4

	var init = false;                         // Whether or not the terrain has been generated yet via build()
	var init_timeout;                         // If render() is called before [init] is true, this interval will poll
	                                          // the variable several times until generation completes before advancing

	// Tile color formulas based on elevation, temperature, and time of day
	var color = {
		presets: {
			city: {r: 90, g: 90, b: 90},
			city2: {r: 255, g: 250, b: 170}
		},
		elevation: {
			red: function( e ) {
				if ( e < sea_line ) return 20 + Math.round( e / 4 );
				if ( e <= sea_line + 5 ) return 180;
				if ( e <= tree_line ) return 125 - e;
				if ( e <= 80 ) return 160;
				return 120 + e;
			},
			green: function( e ) {
				if ( e < sea_line ) return Math.max( 35, 60 - ( 4 * sea_line - 4 * e ) );
				if ( e <= sea_line + 5 ) return 155 - ( sea_line + 5 ) + e;
				if ( e <= tree_line ) return 85 + e;
				if ( e <= 80 ) return 125;
				return 95 + e;
			},
			blue: function( e ) {
				if ( e < sea_line ) return 35 + Math.round( e / 10 );
				if ( e <= sea_line + 5 ) return 105;
				if ( e <= tree_line ) return Math.round( 0.6 * e );
				if ( e <= 80 ) return 95;
				return 115 + e;
			}
		},
		temperature: {
			red: function( t, e ) {
				if ( e >= 80 ) return 0;
				if ( e > tree_line ) return -55;
				if ( e > sea_line + 5 )
				{
					if ( is_in_between( t, desert_line, desert_line + 5 ) ) return -10 + Math.round( 0.75 * t );
					if ( t > arid_line ) return -20 + Math.round( 0.75 * t );
					if ( t > jungle_line ) return -70 + t;
					return -90 + t;
				}
				if ( e > sea_line && is_in_between( t, shore_line, shore_line + 4 ) ) return -235 + t + e;
				if ( e < sea_line ) return 20 - t - ( sea_line - e );
				return -55;
			},
			green: function( t, e ) {
				if ( e >= 80 ) return 0;
				if ( e > tree_line ) return -50;
				if ( e > sea_line + 5 )
				{
					if ( is_in_between( t, desert_line, desert_line + 5 ) ) return 10 + Math.round( -2.5 * e ) + Math.round( t / 2 );
					if ( t > arid_line ) return 30 + Math.round( -2.5 * e ) + Math.round( t / 2 );
					if ( t > jungle_line ) return -130 + t;
					return -120 + t;
				}
				if ( e > sea_line && is_in_between( t, shore_line, shore_line + 4 ) ) return -180 + t + e;
				if ( e < sea_line) return 50 - Math.round( t / 2 ) - ( sea_line - e );
				return -55;
			},
			blue: function( t, e ) {
				if ( e >= 80 ) return 0;
				if ( e > tree_line ) return -65;
				if ( e > sea_line + 5 )
				{
					if ( t > arid_line ) return -30 + ( sea_line + 5 ) + Math.round( t / 2 ) - e;
					if ( t > jungle_line ) return -30 + Math.round( t / 25 );
					return -50 + Math.round( t / 25 );
				}
				if ( e > sea_line && is_in_between( t, shore_line, shore_line + 4 ) ) return -265 + t + e;
				if ( e < sea_line ) return 30 - Math.round( t / 3 ) - ( sea_line - e );
				return -65;
			}
		},
		time: {
			red: function( h ) {
				if ( h > 4 ) return -1 * Math.round( 0.0001 * Math.pow( h - 12, 6 ) );
				return -140;
			},
			green: function( h ) {
				if ( h > 4 ) return -1 * Math.round( 0.03 * Math.pow( h - 12, 4 ) );
				return -100;
			},
			blue: function( h ) {
				if ( h > 4 ) return -1 * Math.round( Math.pow( h - 12, 2 ) );
				return -50;
			}
		}
	};

	/**
	 * Get red/green/blue values for a pixel from canvas image data
	 */
	function get_color_data( canvas_data, pixel )
	{
		return {
			red: canvas_data[pixel],
			green: canvas_data[pixel + 1],
			blue: canvas_data[pixel + 2]
		};
	}

	/**
	 * Return coordinates for adjacent tiles
	 */
	function adjacent_coordinates( y, x, map_size )
	{
		return {
			top: {
				y: mod( y - 1, map_size ),
				x: x
			},
			right: {
				y: y,
				x: mod( x + 1, map_size )
			},
			bottom: {
				y: mod( y + 1, map_size ),
				x: x
			},
			left: {
				y: y,
				x: mod( x - 1, map_size )
			}
		}
	}

	/**
	 * Return adjacent tile elevations from height map data
	 */
	function adjacents( data, y, x )
	{
		var coords = adjacent_coordinates( y, x, data.length );

		return {
			top: data[coords.top.y][coords.top.x],
			right: data[coords.right.y][coords.right.x],
			bottom: data[coords.bottom.y][coords.bottom.x],
			left: data[coords.left.y][coords.left.x]
		};
	}

	/**
	 * Return [y,x] index for neighboring city chunks
	 */
	function neighbor_chunks( y, x, chunks )
	{
		return [
			// Self
			{
				y: y,
				x: x
			},
			// North
			{
				y: mod( y - 1, chunks ),
				x: x
			},
			// South
			{
				y: mod( y + 1, chunks ),
				x: x
			},
			// East
			{
				y: y,
				x: mod( x + 1, chunks )
			},
			// West
			{
				y: y,
				x: mod( x - 1, chunks )
			},
			// Northwest
			{
				y: mod( y - 1, chunks ),
				x: mod( x - 1, chunks )
			},
			// Northeast
			{
				y: mod( y - 1, chunks ),
				x: mod( x + 1, chunks )
			},
			// Southwest
			{
				y: mod( y + 1, chunks ),
				x: mod( x - 1, chunks )
			},
			// Southeast
			{
				y: mod( x + 1, chunks ),
				x: mod( x + 1, chunks )
			}
		];
	}

	/**
	 * Returns an array of square chunks
	 * representing regions of a heightmap
	 */
	function map_to_chunks( map_size, chunk_size )
	{
		var size = Math.ceil( map_size / chunk_size );
		var chunks = new Array( size );

		for ( var y = 0 ; y < size ; y++ )
		{
			chunks[y] = new Array( size );
			for ( var x = 0 ; x < size ; x++ )
			{
				chunks[y][x] = [];
			}
		}

		return chunks;
	}

	/**
	 * Determine whether a map tile is in sunlight
	 */
	function tile_is_lit( data, y, x )
	{
		var elevation = data[y][x];
		var map_size = data.length;

		for ( var i = 0 ; i < 3 ; i++ )
		{
			var _y = Math.round( y - Math.sin( light_angle ) * ( i + 1 ) );
			var _x = Math.round( x + Math.cos( light_angle ) * ( i + 1 ) );
			var height = data[mod( _y, map_size )][mod( _x, map_size )];

			if ( height < elevation + i ) return true;
		}

		return false;
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation below or equal to [limit]
	 */
	function tile_just_above( data, y, x, limit )
	{
		var elevation = data[y][x];
		var neighbor = adjacents( data, y, x );

		return (
			elevation > limit &&
			( neighbor.top <= limit || neighbor.right <= limit || neighbor.bottom <= limit || neighbor.left <= limit )
		);
	}

	/**
	 * Determine whether a tile is bordering another
	 * tile of elevation above or equal to [limit]
	 */
	function tile_just_below( data, y, x, limit )
	{
		var elevation = data[y][x];
		var neighbor = adjacents( data, y, x );

		return (
			elevation < limit &&
			( neighbor.top >= limit || neighbor.right >= limit || neighbor.bottom >= limit || neighbor.left >= limit )
		);
	}

	/**
	 * Returns the closest distance between two cities
	 */
	function proper_distance( city1, city2 )
	{
		var map_size = height_map.data().length;

		// Direct coordinate distance
		var dx1 = city2.x - city1.x;
		var dy1 = city2.y - city1.y;
		var dist1 = Math.sqrt( dx1 * dx1 + dy1 * dy1 );

		// Distance from wrapping across x
		var dx2 = ( map_size - city2.x ) + city1.x;
		var dy2 = dy1;
		var dist2 = Math.sqrt( dx2 * dx2 + dy2 * dy2 );

		// Distance from wrapping across y
		var dx3 = dx1;
		var dy3 = ( map_size - city2.y ) + city1.y;
		var dist3 = Math.sqrt( dx3 * dx3 + dy3 * dy3 );

		// Distance from wrapping across x and y
		var dx4 = dx2;
		var dy4 = dy3;
		var dist4 = Math.sqrt( dx4 * dx4 + dy4 * dy4 );

		return minimum( dist1, dist2, dist3, dist4 );
	}

	/**
	 * Generates a pseudo-random city layout
	 */
	function generate_city( size )
	{
		// Force odd-sized area for easy center handling
		size = ( size % 2 === 0 ? size + 1 : size );

		// Set up an empty 2D array of size [size]
		// filled with 5s to express max density
		// (the density of a tile determines its
		// luminosity during night renderings)
		var layout = new Array( size );
		for ( var y = 0 ; y < size ; y++ )
		{
			layout[y] = new Array( size );
			for ( var x = 0 ; x < size ; x++ )
			{
				layout[y][x] = 5;
			}
		}

		// Return 1x1 or 2x2 cities as-is
		if ( size < 3 )
		{
			return layout;
		}

		// Start on larger cities by gradually
		// reducing density from city center
		var center = Math.round( size / 2 );

		for ( var y = 0 ; y < size ; y++ )
		{
			for ( var x = 0 ; x < size ; x++ )
			{
				var dx = center - x;
				var dy = center - y;
				var center_distance = Math.sqrt( dx * dx + dy * dy );

				layout[y][x] -= ( Math.round( 10 * ( center_distance / center ) ) - Generator.random( 0, 2 ) );
			}
		}

		return layout;
	}

	/**
	 * Generates and renders [city_count] city areas on the map
	 */
	function generate_cities( sea_level, tree_level )
	{
		var height_data = height_map.data();
		var map_size = height_data.length;
		var total = 0;
		var chunk_size = 100;

		city_chunks = map_to_chunks( map_size, chunk_size );

		while ( total++ <= city_count )
		{
			// Pick a random spot for the city
			var location = {
				y: Generator.random( 0, map_size - 1 ),
				x: Generator.random( 0, map_size - 1 )
			};

			// Skew more cities toward the coastal regions
			var is_last_quarter = total > Math.max( Math.round( city_count * 0.75), 5 );
			var elevation = height_data[location.y][location.x];
			var min_elevation = ( is_last_quarter ? sea_level + 8 : sea_level + 2 );
			var max_elevation = ( is_last_quarter ? tree_level - 20 : sea_level + 6 );
			var max_size = ( is_last_quarter ? Math.min( max_city_size, 5 ) : max_city_size );

			// Check to see if a city can exist here
			if ( elevation < min_elevation || elevation > max_elevation )
			{
				continue;
			}

			// Pick a random city size (within range), skewed toward lower values
			var r = Generator.random();
			var r3 = r*r*r;
			var city_size = 1 + Math.ceil( r3 * Generator.random( 0, max_size ) );
			var city_radius = Math.round( city_size / 2 );
			// Generate city structure
			var city_layout = generate_city( city_size );
			// Get elevation at the center point of the city
			var center_y = mod( location.y + city_radius, map_size );
			var center_x = mod( location.x + city_radius, map_size );
			var city_elevation = height_data[center_y][center_x];

			// Draw the layout directly onto terrain_canvas
			city_size = city_layout.length;

			for ( var y = 0 ; y < city_size ; y++ )
			{
				for ( var x = 0 ; x < city_size ; x++ )
				{
					var tile = {
						y: mod( location.y + y, map_size ),
						x: mod( location.x + x, map_size )
					};

					// Regardless of the overall city layout,
					// only draw on tiles above sea level
					if ( height_data[tile.y][tile.x] >= sea_level )
					{
						// Find density value for this tile, ranging from 0-5
						var density = city_layout[y][x];
						var color_reduction = 6 * ( 5 - density );

						var hue = {
							r: color.presets.city.r - color_reduction + Generator.random( -20, 20 ),
							g: color.presets.city.g - color_reduction + Generator.random( -20, 20 ),
							b: color.presets.city.b - color_reduction + Generator.random( -20, 20 )
						};

						// Only draw tiles above a certain density
						if ( density > 0 )
						{
							// Flatten terrain beneath the city
							height_data[tile.y][tile.x] = city_elevation;
							// Draw city tile
							city_canvas.draw.rectangle( tile.x, tile.y, 1, 1 ).fill( rgb( hue.r, hue.g, hue.b ) );

							if ( hue.r > ( color.presets.city.r - color_reduction ) )
							{
								// Color in adjacent tiles with reduced hue for a nighttime glow effect
								var glow_R = hue.r - 5;
								var glow_G = hue.g - 5;
								var glow_B = hue.b - 5;

								city_canvas.draw.rectangle( ( tile.x - 1), tile.y, 1, 1 ).fill( rgb( glow_R, glow_G, glow_B ) );
								city_canvas.draw.rectangle( ( tile.x + 1), tile.y, 1, 1 ).fill( rgb( glow_R, glow_G, glow_B ) );
								city_canvas.draw.rectangle( tile.x, ( tile.y - 1), 1, 1 ).fill( rgb( glow_R, glow_G, glow_B ) );
								city_canvas.draw.rectangle( tile.x, ( tile.y + 1), 1, 1 ).fill( rgb( glow_R, glow_G, glow_B ) );
							}
						}
					}
				}
			}

			// Store city location in its respective chunk
			var city_y = location.y + Math.round( city_size / 2 );
			var city_x = location.x + Math.round( city_size / 2 );

			var chunk = {
				y: Math.floor( city_y / chunk_size ),
				x: Math.floor( city_x / chunk_size )
			};

			city_chunks[chunk.y][chunk.x].push(
				{
					y: city_y,
					x: city_x,
					size: city_size
				}
			);
		}
	}

	/**
	 * Draws a highway between two cities
	 */
	function generate_road_between( city1, city2, distance, height_data, sea_level )
	{
		var map_size = height_data.length;

		// Road construction direction
		var shift = {
			x: ( ( city2.x - city1.x ) < ( map_size - city2.x + city1.x ) ? 1 : -1 ),
			y: ( ( city2.y - city1.y ) < ( map_size - city2.y + city1.y ) ? 1 : -1 )
		};

		var dx = Math.min( city2.x - city1.x, ( map_size - city2.x ) + city1.x );
		var dy = Math.min( city2.y - city1.y, ( map_size - city2.y ) + city1.y );

		var offset = {
			y: Generator.random( -1, 1 ),
			x: Generator.random( -1, 1 )
		};

		var d = 0;

		while( d < distance )
		{
			var ratio = d / distance;
			var remoteness = Math.sin( Math.PI * ratio );
			var tile = {
				y: mod( city1.y + Math.round( shift.y * dy * ratio ) + offset.y, map_size ),
				x: mod( city1.x + Math.round( shift.x * dx * ratio ) + offset.x, map_size )
			};

			// Only draw road tiles above sea level
			if ( height_data[tile.y][tile.x] > sea_level )
			{
				var color_reduction = Math.round( 25 * remoteness );
				var hue = {
					r: color.presets.city.r - color_reduction,
					g: color.presets.city.g - color_reduction,
					b: color.presets.city.b - color_reduction
				};

				city_canvas
					.draw.rectangle( tile.x, tile.y, 1, 1 )
					.fill( rgb( hue.r, hue.g, hue.b ) );
			}

			// Increase distance proportionally to remoteness
			d += 1 + Math.floor( 3 * remoteness );

			// Randomly update deviation
			offset.y += Generator.random( -1, 1 );
			offset.x += Generator.random( -1, 1 );
		}
	}

	/**
	 * Generates and renders highways between nearby cities.
	 * Region chunks serve as space partitions, reducing the
	 * necessary number of city distance comparisons.
	 */
	function generate_roads( sea_level )
	{
		var height_data = height_map.data();
		var chunks = city_chunks.length;

		// Iterate over all chunk regions
		for ( var y = 0 ; y < chunks ; y++ )
		{
			for ( var x = 0 ; x < chunks ; x++ )
			{
				var chunk = city_chunks[y][x];
				var neighbor = neighbor_chunks( y, x, chunks );

				// Iterate over cities in this chunk
				for ( var c = 0 ; c < chunk.length ; c++ )
				{
					var city1 = chunk[c];

					// Iterate over neighboring city chunks
					for ( var n = 0 ; n < neighbor.length ; n++ )
					{
						var neighbor_chunk = neighbor[n];
						var neighbor_cities = city_chunks[neighbor_chunk.y][neighbor_chunk.x];

						// Iterate over all cities from a neighbor chunk
						for ( var c2 = 0 ; c2 < neighbor_cities.length ; c2++ )
						{
							var city2 = neighbor_cities[c2];
							var city_distance = proper_distance( city1, city2 );

							if (
								// Check to make sure cities are close
								city_distance < 100 &&
								// Only draw roads one way
								city2.x > city1.x &&
								(
									// Make sure cities are similar in size
									Math.abs( city2.size - city1.size ) < 10 ||
									// Or let the RNG take care of the job
									Generator.random() < 0.2
								)
							)
							{
								generate_road_between( city1, city2, city_distance, height_data, sea_level );
							}
						}
					}
				}
			}
		}
	}

	/**
	 * Render terrain with appropriate coloration and lighting
	 */
	function render()
	{
		var height_image = terrain_canvas.data.create();
		var height = {
			data: height_map.data(),
			range: height_map.getHeightRange(),
			size: height_map.getSize()
		};
		var climate = {
			data: temp_map.data(),
			size: temp_map.getSize()
		};

		// Used to map the heightmap's elevation range to [0-100]
		var ratio = 100 / height.range;
		// Sea line + tree line in heightmap's terms
		var sea_level = Math.round( sea_line / ratio );
		var tree_level = Math.round( tree_line / ratio );

		// Generate random city centers and
		// roads separately before the heightmap
		generate_cities( sea_level, tree_level );
		generate_roads( sea_level );

		height_map.scan(function( y, x, elevation ) {
			// Scale elevation to [0-100] for use by the tile coloration formulas
			var _elevation = Math.round(elevation*ratio);

			var temp_x = mod( y, climate.size );
			var temp_y = mod( x, climate.size );
			var temperature = 5 + climate.data[temp_y][temp_x];
			var is_sunny = (
				( _elevation < sea_line ) ?
					false
				:
					( _elevation < sea_line+6 || tile_is_lit( height.data, y, x ) )
			);

			var hue = {
				r: color.elevation.red( _elevation ) + color.temperature.red( temperature, _elevation ) + ( is_sunny ? 0 : -20 ),
				g: color.elevation.green( _elevation ) + color.temperature.green( temperature, _elevation ) + ( is_sunny ? 0 : -20 ),
				b: color.elevation.blue( _elevation ) + color.temperature.blue( temperature, _elevation )
			};

			// Special coloration for shoreline tiles
			if ( _elevation > sea_line - 6 && _elevation < sea_line + 6 )
			{
				if ( tile_just_above( height.data, y, x, sea_level - 1 ) )
				{
					hue.r += 20;
					hue.g += 20;
				}
				else
				if ( tile_just_below( height.data, y, x, sea_level ) )
				{
					hue.g += 50;
					hue.b += 40;
				}
			}

			// Render coastal roads to [city_canvas]
			if ( _elevation > sea_line + 2 && _elevation < sea_line + 6 && Generator.random() < 0.1 )
			{
				var light_reduction = Generator.random( 0, 20 ) + ( _elevation !== sea_line + 4 ? 20 : 0 );
				var road_hue = {
					r: color.presets.city.r - light_reduction,
					g: color.presets.city.g - light_reduction,
					b: color.presets.city.b - light_reduction
				};

				city_canvas
					.draw.rectangle( x, y, 1, 1 )
					.fill( rgb( road_hue.r, road_hue.g, road_hue.b ) );
			}

			var pixel = 4 * ( y * height.size + x );

			height_image.data[pixel] = hue.r;
			height_image.data[pixel + 1] = hue.g;
			height_image.data[pixel + 2] = hue.b;
			height_image.data[pixel + 3] = 255;
		});

		terrain_canvas.data.put( height_image );
		time_canvas.data.put( terrain_canvas.data.get() );
	}

	/**
	 * Runs through the heightmap and city layers in order
	 * to composite the results to [time_canvas]. Accepts an
	 * argument to specify the time of day for the rendering.
	 *
	 * TODO: Cleanup and organization
	 */
	function composite_layers( hour )
	{
		if ( isNaN( hour ) )
		{
			hour = 12;
		}

		hour = clamp(hour, 0, 24);

		var map_size = height_map.getSize();
		var composite = time_canvas.data.get();

		var height_image = terrain_canvas.data.get().data;
		var city_image = city_canvas.data.get().data;

		var global_light_level = 12 - Math.abs(12-hour);
		var city_light_reduction = 30 * (mod(hour - 8, 24) - 16);
		var CLR_3q = Math.round(0.75 * city_light_reduction);
		var density_light_limit = color.presets.city.r - 5;

		var is_twilight = (global_light_level === 5);
		var is_night = (global_light_level < 5);

		var lighting = {
			red: color.time.red( global_light_level ),
			green: color.time.green( global_light_level ),
			blue: color.time.blue( global_light_level )
		};

		// Iterate over terrain + city layer pixels
		for ( var p = 0 ; p < height_image.length ; p += 4 )
		{
			var terrain_color = get_color_data( height_image, p );
			var city_color = get_color_data( city_image, p );
			var is_city = ( city_color.red > 0 );
			var composite_color = {
				red: 0,
				green: 0,
				blue: 0
			};

			if ( is_night && is_city )
			{
				// Calculate composited city lights color
				var density_light_reduction = Math.pow( clamp( density_light_limit - city_color.red, 0, density_light_limit ), 2 );
				var DLR_3q = Math.round( 0.75 * density_light_reduction );

				composite_color.red = color.presets.city2.r - city_light_reduction - density_light_reduction;
				composite_color.green = color.presets.city2.g - city_light_reduction - density_light_reduction - Generator.random( 0, 60 );
				composite_color.blue = color.presets.city2.b - CLR_3q - DLR_3q - Generator.random( 0, 75 );
			}
			else
			{
				// Calculate composited terrain color
				var red = ( is_city ? city_color.red : terrain_color.red );
				var green = ( is_city ? city_color.green : terrain_color.green );
				var blue = ( is_city ? city_color.blue : terrain_color.blue );
				var average = Math.round( ( red + green + blue ) / 3 );
				var modifier = average - 15 * ( 4 - global_light_level );
				var time = {
					red: ( is_twilight ? Math.round( ( red + modifier ) / 2 ) : ( is_night ? modifier : red ) ),
					green: ( is_twilight ? Math.round( ( green + modifier ) / 2 ) : ( is_night ? modifier : green ) ),
					blue: ( is_twilight ? Math.round( ( blue + modifier ) / 2 ) : ( is_night ? modifier : blue ) )
				};

				composite_color.red = lighting.red + time.red;
				composite_color.green = lighting.green + time.green;
				composite_color.blue = lighting.blue + time.blue;
			}

			// Top left pixel to start at for this tile
			var pixel = p / 4;
			var x = pixel % map_size;
			var y = Math.floor( pixel / map_size );

			// [tile_size]-scaled pixel index
			pixel = 4 * ( y * map_size * tile_size * tile_size + x * tile_size );

			for ( var py = 0 ; py < tile_size ; py++ )
			{
				for ( var px = 0 ; px < tile_size ; px++ )
				{
					var _p = pixel + 4 * px + 4 * ( py * map_size * tile_size );

					composite.data[_p] = composite_color.red;
					composite.data[_p+1] = composite_color.green;
					composite.data[_p+2] = composite_color.blue;
					composite.data[_p+3] = 255;
				}
			}
		}

		time_canvas.data.put( composite );
	}

	// Public:
	this.canvas;

	/**
	 * Generate base elevation and temperature maps with custom [settings]
	 */
	this.build = function( settings )
	{
		height_map = new HeightMap();
		height_map.seed( 'seedy' ).generate( settings );

		temp_map = new HeightMap();
		temp_map.seed( 'seedy' ).generate(
			{
				iterations: Math.min( settings.iterations - 1, 10 ),
				elevation: 100,
				smoothness: 2,
				concentration: 40,
				repeat: true
			}
		);

		terrain_canvas = new Canvas();
		city_canvas = new Canvas();
		time_canvas = new Canvas();

		_.canvas = time_canvas.element;

		Generator.seed( 'seedy' );
		init = true;

		return _;
	}

	/**
	 * Set the terrain map tile size
	 */
	this.setTileSize = function( size )
	{
		tile_size = size;

		var map_size = height_map.getSize();

		terrain_canvas.setSize( map_size, map_size );
		city_canvas.setSize( map_size, map_size );
		time_canvas.setSize( tile_size * map_size, tile_size * map_size );

		return _;
	}

	/**
	 * Set the terrain lighting angle
	 */
	this.setLightAngle = function( angle )
	{
		light_angle = Math.PI_RAD * angle;
		return _;
	}

	/**
	 * Set the number of cities
	 */
	this.setCityCount = function( count )
	{
		city_count = count;
		return _;
	}

	/**
	 * Set the maximum size for cities
	 */
	this.setMaxCitySize = function( max )
	{
		max_city_size = max;
		return _;
	}

	/**
	 * Re-render the scene at a new [hour] of the day
	 */
	this.setTime = function( hour )
	{
		composite_layers( hour );
		return _;
	}

	/**
	 * Get the size of the elevation map
	 */
	this.getSize = function()
	{
		return height_map.getSize();
	}

	/**
	 * Get the rendered tile size
	 */
	this.getTileSize = function()
	{
		return tile_size;
	}

	/**
	 * Start the render operation
	 */
	this.render = function()
	{
		if ( !init )
		{
			init_timeout = setTimeout( _.render, 500 );
			return;
		}

		render();
		return _;
	}
}