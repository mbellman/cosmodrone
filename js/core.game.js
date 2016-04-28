function GameInstance()
{
	// Private:

	var _ = this;
	// Framerate/dt variables
	var frametime = 1000 / 60;
	var time;
	// Loop state variables
	var active = false;
	var running = true;
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

	// ------------- Game-specific classes and objects -------------- //

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

	// ------------- Environmental/ambient effects -------------- //

	/**
	 * Prerender variants of the terrain to
	 * reflect important hours of the day
	 */
	function prerender_terrain_variants()
	{
		var t = Date.now();
		var times = [12, 19, 20, 0, 4, 6];

		for (var i = 0 ; i < times.length ; i++)
		{
			terrain.setTime(times[i]);
			terrains.push(new Canvas(new Element('canvas')).setSize(terrain.size(), terrain.size()));
			terrains[i].draw.image(terrain.canvas);
		}
		console.log((Date.now() - t) + 'ms prerender');
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
		).animate(
			{
				opacity: 1
			},
			{
				duration: 6000,
				easing: 'linear',
				complete: advance_bg_cycle
			}
		);
	}

	// ------------- Graphics rendering -------------- //

	/**
	 * Draw prerendered terrain
	 */
	function render_bg()
	{
		var mapsize = terrain.size();
		var tilesize = terrain.tileSize();
		// Tile offset 'pointer'
		var tile_offset =
		{
			x: 0,
			y: 0
		};
		// Tiles needed for screen coverage
		var tiles_to_draw =
		{
			x: Math.ceil(viewport.width/tilesize) + 2,
			y: Math.ceil(viewport.height/tilesize) + 2
		};
		// Current tile the background camera is on
		var bg_tile_offset =
		{
			x: mod(Math.floor(bgcamera.position().x / tilesize), mapsize),
			y: mod(Math.floor(bgcamera.position().y / tilesize), mapsize)
		};
		// Sub-tile offset based on the background camera's pixel position
		var bg_pixel_offset =
		{
			x: tilesize - mod(bgcamera.position().x, tilesize),
			y: tilesize - mod(bgcamera.position().y, tilesize)
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
				x: mapsize - ((tile_offset.x + bg_tile_offset.x) % mapsize),
				y: mapsize - ((tile_offset.y + bg_tile_offset.y) % mapsize)
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
				x: Math.floor(tile_offset.x*tilesize + bg_pixel_offset.x - tilesize),
				y: Math.floor(tile_offset.y*tilesize + bg_pixel_offset.y - tilesize)
			};
			// Clipping parameters for next map chunk
			var clip =
			{
				x: tilesize * ((tile_offset.x + bg_tile_offset.x) % mapsize),
				y: tilesize * ((tile_offset.y + bg_tile_offset.y) % mapsize),
				width: tilesize * Math.min(map_limit.x, screen_limit.x),
				height: tilesize * Math.min(map_limit.y, screen_limit.y)
			};

			// Draw the map chunk
			screen[newbg].draw.image(newterrain, clip.x, clip.y, clip.width, clip.height, draw_offset.x, draw_offset.y, clip.width, clip.height);
			screen[oldbg].draw.image(oldterrain, clip.x, clip.y, clip.width, clip.height, draw_offset.x, draw_offset.y, clip.width, clip.height);

			// Advance the tile 'pointer' to determine
			// what and where to draw on the next cycle
			tile_offset.x += clip.width/tilesize;

			if (tile_offset.x >= tiles_to_draw.x)
			{
				tile_offset.y += clip.height/tilesize;

				if (tile_offset.y < tiles_to_draw.y)
				{
					tile_offset.x = 0;
				}
			}
		}
	}

	// ------------- Update loop -------------- //

	function update(dt)
	{
		bgcamera.update(dt);
	}

	function render()
	{
		screen.bg1.clear();
		render_bg();
	}

	function loop()
	{
		if (active)
		{
			if (running)
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
		// Base terrain
		terrain = new Terrain()
		.build(
			{
				iterations: 11,
				elevation: 200,
				concentration: 35,
				smoothness: 6,
				repeat: true
			}
		)
		.setLightAngle(60)
		.setTileSize(1)
		.render()
		.setTime(12);

		// Prerender terrain at different times of day
		prerender_terrain_variants();

		bgcamera = new Camera().setVelocity(20, 2);
		camera = new Camera();
		drone = new Drone();

		return _;
	}

	this.start = function()
	{
		if (!active)
		{
			active = true;
			time = Date.now();
			loop();
			advance_bg_cycle();
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