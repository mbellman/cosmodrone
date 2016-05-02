function GameInstance(assets)
{
	// Private:

	var _ = this;
	// Framerate/dt variables
	var frametime = 1000 / 60;
	var time;
	// Loop state variables
	var active = false;
	var running = true;
	var loaded = false;
	// Game variables
	var level = 1;
	// Core objects
	var terrain;
	var terrains = [];
	var bgcamera;
	var camera;
	var drone;
	// System state variables
	var evening = true;
	var frontbg = 0;
	var activeterrain = 0;

	// ------------------------------------------------------------- //
	// ------------- Game-specific classes and objects ------------- //
	// ------------------------------------------------------------- //

	/**
	 * A controllable camera instance
	 */
	function Camera()
	{
		// Private:
		var _ = this;
		var position = new Vec2();
		var velocity = new Vec2();

		// Public:
		this.position = function()
		{
			return {
				x: position.x,
				y: position.y
			};
		}

		this.setVelocity = function(x, y)
		{
			velocity.x = x;
			velocity.y = y;
			return _;
		}

		this.update = function(dt)
		{
			position.add(velocity, dt);
		}
	}

	/**
	 * The player drone
	 */
	function Drone()
	{

	}

	// --------------------------------------------------------- //
	// ------------- Environmental/ambient effects ------------- //
	// --------------------------------------------------------- //

	/**
	 * Prerender a single terrain variant at a
	 * specific hour with a completion callback
	 */
	function prerender_terrain_variant(hour, callback)
	{
		var map_size = terrain.getSize();
		var tile_size = terrain.getTileSize();

		terrain.setTime(hour);
		terrains.push(new Canvas(new Element('canvas')).setSize(tile_size*map_size, tile_size*map_size));
		terrains[terrains.length-1].draw.image(terrain.canvas);

		callback = callback || function(){};
		callback();
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
					prerender_terrain_variant(hour, INTERNAL_prerender_next);
					if (++t <= total) parameters.progress(t, total);
				}, 100);

				return;
			}

			parameters.complete();
		}

		// Start rendering first variant
		INTERNAL_prerender_next();
	}

	/**
	 * Places a new time-of-day background in
	 * front with opacity 0 and fades it in
	 */
	function advance_bg_cycle()
	{
		// Switch background screens
		frontbg = bit_flip(frontbg);

		// Update time-of-day cycle
		if (++activeterrain > terrains.length-1)
		{
			activeterrain = 0;
		}

		var newbg = 'bg' + frontbg;
		var oldbg = 'bg' + bit_flip(frontbg);

		// Swap the actual screen elements
		$(screen[oldbg].element()).css('z-index', '1');
		$(screen[newbg].element()).css(
			{
				'opacity' : '0',
				'z-index' : '2'
			}
		).stop().animate(
			{
				opacity: 1
			},
			{
				duration: 30000,
				easing: 'linear',
				complete: advance_bg_cycle
			}
		);
	}

	// ---------------------------------------------- //
	// ------------- Graphics rendering ------------- //
	// ---------------------------------------------- //

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
			x: mod(Math.floor(bgcamera.position().x / tile_size), map_size),
			y: mod(Math.floor(bgcamera.position().y / tile_size), map_size)
		};
		// Sub-tile offset based on the background camera's pixel position
		var bg_pixel_offset =
		{
			x: tile_size - mod(bgcamera.position().x, tile_size),
			y: tile_size - mod(bgcamera.position().y, tile_size)
		};
		// Information for time-of-day rendering sources/targets
		var newbg = 'bg' + frontbg;
		var oldbg = 'bg' + bit_flip(frontbg);
		var terrainbefore = cycle_forward(activeterrain-1, terrains.length-1);
		var newterrain = terrains[activeterrain].element();
		var oldterrain = terrains[terrainbefore].element();

		while (tile_offset.x < tiles_to_draw.x || tile_offset.y < tiles_to_draw.y)
		{
			// Remaining tiles to the end of the map from current offset
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
				x: Math.floor(tile_size * tile_offset.x + bg_pixel_offset.x - tile_size),
				y: Math.floor(tile_size * tile_offset.y + bg_pixel_offset.y - tile_size)
			};
			// Clipping parameters for next map chunk
			var clip =
			{
				x: tile_size * ((tile_offset.x + bg_tile_offset.x) % map_size),
				y: tile_size * ((tile_offset.y + bg_tile_offset.y) % map_size),
				width: tile_size * Math.min(map_limit.x, screen_limit.x),
				height: tile_size * Math.min(map_limit.y, screen_limit.y)
			};

			// Draw the map chunk
			screen[newbg].draw.image(newterrain, clip.x, clip.y, clip.width, clip.height, draw_offset.x, draw_offset.y, clip.width, clip.height);
			screen[oldbg].draw.image(oldterrain, clip.x, clip.y, clip.width, clip.height, draw_offset.x, draw_offset.y, clip.width, clip.height);

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

	// --------------------------------------- //
	// ------------- Update loop ------------- //
	// --------------------------------------- //

	function update(dt)
	{
		bgcamera.update(dt);
	}

	function render()
	{
		render_bg();
	}

	function loop()
	{
		if (active)
		{
			if (running && loaded)
			{
				var newtime = Date.now();
				var dt = (newtime - time) / 1000;

				update(dt);
				render();

				time = newtime;
			}

			setTimeout(loop, frametime);
		}
	}

	// Public:
	this.init = function()
	{
		var t = Date.now();
		// Generate and render background terrain
		terrain = new Terrain()
		.build(
			{
				iterations: 11,
				elevation: 250,
				concentration: 35,
				smoothness: 8,
				repeat: true
			}
		)
		.setLightAngle(220)
		.setCityCount(200)
		.setMaxCitySize(30)
		.setTileSize(2)
		.render();

		// Prerender terrain at different times of day
		prerender_terrain_variants(
			{
				times: [12, 19, 20, 0, 4, 6],
				progress: function(rendered, total)
				{
					console.log('Prerendering...' + rendered + '/' + total + '...');
				},
				complete: function()
				{
					console.log('Total init time: ' + (Date.now() - t) + 'ms');

					bgcamera = new Camera().setVelocity(15, 3);
					camera = new Camera();
					drone = new Drone();

					if (active && running) advance_bg_cycle();

					loaded = true;
				}
			}
		);

		return _;
	}

	this.start = function()
	{
		if (!active)
		{
			active = true;
			time = Date.now();
			loop();

			if (loaded) advance_bg_cycle();
		}

		if (!running)
		{
			running = true;
		}

		return _;
	}

	this.stop = function()
	{
		active = false;
	}

	this.pause = function()
	{
		running = false;
	}
}