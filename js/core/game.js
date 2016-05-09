function GameInstance(assets)
{
	// Private:
	var _ = this;
	var DEBUG_MODE = false;
	var frametime = 1000 / 60;
	var time;
	var active = false;
	var running = true;
	var initialized = false;
	var loop_timeout;
	var level = 1;
	var input = new InputHandler();
	var keys = new Keys();
	var camera;
	var drone;
	var background;
	var entities = [];

	// ------------------------------------- //
	// ------------- Debugging ------------- //
	// ------------------------------------- //

	function DEBUG_show_stats(dt)
	{
		var dt_ratio = (1/60) / dt;
		var fps = Math.round(60 * dt_ratio);
		var player = drone.get(MovingPoint).getPosition(true);

		var data =
		[
			fps + 'fps, ' + dt,
			'X: ' + player.x + ', Y:' + player.y
		];

		DEBUG.innerHTML = data.join('<br />');
	}

	// ------------------------------------------ //
	// ------------- Initialization ------------- //
	// ------------------------------------------ //

	/**
	 * Sets up a scrolling planetary background
	 */
	function add_background()
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
	 * Finish initialization and start game
	 */
	function init_complete()
	{
		initialized = true;

		// Handle input events
		input.listen();
		keys.listen();

		// Instantiate camera
		camera = new Entity().add(new MovingPoint());
		// Instantiate player drone
		drone = new Entity()
			.add(new Drone())
			.add(new MovingPoint())
			.add(
				new Sprite(assets.getImage('drone/drone.png'))
				.setXY(viewport.width/2, viewport.height/2)
			);

		entities.push(camera);
		entities.push(drone);

		_.start();
	}

	// ----------------------------------------- //
	// ------------- Input actions ------------- //
	// ----------------------------------------- //

	function listen_for_input()
	{
		var speed = drone.get(Drone).getSpeed();

		if (keys.holding('UP'))
		{
			drone.get(MovingPoint).setVelocity(0, -1*speed, true);
		}

		if (keys.holding('LEFT'))
		{
			drone.get(MovingPoint).setVelocity(-1*speed, 0, true);
		}

		if (keys.holding('DOWN'))
		{
			drone.get(MovingPoint).setVelocity(0, speed, true);
		}

		if (keys.holding('RIGHT'))
		{
			drone.get(MovingPoint).setVelocity(speed, 0, true);
		}
	}

	// --------------------------------------- //
	// ------------- Update loop ------------- //
	// --------------------------------------- //

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

				screen.game.clear();
				listen_for_input();
				update(dt);

				time = new_time;

				if (DEBUG_MODE)
				{
					DEBUG_show_stats(dt);
				}
			}

			//requestAnimationFrame(loop);
			loop_timeout = setTimeout(loop, frametime);
		}
	}

	// Public:
	this.init = function()
	{
		_.unload();
		add_background();

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
		clearTimeout(loop_timeout);
		keys.unlisten().reset();
		input.unlisten().unbindEvents();
		camera = null;
		drone = null;
		entities.length = 0;

		// Empty resize event queue
		resize_event_queue.length = 0;

		return _;
	}

	this.debug = function(state)
	{
		DEBUG_MODE = state;
		return _;
	}
}