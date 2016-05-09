function GameInstance(assets)
{
	// Private:
	var _ = this;

	var time;
	var active = false;
	var running = true;
	var initialized = false;
	var level = 1;
	var input = new InputHandler();
	var keys = new Keys();
	var camera;
	var drone;
	var background;
	var entities = [];

	var DEBUG_MODE = false;
	var DEBUG_stats_cycle = 0;

	// ------------------------------------- //
	// ------------- Debugging ------------- //
	// ------------------------------------- //

	function DEBUG_show_stats(dt)
	{
		// Update stats every 3 frames
		if (++DEBUG_stats_cycle > 2)
		{
			DEBUG_stats_cycle = 0;

			var dt_ratio = (1/60) / dt;
			var fps = Math.round(60 * dt_ratio);
			var player = drone.get(Point).getPosition(true);

			var data =
			[
				viewport.width + ' x ' + viewport.height,
				fps + 'fps, ' + dt,
				'X: ' + player.x + ', Y:' + player.y
			];

			DEBUG.innerHTML = data.join('<br />');
		}
	}

	// ------------------------------------------ //
	// ------------- Initialization ------------- //
	// ------------------------------------------ //

	/**
	 * Sets up a scrolling planetary background
	 */
	function load_background()
	{
		var t = Date.now();

		// Halt loop during generation/prerendering
		_.stop();
		// Safeguard for re-generating a new
		// background if an older one exists
		destroy_background();

		// Generate the new background
		background = new Entity().add(new Background(assets)
			.configure(
				{
					iterations: 11,
					elevation: 250,
					concentration: 35,
					smoothness: 8,
					repeat: true,
					cities: 200,
					maxCitySize: 30,
					tileSize: 2,
					lightAngle: 220,
					hours: [12, 19, 20, 0, 4, 6],
					cycleSpeed: 60000,
					scrollSpeed:
					{
						x: -10,
						y: -2
					},
					pixelSnapping: false
				}
			)
			.build(
				{
					progress: function(rendered, total)
					{
						console.log('Rendering...' + rendered + '/' + total + '...');
					},
					complete: function()
					{
						console.log('Total init time: ' + (Date.now() - t) + 'ms');
						init_complete();
					}
				}
			)
		);

		entities.push(background);
	}

	/**
	 * Halts the scrolling background instance and
	 * dereferences its contents for garbage collection
	 */
	function destroy_background()
	{
		if (background !== null && typeof background !== 'undefined')
		{
			background.get(Background).unload();
			background = null;
		}
	}

	/**
	 * Load level layout from data
	 */
	function load_level()
	{
		var data = LevelData[level];

		for (var d = 0 ; d < data.length ; d++)
		{
			var object = data[d];
			var file = ObjectMap[object.type].file;

			entities.push(
				new Entity()
					.add(
						new Sprite(assets.getImage(file))
						.setXY(object.x, object.y)
						.follow(camera.get(Point))
					)
					.add(new Point().setPosition(object.x, object.y))
			);
		}
	}

	/**
	 * Finish initialization and start game
	 */
	function init_complete()
	{
		initialized = true;

		// Handle input events
		input.listen();
		keys.listen();

		// Instantiate camera
		camera = new Entity().add(new Point());
		// Instantiate player drone
		drone = new Entity()
			.add(new Drone())
			.add(new Point().setPosition(viewport.width/2, viewport.height/2))
			.add(
				new Sprite(assets.getImage('drone/drone.png'))
					.follow(camera.get(Point))
					.centerOrigin()
			);

		// Build level structure
		load_level();

		// Add camera + player entities last
		entities.push(camera);
		entities.push(drone);

		// Set initial camera position and start game loop
		update_camera();
		_.start();
	}

	// ----------------------------------------- //
	// ------------- Input actions ------------- //
	// ----------------------------------------- //

	/**
	 * Watch for key inputs and respond accordingly
	 */
	function listen_for_input()
	{
		var player = drone.get(Point);
		var speed = drone.get(Drone).getSpeed();

		if (keys.holding('UP'))
		{
			player.setVelocity(0, -1*speed, true);
		}

		if (keys.holding('LEFT'))
		{
			player.setVelocity(-1*speed, 0, true);
		}

		if (keys.holding('DOWN'))
		{
			player.setVelocity(0, speed, true);
		}

		if (keys.holding('RIGHT'))
		{
			player.setVelocity(speed, 0, true);
		}
	}

	/**
	 * Have the camera follow the player drone
	 */
	function update_camera()
	{
		var player = drone.get(Point).getPosition();

		camera.get(Point)
			.setPosition(
				player.x - viewport.width/2,
				player.y - viewport.height/2
			);
	}

	// --------------------------------------- //
	// ------------- Update loop ------------- //
	// --------------------------------------- //

	/**
	 * Iterate over all Sprites and clear
	 * the screen at their coordinates
	 */
	function clear_screen()
	{
		for (var e = 0 ; e < entities.length ; e++)
		{
			var sprite = entities[e].get(Sprite);

			if (sprite !== null)
			{
				screen.game.clear(
					sprite.getScreenX(),
					sprite.getScreenY(),
					sprite.scale * sprite.getWidth(),
					sprite.scale * sprite.getHeight()
				);
			}
		}
	}

	/**
	 * Entity update cycle
	 */
	function update(dt)
	{
		for (var e = 0 ; e < entities.length ; e++)
		{
			entities[e].update(dt);
		}
	}

	/**
	 * Game loop
	 */
	function loop()
	{
		if (active)
		{
			if (running && initialized)
			{
				var new_time = Date.now();
				var dt = (new_time - time) / 1000;

				clear_screen();
				listen_for_input();
				update_camera();
				update(1/60);

				time = new_time;

				if (DEBUG_MODE)
				{
					DEBUG_show_stats(dt);
				}
			}

			requestAnimationFrame(loop);
		}
	}

	// Public:
	this.init = function()
	{
		_.unload();
		load_background();
		return _;
	}

	this.start = function()
	{
		if (initialized)
		{
			if (!active)
			{
				active = true;
				time = Date.now();
				loop();
			}

			if (!running)
			{
				running = true;
			}
		}

		return _;
	}

	this.pause = function()
	{
		running = false;
		return _;
	}

	this.stop = function()
	{
		active = false;
		return _;
	}

	this.unload = function()
	{
		// Halt loop and destroy Background instance
		initialized = false;
		_.pause();
		_.stop();
		destroy_background();

		// Reset game objects
		keys.unlisten().reset();
		input.unlisten().unbindEvents();
		camera = null;
		drone = null;
		entities.length = 0;

		return _;
	}

	this.debug = function(state)
	{
		DEBUG_MODE = state;
		return _;
	}
}