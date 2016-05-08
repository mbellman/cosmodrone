function GameInstance(assets)
{
	// Private:
	var _ = this;
	var DEBUG_MODE = false;
	var frametime = 1000 / 60;
	var time;
	var active = false;
	var running = true;
	var loaded = false;
	var loop_timeout;
	var level = 1;
	var input = new InputHandler();
	var keys = new Keys();
	var camera;
	var drone;
	var background;
	var entities = [];

	// ----------------------------------------- //
	// ------------- Input actions ------------- //
	// ----------------------------------------- //

	function check_input()
	{
		var speed = drone.get(Drone).getSpeed();

		if (keys.holding('UP'))
		{
			drone.get(MovingPoint).setVelocity(0, -1*speed, true);
		}

		if (keys.holding('RIGHT'))
		{
			drone.get(MovingPoint).setVelocity(speed, 0, true);
		}

		if (keys.holding('DOWN'))
		{
			drone.get(MovingPoint).setVelocity(0, speed, true);
		}

		if (keys.holding('LEFT'))
		{
			drone.get(MovingPoint).setVelocity(-1*speed, 0, true);
		}
	}

	// --------------------------------------- //
	// ------------- Update loop ------------- //
	// --------------------------------------- //

	/**
	 * Update the Sprite coordinates of all objects
	 * based on the current [camera] [x, y] position
	 */
	function set_camera_offsets()
	{
		var camera_position = camera.get(MovingPoint).getPosition();

		for (var e = 0 ; e < entities.length ; e++)
		{
			var entity = entities[e];
			var object = entity.get(MovingPoint);
			var sprite = entity.get(Sprite);

			if (object !== null && sprite !== null)
			{
				var position = object.getPosition();
				var offset_x = position.x - camera_position.x;
				var offset_y = position.y - camera_position.y;

				sprite.setXY(offset_x, offset_y);
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
			if (running && loaded)
			{
				var new_time = Date.now();
				var dt = (new_time - time) / 1000;

				screen.game.clear();
				set_camera_offsets();
				check_input();
				update(dt);

				time = new_time;

				if (DEBUG_MODE)
				{
					var dt_ratio = (1/60) / dt;
					var fps = Math.round(60 * dt_ratio);

					$('.debug').html(fps + 'fps, ' + dt);
				}
			}

			loop_timeout = setTimeout(loop, frametime);
		}
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
					start();
				}
			}
		));

		entities.push(background);
	}

	/**
	 * Halts the scrolling background instance and
	 * purges its contents from memory via dereferencing
	 */
	function destroy_background()
	{
		if (background !== null && typeof background !== 'undefined')
		{
			background.get(Background).halt();
			background = null;
		}
	}

	/**
	 * Finish initialization and start game
	 */
	function start()
	{
		input.listen();
		keys.listen();

		camera = new Entity()
		.add(new MovingPoint());

		drone = new Entity()
		.add(new Drone())
		.add(new MovingPoint())
		.add(
			new Sprite(assets.getImage('drone/drone.png'))
			.setXY(viewport.width/2, viewport.height/2)
			.follow(camera.get(MovingPoint))
		);

		entities.push(camera);
		entities.push(drone);

		loaded = true;
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