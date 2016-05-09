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
	var cloud_stage;                                   // Clouds are drawn here before being composited onto [screen.clouds]
	var clouds = [];                                   // Active cloud objects on screen
	var shadow_offset = {};                            // Offset for cloud shadows; determined via [configuration.lightAngle]
	var camera;                                        // The scrolling background camera instance
	var front_bg = 0;                                  // Binary; represents the current front screen of the background cycle
	var active_terrain = 0;                            // Current time-of-day terrain prerender being shown
	var granular_light_level = 0;                      // A decimal value between 0-12 representing the instantaneous light level
	var cloud_cooldown = 0;                            // Jumps to 2000 when a cyclone is generated; once it counts down to 0 normal cloud spawning can resume
	var build_steps = 0;                               // Determined in build() by various configuration parameters
	var build_steps_complete = 0;                      // For passing back into the progress handler
	var configuration = default_configuration();       // Store default settings
	var cloud_bank =                                   // Bank of information on cloud assets + types
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
			file: 'cyclone-1',
			type: 'cyclone'
		},
		{
			file: 'cyclone-2',
			type: 'cyclone'
		},
		{
			file: 'small-cyclone-1',
			type: 'small_cyclone'
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
			file: 'heavy-cumulus-3',
			type: 'heavy_cumulus'
		},
		{
			file: 'small-cumulus-1',
			type: 'small_cumulus'
		},
		{
			file: 'small-cumulus-2',
			type: 'small_cumulus'
		},
		{
			file: 'cirrus-1',
			type: 'cirrus'
		},
		{
			file: 'cirrus-2',
			type: 'cirrus'
		},
		{
			file: 'cirrus-3',
			type: 'cirrus'
		},
		{
			file: 'cirrus-4',
			type: 'cirrus'
		},
		{
			file: 'cirrus-5',
			type: 'cirrus'
		},
		{
			file: 'cirrus-6',
			type: 'cirrus'
		},
		{
			file: 'cirrus-7',
			type: 'cirrus'
		},
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

	/**
	 * Determine what color to composite with the
	 * cloud layer based on [granular_light_level]
	 */
	function get_time_color()
	{
		// Normal time ratio
		var light_ratio = granular_light_level/12;
		// Adjusted ratio value for different channels
		var red_ratio = Math.pow(light_ratio, 4);
		var green_ratio = Math.sqrt(light_ratio);
		var blue_ratio = Math.pow(light_ratio, 1/3);

		return {
			red: 200 - Math.round(red_ratio*180),
			green: 200 - Math.round(green_ratio*160),
			blue: 200 - Math.round(blue_ratio*40)
		};
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

	/**
	 * Updates [granular_light_level] based on the background cycle
	 */
	function set_granular_light_level(animation, progress)
	{
		// Determine the progress between hours
		var prev_hour = configuration.hours[cycle_forward(active_terrain-1, terrain_renders.length-1)];
		var next_hour = configuration.hours[active_terrain];
		var difference = (next_hour >= prev_hour ? next_hour-prev_hour : 24-prev_hour + next_hour);
		var granular_hour = clamp(prev_hour + progress*difference, 0, 24);

		granular_light_level = Math.abs(12-granular_hour);
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
			if (cycle > 5000)
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

	// ------------------------------------------ //
	// ------------- Initialization ------------- //
	// ------------------------------------------ //

	function start()
	{
		cloud_stage = new Canvas(new Element('canvas'))
			.setSize(viewport.width, viewport.height);

		camera = new Point()
			.setVelocity(-1*configuration.scrollSpeed.x, -1*configuration.scrollSpeed.y);

		set_shadow_offset();
		spawn_cloud_layer();
		advance_bg_cycle();

		loaded = true;
	}

	// ------------------------------------------------ //
	// ------------- Texture prerendering ------------- //
	// ------------------------------------------------ //

	/**
	 * Prerender terrain at a specific hour
	 */
	function prerender_terrain_variant(hour)
	{
		var map_size = terrain.getSize();
		var tile_size = terrain.getTileSize();

		var terrain_canvas = new Canvas(new Element('canvas'))
			.setSize(map_size * tile_size, map_size * tile_size);

		terrain.setTime(hour);
		terrain_canvas.draw.image(terrain.canvas);

		terrain_renders.push(terrain_canvas.element());
	}

	/**
	 * Prerender cloud + shadow pair as
	 * non-interpolated scaled Canvas data
	 */
	function prerender_cloud_variant(cloud)
	{
		var name = cloud_bank[cloud].file;
		var type = cloud_bank[cloud].type;

		var cloud_asset = assets.getImage('clouds/' + name + '.png');
		var cloud_canvas = new Canvas(new Element('canvas'))
			.setSize(cloud_asset.width, cloud_asset.height);

		cloud_canvas.draw.image(cloud_asset);
		cloud_renders.push(cloud_canvas.scale(configuration.tileSize));

		if (type !== 'cirrus')
		{
			// Store shadow for normal clouds
			var shadow_asset = assets.getImage('shadows/' + name + '.png');
			var shadow_canvas = new Canvas(new Element('canvas'))
				.setSize(shadow_asset.width, shadow_asset.height);

			shadow_canvas.draw.image(shadow_asset);
			shadow_renders.push(shadow_canvas.scale(configuration.tileSize));
		}
		else
		{
			// Store a blank entry for cirrus cloud shadows
			shadow_renders.push(null);
		}
	}

	/**
	 * Used for prerendering a sequence
	 * of Canvas instances on a delay
	 */
	function prerender_group(index, total, data, handler, progress, complete)
	{
		if (index < total)
		{
			try
			{
				var input = data[index];
			}
			catch(e)
			{
				var input = index;
			}

			setTimeout(function()
			{
				handler(input);

				if (++index <= total)
				{
					progress(++build_steps_complete, build_steps);
				}

				prerender_group(index, total, data, handler, progress, complete);
			}, 100);

			return;
		}

		complete();
	}

	/**
	 * Prerender variants of the terrain to
	 * reflect important hours of the day
	 */
	function prerender_terrain_variants(handlers)
	{
		handlers.progress = handlers.progress || function(){};
		handlers.complete = handlers.complete || function(){};

		terrain_renders.length = 0;

		prerender_group(
			0,
			configuration.hours.length,
			configuration.hours,
			prerender_terrain_variant,
			handlers.progress,
			handlers.complete
		);
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

		prerender_group(
			0,
			cloud_bank.length,
			null,
			prerender_cloud_variant,
			handlers.progress,
			handlers.complete
		);
	}

	// -------------------------------------------- //
	// ------------- Cloud population ------------- //
	// -------------------------------------------- //

	/**
	 * Spawns a cloud from [cloud_bank] as specified
	 * by [index] and positions it at coordinate [x, y]
	 */
	function spawn_cloud(index, x, y)
	{
		var type = cloud_bank[index].type;
		var is_cirrus = (type === 'cirrus');
		var cloud_image = cloud_renders[index].element();
		var shadow_image = (is_cirrus ? null : shadow_renders[index].element());
		var velocity =
		{
			x: configuration.scrollSpeed.x,
			y: configuration.scrollSpeed.y
		};

		var point = new Point()
			.setVelocity(velocity.x, velocity.y)
			.setPosition(x, y);

		var cloud = new Cloud()
			.setImage(cloud_image)
			.setShadow(shadow_image)
			.setType(type);

		clouds.push(new Entity().add(point).add(cloud));
	}

	/**
	 * Spawns a cyclone with surrounding cloud patches
	 */
	function spawn_cyclone(size, x, y)
	{
		var large_cyclone = (size === 'large');

		// Pick a cyclone among several
		var index = random_cloud_index((large_cyclone ? 'cyclone' : 'small_cyclone'));
		var cyclone_size = cloud_renders[index].getSize();

		// Position the cyclone eye at [x, y]
		var position =
		{
			x: x - Math.round(cyclone_size.width/2),
			y: y - Math.round(cyclone_size.height/2)
		};

		spawn_cloud(index, position.x, position.y);

		// Set a starting offset angle
		var angle = Math.random() * 2 * Math.PI;

		// Draw surrounding clouds in two rings; loop around once for clouds
		// near the storm, and again for more distant smaller clouds
		for (var i = 0 ; i < 2 ; i++)
		{
			// We'll need more clouds among the outer ring
			var cloud_count = (i === 0 ? random(7, 9) : random(13, 16));

			for (var g = 0 ; g < cloud_count ; g++)
			{
				var type;

				if (large_cyclone)
				{
					// Larger clouds for larger cyclones
					if (i === 0) type = pick_random('cumulus', 'heavy_cumulus');
					else type = pick_random('cumulus', 'small_cumulus');
				}
				else
				{
					// Smaller clouds for smaller cyclones
					if (i === 0) type = 'cumulus';
					else type = 'small_cumulus';
				}

				// Select the next cloud
				var index = random_cloud_index(type);
				var cloud_size = cloud_renders[index].getSize();
				// Make sure the cloud is positioned outside of the cyclone
				var w_half = Math.round(cloud_size.width/2);
				var h_half = Math.round(cloud_size.height/2);
				var cloud_distance = Math.sqrt(w_half*w_half + h_half*h_half);
				// Formula for the magnitude of this cloud's offset vector
				var magnitude = (i+1) * (large_cyclone ? 0.6 : 0.52) * (cyclone_size.width/2 + cloud_distance);
				// Determine how to displace the cloud
				var cloud_offset =
				{
					x: Math.round(magnitude * Math.cos(angle)),
					y: Math.round(magnitude * Math.sin(angle) * -1)
				};

				spawn_cloud(index, x - w_half + cloud_offset.x, y - h_half + cloud_offset.y);

				// Advance the angle cycle to get coverage around the cyclone
				angle += ((2 * Math.PI) / cloud_count);
			}
		}
	}

	/**
	 * Spawns the initial cloud cover layer
	 */
	function spawn_cloud_layer()
	{
		var tile_size = terrain.getTileSize();
		var map_size = terrain.getSize();

		for (var c = 0 ; c < 30 ; c++)
		{
			var type = pick_random('cumulus', 'heavy_cumulus', 'small_cumulus', 'cirrus', 'cirrus');
			var index = random_cloud_index(type);

			var position =
			{
				x: random(-600, viewport.width + 600),
				y: random(-600, viewport.height + 600)
			};

			spawn_cloud(index, position.x, position.y);
		}
	}

	/**
	 * Repopulates clouds to where they can scroll into view
	 */
	function respawn_clouds()
	{
		var bg_velocity = camera.getVelocity();
		var bg_abs_velocity = camera.getAbsoluteVelocity();
		var spawn_probability = 0.0002 * bg_abs_velocity;

		var position =
		{
			x: 0,
			y: 0
		};

		if (
			Math.random() > spawn_probability ||
			(bg_velocity.x === 0 && bg_velocity.y === 0) ||
			cloud_cooldown > 0
		)
		{
			// Don't generate a new cloud if [spawn_probability] limit
			// not hit, background isn't scrolling, or cooldown active
			return;
		}

		if (Math.random() > 0.02)
		{
			// 98% chance of generating a normal cloud
			// (higher chance of picking cirrus clouds)
			var type = pick_random('cumulus', 'heavy_cumulus', 'small_cumulus', 'cirrus', 'cirrus', 'cirrus');
			var index = random_cloud_index(type);
			var size = cloud_renders[index].getSize();

			var spawn_offset =
			{
				x: 0,
				y: 0
			};
		}
		else
		{
			// 2% chance of generating a cyclone
			var index = pick_random('large', 'small');

			var size =
			{
				width: 0,
				height: 0
			};

			var spawn_offset =
			{
				x: (index === 'large' ? 1350 : 1200),
				y: (index === 'large' ? 1350 : 1200)
			};

			cloud_cooldown = 2000;
		}

		if (Math.abs(bg_velocity.x) > Math.abs(bg_velocity.y))
		{
			// Background scrolling faster horizontally than vertically
			position.y = random(0-size.height, viewport.height);
			// Scrolling right
			if (bg_velocity.x > 0) position.x = viewport.width + spawn_offset.x;
			// Scrolling left
			if (bg_velocity.x < 0) position.x = 0 - size.width - spawn_offset.x;
		}
		else
		{
			// Background scrolling faster vertically than horizontally
			position.x = random(0-size.width, viewport.width);
			// Scrolling down
			if (bg_velocity.y > 0) position.y = viewport.height + spawn_offset.y;
			// Scrolling up
			if (bg_velocity.y < 0) position.y = 0 - size.height - spawn_offset.y;
		}

		if (isNaN(index))
		{
			// Cyclone
			spawn_cyclone(index, position.x, position.y);
		}
		else
		{
			// Normal cloud
			spawn_cloud(index, position.x, position.y);
		}
	}

	/**
	 * Determines whether a cloud has scrolled off-screen
	 * and removes it from the [clouds] array if so
	 */
	function cloud_purged(c)
	{
		var cloud = clouds[c];
		var point = cloud.get(Point);
		var position = point.getPosition();
		var velocity = point.getVelocity();
		var image = cloud.get(Cloud).getImage();

		if (velocity.x < 0 && position.x + image.width < 0)
		{
			clouds.splice(c, 1);
			return true;
		}

		if (velocity.x > 0 && position.x > viewport.width)
		{
			clouds.splice(c, 1);
			return true;
		}

		if (velocity.y < 0 && position.y + image.height < 0)
		{
			clouds.splice(c, 1);
			return true;
		}

		if (velocity.y > 0 && position.y > viewport.height)
		{
			clouds.splice(c, 1);
			return true;
		}

		return false;
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
		// Update current time-of-day terrain
		active_terrain = cycle_back(++active_terrain, terrain_renders.length-1);

		// Determine background layering
		var new_bg = 'bg' + front_bg;
		var old_bg = 'bg' + bit_flip(front_bg);

		// Swap the actual screen elements and fade the new one in
		$(screen[old_bg].element()).css('z-index', '1');
		$(screen[new_bg].element()).css(
			{
				'opacity': '0',
				'z-index': '2'
			}
		).stop().animate(
			{
				opacity: '1'
			},
			{
				duration: configuration.cycleSpeed,
				easing: 'linear',
				progress: set_granular_light_level,
				complete: advance_bg_cycle
			}
		);
	}

	/**
	 * Immediately halts the background time cycle
	 * (only called during initial build process)
	 */
	function stop_bg_cycle()
	{
		$(screen.bg0.element()).stop();
		$(screen.bg1.element()).stop();
	}

	/**
	 * Tile the prerendered background terrain across the screen
	 */
	function render_bg()
	{
		var map_size = terrain.getSize();
		var tile_size = terrain.getTileSize();

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
			x: mod(Math.floor(camera.getPosition().x / tile_size), map_size),
			y: mod(Math.floor(camera.getPosition().y / tile_size), map_size)
		};
		// Sub-tile offset based on the background camera's pixel position
		var bg_pixel_offset =
		{
			x: tile_size - mod(camera.getPosition().x, tile_size),
			y: tile_size - mod(camera.getPosition().y, tile_size)
		};

		// Information for time-of-day rendering sources/targets
		var new_bg = 'bg' + front_bg;
		var old_bg = 'bg' + bit_flip(front_bg);
		var terrain_before = cycle_forward(active_terrain-1, terrain_renders.length-1);
		var new_terrain = terrain_renders[active_terrain];
		var old_terrain = terrain_renders[terrain_before];
		var map_limit, screen_limit, draw_offset, clip;

		while (tile_offset.x < tiles_to_draw.x || tile_offset.y < tiles_to_draw.y)
		{
			// Remaining tiles to the end of the map from current tile offset
			map_limit =
			{
				x: map_size - ((tile_offset.x + bg_tile_offset.x) % map_size),
				y: map_size - ((tile_offset.y + bg_tile_offset.y) % map_size)
			};
			// Remaining tiles needed to fill the screen
			screen_limit =
			{
				x: tiles_to_draw.x - tile_offset.x,
				y: tiles_to_draw.y - tile_offset.y
			};
			// Position to draw the next map chunk at
			draw_offset =
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
			clip =
			{
				x: tile_size * ((tile_offset.x + bg_tile_offset.x) % map_size),
				y: tile_size * ((tile_offset.y + bg_tile_offset.y) % map_size),
				width: tile_size * Math.min(map_limit.x, screen_limit.x),
				height: tile_size * Math.min(map_limit.y, screen_limit.y)
			};

			// Draw the map chunk to both background
			// screens for time-of-day transitioning
			screen[new_bg].draw
				.image(
					new_terrain,
					clip.x, clip.y, clip.width, clip.height,
					draw_offset.x, draw_offset.y, clip.width, clip.height
				);

			screen[old_bg].draw
				.image(
					old_terrain,
					clip.x, clip.y, clip.width, clip.height,
					draw_offset.x, draw_offset.y, clip.width, clip.height
				);

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
	 */
	function render_clouds()
	{
		screen.clouds.clear();

		// Light level rendering
		var color = get_time_color();
		screen.clouds.composite('source-over').alpha(0.7);
		screen.clouds.draw
			.rectangle(0, 0, viewport.width, viewport.height)
			.fill(rgb(color.red, color.green, color.blue));

		// Cloud/shadow rendering
		var viewport_w2 = viewport.width/2;
		var viewport_h2 = viewport.height/2;
		var cloud, position, instance, sprite, shadow, offset_factor, offset, draw;

		for (var c = 0 ; c < clouds.length ; c++)
		{
			cloud = clouds[c];
			position = cloud.get(Point).getPosition(configuration.pixelSnapping);
			instance = cloud.get(Cloud);
			sprite = instance.getImage();
			shadow = instance.getShadow();
			offset_factor = (instance.getType() === 'cirrus' ? (40 / viewport_w2) : (15 / viewport_w2));

			// Shadow rendering
			if (shadow !== null)
			{
				draw =
				{
					x: position.x + shadow_offset.x,
					y: position.y + shadow_offset.y
				};

				// Only draw shadows within the screen area
				if (
					(draw.x < viewport.width && draw.x + shadow.width > 0) &&
					(draw.y < viewport.height && draw.y + shadow.height > 0)
				)
				{
					// Target the background screens to avoid color
					// errors in the [cloud_stage] compositing process
					screen.bg0.draw.image(shadow, draw.x, draw.y);
					screen.bg1.draw.image(shadow, draw.x, draw.y);
				}
			}

			// Cloud rendering
			offset =
			{
				x: (position.x + sprite.width/2 - viewport_w2) * offset_factor,
				y: (position.y + sprite.height/2 - viewport_h2) * offset_factor
			};

			draw =
			{
				x: position.x + offset.x,
				y: position.y + offset.y
			};

			// Only draw clouds within the screen area
			if (
				(draw.x < viewport.width && draw.x + sprite.width > 0) &&
				(draw.y < viewport.height && draw.y + sprite.height > 0)
			)
			{
				cloud_stage.draw.image(sprite, draw.x, draw.y);
			}
		}

		// Composite [cloud_stage] onto the primary cloud screen
		screen.clouds.composite('destination-atop').alpha(1);
		screen.clouds.draw.image(cloud_stage.element());

		// Clear [cloud_stage] before the cycle completes
		// so we don't have to at the beginning of the next
		cloud_stage.clear();
	}

	/**
	 * Render all layers
	 */
	function render_all()
	{
		render_bg();
		render_clouds();
	}

	// Public:
	this.update = function(dt)
	{
		if (loaded)
		{
			camera.update(dt);

			var c = 0;

			while (c < clouds.length)
			{
				if (!cloud_purged(c))
				{
					clouds[c].update(dt);
					c++;
				}
			}

			render_all();
			respawn_clouds();

			// Lower cloud respawn cooldown so
			// clouds can continue generating
			cloud_cooldown -= camera.getAbsoluteVelocity() * dt;
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
		// Safeguard in case of re-building the
		// instance after first initialization
		_.unload();

		handlers = handlers || {};
		handlers.progress = handlers.progress || function(){};
		handlers.complete = handlers.complete || function(){};

		// For passing into the progress handler
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

		// Scale all [cloud_bank] cloud/shadow assets proportionally with
		// [configuration.tileSize] and store them as Canvas instances
		prerender_cloud_variants(
			{
				progress: handlers.progress,
				complete: function()
				{
					// Prerender terrain at different times of day
					prerender_terrain_variants(
						{
							progress: handlers.progress,
							complete: function()
							{
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

	this.unload = function()
	{
		loaded = false;
		stop_bg_cycle();
	}
}