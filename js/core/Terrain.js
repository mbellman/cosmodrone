/**
 * --------------
 * Class: Terrain
 * --------------
 *
 * Generates and prerenders terrain for the game scene
 */
function Terrain()
{
	// -- Private: --
	var _ = this;
	var Generator = new RNG();                // Deterministic PRNG
	var height_map;                           // Terrain elevation map
	var map_size = 0;                         // Size of the terrain map (in length of sides)
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
				if ( e > sea_line + 5 ) {
					if ( isInBetween( t, desert_line, desert_line + 5 ) ) return -10 + Math.round( 0.75 * t );
					if ( t > arid_line ) return -20 + Math.round( 0.75 * t );
					if ( t > jungle_line ) return -70 + t;
					return -90 + t;
				}
				if ( e > sea_line && isInBetween( t, shore_line, shore_line + 4 ) ) return -235 + t + e;
				if ( e < sea_line ) return 20 - t - ( sea_line - e );
				return -55;
			},
			green: function( t, e ) {
				if ( e >= 80 ) return 0;
				if ( e > tree_line ) return -50;
				if ( e > sea_line + 5 ) {
					if ( isInBetween( t, desert_line, desert_line + 5 ) ) return 10 + Math.round( -2.5 * e ) + Math.round( t / 2 );
					if ( t > arid_line ) return 30 + Math.round( -2.5 * e ) + Math.round( t / 2 );
					if ( t > jungle_line ) return -130 + t;
					return -120 + t;
				}
				if ( e > sea_line && isInBetween( t, shore_line, shore_line + 4 ) ) return -180 + t + e;
				if ( e < sea_line) return 50 - Math.round( t / 2 ) - ( sea_line - e );
				return -55;
			},
			blue: function( t, e ) {
				if ( e >= 80 ) return 0;
				if ( e > tree_line ) return -65;
				if ( e > sea_line + 5 ) {
					if ( t > arid_line ) return -30 + ( sea_line + 5 ) + Math.round( t / 2 ) - e;
					if ( t > jungle_line ) return -30 + Math.round( t / 25 );
					return -50 + Math.round( t / 25 );
				}
				if ( e > sea_line && isInBetween( t, shore_line, shore_line + 4 ) ) return -265 + t + e;
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
	function adjacent_coordinates( y, x )
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
	function map_to_chunks( chunk_size )
	{
		var size = Math.ceil( map_size / chunk_size );
		var chunks = new Array( size );

		for ( var y = 0 ; y < size ; y++ ) {
			chunks[y] = new Array( size );

			for ( var x = 0 ; x < size ; x++ ) {
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

		for ( var i = 0 ; i < 3 ; i++ ) {
			var ty = Math.round( y - Math.sin( light_angle ) * ( i + 1 ) );
			var tx = Math.round( x + Math.cos( light_angle ) * ( i + 1 ) );
			var height = data[mod( ty, map_size )][mod( tx, map_size )];

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
	 * Returns the closest x and y distance between two cities
	 */
	function get_city_distance_vector( city1, city2 )
	{
		return {
			x: Math.min( city2.x - city1.x, ( map_size - city2.x ) + city1.x ),
			y: Math.min( city2.y - city1.y, ( map_size - city2.y ) + city1.y )
		};
	}

	/**
	 * Returns the closest x, y, and proper distance between two cities
	 */
	function get_city_distance( city1, city2 )
	{
		var vector = get_city_distance_vector( city1, city2 );

		return {
			x: vector.x,
			y: vector.y,
			value: Math.sqrt( vector.x * vector.x + vector.y * vector.y )
		};
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

		for ( var y = 0 ; y < size ; y++ ) {
			layout[y] = new Array( size );

			for ( var x = 0 ; x < size ; x++ ) {
				layout[y][x] = 5;
			}
		}

		// Return 1x1 or 2x2 cities as-is
		if ( size < 3 ) {
			return layout;
		}

		// Start on larger cities by gradually
		// reducing density from city center
		var center = Math.round( size / 2 );

		for ( var y = 0 ; y < size ; y++ ) {
			for ( var x = 0 ; x < size ; x++ ) {
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
		var map = height_map.data();
		var total = 0;
		var chunk_size = 100;

		city_chunks = map_to_chunks( chunk_size );

		while ( total <= city_count ) {
			// Pick a random spot for the city
			var location = {
				y: Generator.random( 0, map_size - 1 ),
				x: Generator.random( 0, map_size - 1 )
			};

			// Skew more cities toward the coastal regions
			var is_last_quarter = ( total > Math.max( Math.round( city_count * 0.75), 5 ) );
			var elevation = map[location.y][location.x];
			var min_elevation = ( is_last_quarter ? sea_level + 8 : sea_level + 2 );
			var max_elevation = ( is_last_quarter ? tree_level - 20 : sea_level + 6 );
			var max_size = ( is_last_quarter ? Math.min( max_city_size, 5 ) : max_city_size );

			// Check to see if a city can exist here
			if ( elevation < min_elevation || elevation > max_elevation ) {
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
			var city_elevation = map[center_y][center_x];

			city_size = city_layout.length;

			for ( var y = 0 ; y < city_size ; y++ ) {
				for ( var x = 0 ; x < city_size ; x++ ) {
					var tile = {
						y: mod( location.y + y, map_size ),
						x: mod( location.x + x, map_size )
					};

					// Regardless of the overall city layout,
					// only draw on tiles above sea level
					if ( map[tile.y][tile.x] >= sea_level ) {
						// Find density value for this tile, ranging from 0-5
						var density = city_layout[y][x];
						var color_reduction = 6 * ( 5 - density );

						var hue = {
							r: color.presets.city.r - color_reduction + Generator.random( -20, 20 ),
							g: color.presets.city.g - color_reduction + Generator.random( -20, 20 ),
							b: color.presets.city.b - color_reduction + Generator.random( -20, 20 )
						};

						// Only draw tiles above a certain density
						if ( density > 0 ) {
							// Flatten terrain beneath the city
							map[tile.y][tile.x] = city_elevation;
							// Draw city tile
							city_canvas.draw.rectangle( tile.x, tile.y, 1, 1 ).fill( rgb( hue.r, hue.g, hue.b ) );

							if ( hue.r > ( color.presets.city.r - color_reduction ) ) {
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

			total++;
		}
	}

	/**
	 * Draws a highway between two cities
	 */
	function generate_road_between( city1, city2, distance, map, sea_level )
	{
		var direction = {
			x: ( ( city2.x - city1.x ) < ( map_size - city2.x + city1.x ) ? 1 : -1 ),
			y: ( ( city2.y - city1.y ) < ( map_size - city2.y + city1.y ) ? 1 : -1 )
		};

		var deviation = {
			y: Generator.random( -1, 1 ),
			x: Generator.random( -1, 1 )
		};

		var d = 0, ratio, remoteness, tile = {}, color_reduction, hue = {};

		while( d < distance.value ) {
			ratio = d / distance.value;
			remoteness = Math.sin( Math.PI * ratio );

			tile.x = mod( city1.y + Math.round( direction.y * distance.y * ratio ) + deviation.y, map_size );
			tile.y = mod( city1.x + Math.round( direction.x * distance.x * ratio ) + deviation.x, map_size );

			if ( map[tile.y][tile.x] > sea_level ) {
				color_reduction = Math.round( 25 * remoteness );

				hue.red = color.presets.city.r - color_reduction;
				hue.green = color.presets.city.g - color_reduction;
				hue.blue = color.presets.city.b - color_reduction;

				city_canvas.draw.rectangle( tile.x, tile.y, 1, 1 ).fill( rgb( hue.red, hue.green, hue.blue ) );
			}

			// Advance road more quickly in remote areas (yielding sparser lighting)
			d += 1 + Math.floor( 3 * remoteness );

			deviation.y += Generator.random( -1, 1 );
			deviation.x += Generator.random( -1, 1 );
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

		for ( var y = 0 ; y < chunks ; y++ ) {
			for ( var x = 0 ; x < chunks ; x++ ) {
				var chunk = city_chunks[y][x];
				var neighbor = neighbor_chunks( y, x, chunks );

				// Iterate over cities in this chunk
				for ( var c = 0 ; c < chunk.length ; c++ ) {
					var city1 = chunk[c];

					// Iterate over neighboring city chunks
					for ( var n = 0 ; n < neighbor.length ; n++ ) {
						var neighbor_chunk = neighbor[n];
						var neighbor_cities = city_chunks[neighbor_chunk.y][neighbor_chunk.x];

						// Iterate over all cities from a neighbor chunk
						for ( var c2 = 0 ; c2 < neighbor_cities.length ; c2++ ) {
							var city2 = neighbor_cities[c2];
							var distance = get_city_distance( city1, city2 );

							if (
								// Check to make sure cities are close
								distance.value < 120 &&
								// Only draw roads one way
								city2.x > city1.x &&
								(
									// Cities must also be close in relative size...
									Math.abs( city2.size - city1.size ) < 10 ||
									// ...80% of the time
									Generator.random() < 0.2
								)
							) {
								generate_road_between( city1, city2, distance, height_data, sea_level );
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
	function render_landscape()
	{
		var terrain_IMG = terrain_canvas.data.create();
		var height = {
			map: height_map.data(),
			range: height_map.getHeightRange(),
			size: height_map.getSize()
		};
		var climate = {
			map: temp_map.data(),
			size: temp_map.getSize()
		};

		var normalizer = 100 / height.range;
		var sea_level = Math.round( sea_line / normalizer );
		var tree_level = Math.round( tree_line / normalizer );

		// Generate random city centers and
		// roads separately before the heightmap
		generate_cities( sea_level, tree_level );
		generate_roads( sea_level );

		height_map.scan( function( y, x, elevation ) {
			// Scale [elevation] to [0 - 100] for use by the tile coloration formulas
			elevation = Math.round( elevation * normalizer );

			var temp_x = y % climate.size;
			var temp_y = x % climate.size;
			var temperature = 5 + climate.map[temp_y][temp_x];
			var is_sunny = (
				( elevation < sea_line ) ?
					false
				:
					( elevation < sea_line+6 || tile_is_lit( height.map, y, x ) )
			);

			var tile_RGB = {
				red: color.elevation.red( elevation ) + color.temperature.red( temperature, elevation ) + ( is_sunny ? 0 : -20 ),
				green: color.elevation.green( elevation ) + color.temperature.green( temperature, elevation ) + ( is_sunny ? 0 : -20 ),
				blue: color.elevation.blue( elevation ) + color.temperature.blue( temperature, elevation ),
				alpha: 255
			};

			// Special coloration for shoreline tiles
			if ( elevation > sea_line - 6 && elevation < sea_line + 6 ) {
				if ( tile_just_above( height.map, y, x, sea_level - 1 ) ) {
					tile_RGB.red += 20;
					tile_RGB.green += 20;
				} else
				if ( tile_just_below( height.map, y, x, sea_level ) ) {
					tile_RGB.green += 50;
					tile_RGB.blue += 40;
				}
			}

			// Render coastal roads to [city_canvas]
			if ( elevation > sea_line + 2 && elevation < sea_line + 6 && Generator.random() < 0.1 ) {
				var light_reduction = Generator.random( 0, 20 ) + ( elevation !== sea_line + 4 ? 20 : 0 );
				var road_RGB = {
					red: color.presets.city.r - light_reduction,
					green: color.presets.city.g - light_reduction,
					blue: color.presets.city.b - light_reduction
				};

				city_canvas.draw.rectangle( x, y, 1, 1 ).fill( rgb( road_RGB.red, road_RGB.green, road_RGB.blue ) );
			}

			var pixel = terrain_IMG.getPixelIndex( x, y );
			terrain_IMG.write( pixel, tile_RGB );
		} );

		terrain_canvas.data.put( terrain_IMG );
		time_canvas.data.put( terrain_canvas.data.get() );
	}

	/**
	 * Renders the generated landscape + city 
	 * together at a specific [hour] of the day.
	 */
	function render_time( hour )
	{
		if ( isNaN( hour ) ) {
			hour = 12;
		}

		hour = clamp(hour, 0, 24);

		var terrain_IMG = terrain_canvas.data.get();
		var city_IMG = city_canvas.data.get();
		var composite_IMG = time_canvas.data.get();

		var LIGHT_LEVEL = 12 - Math.abs( 12 - hour );
		var EVENING_LIGHT_MODIFIER = 15 * ( 4 - LIGHT_LEVEL );
		var CITY_LIGHT_REDUCTION = 30 * ( mod( hour - 8, 24 ) - 16 );
		var BLUE_CLR = Math.round( 0.75 * CITY_LIGHT_REDUCTION );
		var DENSITY_LIGHT_LIMIT = color.presets.city.r - 5;

		var is_twilight = ( LIGHT_LEVEL === 5 );
		var is_night = ( LIGHT_LEVEL < 5 );

		var LIGHT_COLOR = {
			red: color.time.red( LIGHT_LEVEL ),
			green: color.time.green( LIGHT_LEVEL ),
			blue: color.time.blue( LIGHT_LEVEL )
		};

		for ( var p = 0 ; p < terrain_IMG.data.length ; p += 4 ) {
			var terrain_RGB = terrain_IMG.read( p );
			var city_RGB = city_IMG.read( p );
			var composite_RGB = {
				red: 0,
				green: 0,
				blue: 0,
				alpha: 255
			};

			var is_city = ( city_RGB.red > 0 );

			if ( is_night && is_city ) {
				// City lights
				var density_light_reduction = Math.pow( clamp( DENSITY_LIGHT_LIMIT - city_RGB.red, 0, DENSITY_LIGHT_LIMIT ), 2 );
				var blue_DLR = Math.round( 0.75 * density_light_reduction );

				composite_RGB.red = color.presets.city2.r - CITY_LIGHT_REDUCTION - density_light_reduction;
				composite_RGB.green = color.presets.city2.g - CITY_LIGHT_REDUCTION - density_light_reduction - Generator.random( 0, 60 );
				composite_RGB.blue = color.presets.city2.b - BLUE_CLR - blue_DLR - Generator.random( 0, 75 );
			} else {
				// Normal terrain
				var RGB = {
					red: ( is_city ? city_RGB.red : terrain_RGB.red ),
					green: ( is_city ? city_RGB.green : terrain_RGB.green ),
					blue: ( is_city ? city_RGB.blue : terrain_RGB.blue )
				};
				var RGB_average = roundedAverage( RGB.red, RGB.green, RGB.blue );
				var rgb_modifier = RGB_average - EVENING_LIGHT_MODIFIER;
				var time_color = {
					red: ( is_twilight ? roundedAverage( RGB.red, rgb_modifier ) : ( is_night ? rgb_modifier : RGB.red ) ),
					green: ( is_twilight ? roundedAverage( RGB.green, rgb_modifier ) : ( is_night ? rgb_modifier : RGB.green ) ),
					blue: ( is_twilight ? roundedAverage( RGB.blue, rgb_modifier ) : ( is_night ? rgb_modifier : RGB.blue ) )
				};

				composite_RGB.red = LIGHT_COLOR.red + time_color.red;
				composite_RGB.green = LIGHT_COLOR.green + time_color.green;
				composite_RGB.blue = LIGHT_COLOR.blue + time_color.blue;
			}

			var T_pixel = terrain_IMG.getPixelXY( p );
			var C_pixel = composite_IMG.getPixelIndex( T_pixel.x * tile_size, T_pixel.y * tile_size );

			for ( var py = 0 ; py < tile_size ; py++ ) {
				for ( var px = 0 ; px < tile_size ; px++ ) {
					var pixel = C_pixel + ( 4 * px ) + ( 4 * py * map_size * tile_size );
					composite_IMG.write( pixel, composite_RGB );
				}
			}
		}

		time_canvas.data.put( composite_IMG );
	}

	// -- Public: --
	this.canvas;         // Public render of the terrain map at the most recent specified hour

	/**
	 * Generate base elevation and temperature maps with custom [settings]
	 */
	this.build = function( settings )
	{
		height_map = new HeightMap();
		height_map.seed( 'height' ).generate( settings );

		temp_map = new HeightMap();
		temp_map.seed( 'height' ).generate(
			{
				iterations: Math.min( settings.iterations - 1, 10 ),
				elevation: 100,
				smoothness: 2,
				concentration: 40,
				repeat: true
			}
		);

		Generator.seed( 'height' );

		terrain_canvas = new Canvas();
		city_canvas = new Canvas();
		time_canvas = new Canvas();

		_.canvas = time_canvas.element;
		map_size = height_map.getSize();
		init = true;

		return _;
	};

	/**
	 * Set the terrain map tile size
	 */
	this.setTileSize = function( size )
	{
		tile_size = size;

		terrain_canvas.setSize( map_size, map_size );
		city_canvas.setSize( map_size, map_size );
		time_canvas.setSize( map_size * size, map_size * size );

		return _;
	};

	/**
	 * Set the terrain lighting angle
	 */
	this.setLightAngle = function( angle )
	{
		light_angle = Math.PI_RAD * angle;
		return _;
	};

	/**
	 * Set the number of cities
	 */
	this.setCityCount = function( count )
	{
		city_count = count;
		return _;
	};

	/**
	 * Set the maximum size for cities
	 */
	this.setMaxCitySize = function( max )
	{
		max_city_size = max;
		return _;
	};

	/**
	 * Re-render the scene at a new [hour] of the day
	 */
	this.setTime = function( hour )
	{
		render_time( hour );
		return _;
	};

	/**
	 * Get the size of the elevation map
	 */
	this.getSize = function()
	{
		return height_map.getSize();
	};

	/**
	 * Get the rendered tile size
	 */
	this.getTileSize = function()
	{
		return tile_size;
	};

	/**
	 * Start the render operation (renders the
	 * terrain and generates/renders cities)
	 */
	this.renderLandscape = function()
	{
		if ( !init ) {
			return;
		}

		render_landscape();
		return _;
	};
}