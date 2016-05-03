/**
 * A drifting planetary background layer beneath the game scene
 */
function Background(assets)
{
	// Private:
	var _ = this;
	var loaded = false;
	var terrain;
	var terrains = [];
	var clouds = [];
	var cloud_variants = 1;
	var bg_camera;
	var front_bg = 0;
	var active_terrain = 0;
	var configuration = default_configuration();

	/**
	 * Default background configuration
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
		terrains.push(new Canvas(new Element('canvas')).setSize(tile_size*map_size, tile_size*map_size));
		terrains[terrains.length-1].draw.image(terrain.canvas);
	}

	/**
	 * Prerender variants of the terrain to
	 * reflect important hours of the day
	 */
	function prerender_terrain_variants(parameters)
	{
		var times = parameters.times || [12];
		var total = times.length;
		var t = 0;

		parameters.progress = parameters.progress || function(){};
		parameters.complete = parameters.complete || function(){};

		terrains.length = 0;

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
						parameters.progress(t, total);
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
	 * Spawns the initial cloud cover layer
	 *
	 * TODO: Distribute and vary the clouds properly
	 */
	function spawn_clouds()
	{
		var tile_size = terrain.getTileSize();
		var map_size = terrain.getSize();

		for (var c = 0 ; c < 10 ; c++)
		{
			var point = new MovingPoint().setVelocity(1.05 * configuration.scrollSpeed.x, 1.05 * configuration.scrollSpeed.y).setPosition(c * 600, c * 20);
			var cloud = new Cloud().setType(random(1, cloud_variants));
			var entity = new Entity().add(point).add(cloud);

			clouds.push(entity);
		}
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
		if (++active_terrain > terrains.length-1)
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
		var terrain_before = cycle_forward(active_terrain-1, terrains.length-1);
		var new_terrain = terrains[active_terrain].element();
		var old_terrain = terrains[terrain_before].element();

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
		var tile_size = terrain.getTileSize();

		var offset =
		{
			x: tile_size * 4,
			y: tile_size * 4
		};

		for (var c = 0 ; c < clouds.length ; c++)
		{
			var cloud = clouds[c];
			var position = cloud.get(MovingPoint).getPosition(configuration.pixelSnapping);
			var type = cloud.get(Cloud).getType();

			screen.clouds.draw.image(assets.getImage('shadows/' + type + '.png'), position.x + offset.x, position.y + offset.y);
		}

		for (var c = 0 ; c < clouds.length ; c++)
		{
			var cloud = clouds[c];
			var position = cloud.get(MovingPoint).getPosition(configuration.pixelSnapping);
			var type = cloud.get(Cloud).getType();

			screen.clouds.draw.image(assets.getImage('clouds/' + type + '.png'), position.x, position.y);
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
		return _;
	}

	this.build = function(handlers)
	{
		handlers = handlers || {};
		handlers.progress = handlers.progress || function(){};
		handlers.complete = handlers.complete || function(){};

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

		spawn_clouds();

		// Prerender terrain at different times of day
		prerender_terrain_variants(
			{
				times: configuration.hours,
				progress: handlers.progress,
				complete: function()
				{
					start();
					handlers.complete();
				}
			}
		);

		return _;
	}
}