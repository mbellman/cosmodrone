/**
 * A drifting planetary background layer beneath the game scene
 */
function Background(assets)
{
	// Private:
	var _ = this;
	var loaded = false;                                // Whether or not prerendering has finished, enabling the background cycle to start
	var terrain;                                       // Landscape instance
	var terrain_renders = [];                          // Prerendered time-of-day terrain variants
	var cloud_renders = [];                            // Prerendered cloud types, scaled based on [configuration.tileSize]
	var shadow_renders = [];                           // Prerendered cloud shadows, scaled based on [configuration.tileSize]
	var clouds = [];                                   // Active cloud objects on screen
	var shadow_offset = {};                            // Offset for cloud shadows; determined via [configuration.lightAngle]
	var bg_camera;                                     // The scrolling background camera instance
	var front_bg = 0;                                  // Binary; represents the current front screen of the background cycle
	var active_terrain = 0;                            // Current time-of-day terrain prerender being shown
	var build_steps = 0;                               // Determined in build() by various configuration parameters
	var build_steps_complete = 0;                      // For passing back into the progress handler
	var configuration = default_configuration();       // Store default settings
	                                                   // Bank of information on cloud assets + types
	var cloud_bank =
	[
		{
			file: 'cumulus-1',
			type: 'cumulus'
		},
		{
			file: 'cumulus-2',
			type: 'cumulus'
		},
		{
			file: 'cumulus-3',
			type: 'cumulus'
		},
		{
			file: 'cumulus-4',
			type: 'cumulus'
		},
		{
			file: 'heavy-cumulus-1',
			type: 'heavy_cumulus'
		},
		{
			file: 'heavy-cumulus-2',
			type: 'heavy_cumulus'
		},
		{
			file: 'cyclone-1',
			type: 'cyclone'
		}
	];

	/**
	 * Default instance configuration
	 */
	function default_configuration()
	{
		return {
			// Number of subdivisions for the heightmap fractal
			iterations: 6,
			// Maximum elevation for the heightmap
			elevation: 50,
			// Average heightmap point elevation as a percentage of the maximum
			concentration: 50,
			// Smoothness of the landscape, as a value from 1 - 20
			smoothness: 4,
			// Iterations of erosive processes after the primary heightmap is formed
			erosion: 1,
			// Whether or not to wrap the edges of the heightmap
			repeat: true,
			// Angle of the terrain's light source
			lightAngle: 220,
			// Number of cities across the landscape
			cities: 5,
			// Maximum city size
			maxCitySize: 4,
			// Pixel size to draw each background tile at
			tileSize: 2,
			// List of hours to prerender terrain variants from
			hours: [12],
			// Time in milliseconds for terrain time-of-day transitions
			cycleSpeed: 20000,
			// Velocity to scroll background scene at in pixels per second
			scrollSpeed:
			{
				x: 0,
				y: 0
			},
			// Whether or not to snap rendering to the nearest whole pixel value
			pixelSnapping: false
		};
	};

	// ---------------------------------------------- //
	// ------------- Initial generation ------------- //
	// ---------------------------------------------- //

	/**
	 * Prerender a single terrain variant at a specific hour
	 */
	function prerender_terrain_variant(hour)
	{
		var map_size = terrain.getSize();
		var tile_size = terrain.getTileSize();

		terrain.setTime(hour);
		terrain_renders.push(new Canvas(new Element('canvas')).setSize(tile_size*map_size, tile_size*map_size));
		terrain_renders[terrain_renders.length-1].draw.image(terrain.canvas);
	}

	/**
	 * Prerenders and saves one cloud image asset and its
	 * shadow as non-interpolated scaled canvas data
	 */
	function prerender_cloud_variant(cloud)
	{
		var name = cloud_bank[cloud].file;

		var cloud_asset = assets.getImage('clouds/' + name + '.png');
		var shadow_asset = assets.getImage('shadows/' + name + '.png');

		var cloud_canvas = new Canvas(new Element('canvas')).setSize(cloud_asset.width, cloud_asset.height);
		var shadow_canvas = new Canvas(new Element('canvas')).setSize(shadow_asset.width, shadow_asset.height);

		cloud_canvas.draw.image(cloud_asset);
		shadow_canvas.draw.image(shadow_asset);

		cloud_renders.push(cloud_canvas.scale(configuration.tileSize));
		shadow_renders.push(shadow_canvas.scale(configuration.tileSize));
	}

	/**
	 * Prerender variants of the terrain to
	 * reflect important hours of the day
	 */
	function prerender_terrain_variants(parameters)
	{
		parameters.progress = parameters.progress || function(){};
		parameters.complete = parameters.complete || function(){};

		var times = parameters.times || [12];
		var total = times.length;
		var t = 0;

		terrain_renders.length = 0;

		/**
		 * Temporary function for rendering the
		 * next terrain variant on a delay as to
		 * avoid halting the primary JS process
		 */
		function INTERNAL_prerender_next()
		{
			if (t < total)
			{
				var hour = times[t];

				setTimeout(function(){
					prerender_terrain_variant(hour);

					if (++t <= total)
					{
						parameters.progress(++build_steps_complete, build_steps);
					}

					INTERNAL_prerender_next();
				}, 100);

				return;
			}

			parameters.complete();
		}

		// Start rendering first variant
		INTERNAL_prerender_next();
	}

	/**
	 * Stores each cloud/shadow image asset for
	 * rendering at the appropriate tile size
	 */
	function prerender_cloud_variants(handlers)
	{
		handlers.progress = handlers.progress || function(){};
		handlers.complete = handlers.complete || function(){};

		var c = 0;

		cloud_renders.length = 0;
		shadow_renders.length = 0;

		/**
		 * See: prerender_terrain_variants()
		 */
		function INTERNAL_prerender_next()
		{
			if (c < cloud_bank.length)
			{
				setTimeout(function(){
					prerender_cloud_variant(c);

					if (++c <= cloud_bank.length)
					{
						handlers.progress(++build_steps_complete, build_steps);
					}

					INTERNAL_prerender_next();
				}, 100);

				return;
			}

			handlers.complete();
		}

		INTERNAL_prerender_next();
	}

	/**
	 * Returns a randomly picked cloud of type [type]
	 */
	function random_cloud_index(type)
	{
		// Cloud bank cycle pointer
		var c = 0;
		// Keep track of cycles
		var cycle = 0;

		while (1)
		{
			if (cycle > 200)
			{
				// Halt the loop if we've cycled too many times
				break;
			}

			var cloud_data = cloud_bank[c];

			if (Math.random() < 0.1 && cloud_data.type === type)
			{
				// Pick this cloud
				break;
			}

			// Update c and revert to 0 if it goes over the limit
			c = cycle_back(++c, cloud_bank.length-1);
			cycle++;
		}

		return c;
	}

	/**
	 * Spawns a cloud from cloud_bank via
	 * [index] and positions it at [x, y]
	 */
	function spawn_cloud(index, x, y)
	{
		var cloud_image = cloud_renders[index].element();
		var shadow_image = shadow_renders[index].element();

		var point = new MovingPoint().setVelocity(configuration.scrollSpeed.x, configuration.scrollSpeed.y).setPosition(x, y);
		var cloud = new Cloud().setImage(cloud_image).setShadow(shadow_image);

		clouds.push(new Entity().add(point).add(cloud));
	}

	/**
	 * Spawns a cyclone with surrounding cloud patches
	 */
	function spawn_cyclone(x, y)
	{
		// Pick the cyclone
		var index = random_cloud_index('cyclone');
		var cyclone_size = cloud_renders[index].getSize();

		// Position the cyclone at [x, y] relative to its eye
		spawn_cloud(index, x - Math.round(cyclone_size.width/2), y - Math.round(cyclone_size.height/2));

		// Generate the surrounding clouds
		var group_count = random(6, 7);
		var angle = Math.random() * 2 * Math.PI;

		for (var g = 0 ; g < group_count ; g++)
		{
			// Pick the cloud patch and angle of displacement
			var type = chance() ? 'heavy_cumulus' : 'cumulus';
			var index = random_cloud_index(type);
			var patch_size = cloud_renders[index].getSize();
			// Make sure the patch is positioned outside of the cyclone
			var w2 = Math.round(patch_size.width/2);
			var h2 = Math.round(patch_size.height/2);
			var patch_distance = Math.sqrt(w2*w2 + h2*h2);
			var magnitude = 0.6 * (cyclone_size.width/2 + patch_distance);
			// Determine how to displace the cloud patch
			var patch_offset =
			{
				x: Math.round(magnitude * Math.cos(angle)),
				y: Math.round(magnitude * Math.sin(angle) * -1)
			};

			spawn_cloud(index, x - w2 + patch_offset.x, y - h2 + patch_offset.y);

			// Advance the angle cycle to get coverage around the cyclone
			angle += ((2 * Math.PI) / group_count);
		}
	}

	/**
	 * Spawns the initial cloud cover layer
	 *
	 * TODO: Distribute and vary the clouds properly
	 */
	function spawn_cloud_layer()
	{
		var tile_size = terrain.getTileSize();
		var map_size = terrain.getSize();
		var types = ['cumulus', 'heavy_cumulus', 'cyclone'];

		spawn_cyclone(600, 600);

		/*
		for (var c = 0 ; c < 8 ; c++)
		{
			var type = types[random(0, types.length-1)];
			var index = random_cloud_index(type);

			var position =
			{
				x: random(-600, viewport.width + 600),
				y: random(-600, viewport.height + 600)
			};

			spawn_cloud(index, position.x, position.y);
		}
		*/
	}

	/**
	 * Determines how much to displace shadows beneath clouds
	 */
	function set_shadow_offset()
	{
		var pi_factor = Math.PI / 180;

		shadow_offset =
		{
			x: configuration.tileSize * 8 * Math.cos(configuration.lightAngle * pi_factor) * -1,
			y: configuration.tileSize * 8 * Math.sin(configuration.lightAngle * pi_factor)
		};
	}

	// ---------------------------------------- //
	// ------------- Render cycle ------------- //
	// ---------------------------------------- //

	/**
	 * Sets the new time-of-day background in
	 * front with opacity 0 and fades it in
	 */
	function advance_bg_cycle()
	{
		// Switch background screens
		front_bg = bit_flip(front_bg);

		// Update time-of-day cycle
		if (++active_terrain > terrain_renders.length-1)
		{
			active_terrain = 0;
		}

		var new_bg = 'bg' + front_bg;
		var old_bg = 'bg' + bit_flip(front_bg);

		// Swap the actual screen elements
		$(screen[old_bg].element()).css('z-index', '1');
		$(screen[new_bg].element()).css(
			{
				'opacity' : '0',
				'z-index' : '2'
			}
		).stop().animate(
			{
				opacity: 1
			},
			{
				duration: configuration.cycleSpeed,
				easing: 'linear',
				complete: advance_bg_cycle
			}
		);
	}

	/**
	 * Tile the prerendered background terrain across the screen
	 */
	function render_bg()
	{
		var tile_size = terrain.getTileSize();
		var map_size = terrain.getSize();
		// Tile offset 'pointer'
		var tile_offset =
		{
			x: 0,
			y: 0
		};
		// Tiles needed for screen coverage
		var tiles_to_draw =
		{
			x: Math.ceil(viewport.width/tile_size) + 2,
			y: Math.ceil(viewport.height/tile_size) + 2
		};
		// Current tile the background camera is on
		var bg_tile_offset =
		{
			x: mod(Math.floor(bg_camera.getPosition().x / tile_size), map_size),
			y: mod(Math.floor(bg_camera.getPosition().y / tile_size), map_size)
		};
		// Sub-tile offset based on the background camera's pixel position
		var bg_pixel_offset =
		{
			x: tile_size - mod(bg_camera.getPosition().x, tile_size),
			y: tile_size - mod(bg_camera.getPosition().y, tile_size)
		};
		// Information for time-of-day rendering sources/targets
		var new_bg = 'bg' + front_bg;
		var old_bg = 'bg' + bit_flip(front_bg);
		var terrain_before = cycle_forward(active_terrain-1, terrain_renders.length-1);
		var new_terrain = terrain_renders[active_terrain].element();
		var old_terrain = terrain_renders[terrain_before].element();

		while (tile_offset.x < tiles_to_draw.x || tile_offset.y < tiles_to_draw.y)
		{
			// Remaining tiles to the end of the map from current tile offset
			var map_limit =
			{
				x: map_size - ((tile_offset.x + bg_tile_offset.x) % map_size),
				y: map_size - ((tile_offset.y + bg_tile_offset.y) % map_size)
			};
			// Remaining tiles needed to fill the screen
			var screen_limit =
			{
				x: tiles_to_draw.x - tile_offset.x,
				y: tiles_to_draw.y - tile_offset.y
			};
			// Position to draw the next map chunk at
			var draw_offset =
			{
				x: tile_size * tile_offset.x + bg_pixel_offset.x - tile_size,
				y: tile_size * tile_offset.y + bg_pixel_offset.y - tile_size
			};

			if (configuration.pixelSnapping)
			{
				draw_offset.x = Math.floor(draw_offset.x);
				draw_offset.y = Math.floor(draw_offset.y);
			}
			// Clipping parameters for next map chunk
			var clip =
			{
				x: tile_size * ((tile_offset.x + bg_tile_offset.x) % map_size),
				y: tile_size * ((tile_offset.y + bg_tile_offset.y) % map_size),
				width: tile_size * Math.min(map_limit.x, screen_limit.x),
				height: tile_size * Math.min(map_limit.y, screen_limit.y)
			};

			// Draw the map chunk
			screen[new_bg].draw.image(new_terrain, clip.x, clip.y, clip.width, clip.height, draw_offset.x, draw_offset.y, clip.width, clip.height);
			screen[old_bg].draw.image(old_terrain, clip.x, clip.y, clip.width, clip.height, draw_offset.x, draw_offset.y, clip.width, clip.height);

			// Advance the tile 'pointer' to determine
			// what and where to draw on the next cycle
			tile_offset.x += clip.width/tile_size;

			if (tile_offset.x >= tiles_to_draw.x)
			{
				tile_offset.y += clip.height/tile_size;

				if (tile_offset.y < tiles_to_draw.y)
				{
					tile_offset.x = 0;
				}
			}
		}
	}

	/**
	 * Render all clouds above the terrain scene
	 *
	 * TODO: Clean up and eliminate repeat code
	 */
	function render_clouds()
	{
		for (var c = 0 ; c < clouds.length ; c++)
		{
			var cloud = clouds[c];
			var position = cloud.get(MovingPoint).getPosition(configuration.pixelSnapping);
			var shadow = cloud.get(Cloud).getShadow();

			screen.clouds.draw.image(shadow, position.x + shadow_offset.x, position.y + shadow_offset.y);
		}

		for (var c = 0 ; c < clouds.length ; c++)
		{
			var cloud = clouds[c];
			var position = cloud.get(MovingPoint).getPosition(configuration.pixelSnapping);
			var image = cloud.get(Cloud).getImage();

			screen.clouds.draw.image(image, position.x, position.y);
		}
	}

	function render_all()
	{
		// Background layer
		render_bg();
		// Cloud layer
		screen.clouds.clear();
		render_clouds();
	}

	function start()
	{
		bg_camera = new MovingPoint().setVelocity(-1*configuration.scrollSpeed.x, -1*configuration.scrollSpeed.y);
		loaded = true;

		advance_bg_cycle();
	}

	// Public:
	this.update = function(dt)
	{
		if (loaded)
		{
			bg_camera.update(dt);

			for (var c = 0 ; c < clouds.length ; c++)
			{
				clouds[c].update(dt);
			}

			render_all();
		}
	}

	this.configure = function(_configuration)
	{
		configuration = _configuration;

		var defaults = default_configuration();

		for (var key in defaults)
		{
			if (!configuration.hasOwnProperty(key))
			{
				configuration[key] = defaults[key];
			}
		}

		return _;
	}

	this.build = function(handlers)
	{
		handlers = handlers || {};
		handlers.progress = handlers.progress || function(){};
		handlers.complete = handlers.complete || function(){};

		build_steps = cloud_bank.length + configuration.hours.length;

		terrain = new Terrain()
		.build(
			{
				iterations: configuration.iterations,
				elevation: configuration.elevation,
				concentration: configuration.concentration,
				smoothness: configuration.smoothness,
				repeat: configuration.repeat
			}
		)
		.setLightAngle(configuration.lightAngle)
		.setCityCount(configuration.cities)
		.setMaxCitySize(configuration.maxCitySize)
		.setTileSize(configuration.tileSize)
		.render();

		prerender_cloud_variants(
			{
				progress: handlers.progress,
				complete: function()
				{
					// Prerender terrain at different times of day
					prerender_terrain_variants(
						{
							times: configuration.hours,
							progress: handlers.progress,
							complete: function()
							{
								spawn_cloud_layer();
								set_shadow_offset();
								start();
								handlers.complete();
							}
						}
					);
				}
			}
		);

		return _;
	}
}