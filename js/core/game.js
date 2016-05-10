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
	var speed;
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
	 * Load level layout from data
	 */
	function load_level()
	{
		var data = LevelData[level];
		var object, file;

		for (var d = 0 ; d < data.length ; d++)
		{
			object = data[d];
			file = ObjectMap[object.type].file;

			entities.push(
				new Entity()
					.add(
						new Sprite(assets.getImage(file))
							.setXY(object.x, object.y)
							.offset(viewport.width/2, viewport.height/2)
							.pivot(camera.get(Point))
					)
					.add(
						new Point()
							.setPosition(object.x, object.y)
					)
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
		bind_input_handlers();

		// Instantiate camera
		camera = new Entity().add(new Point());
		// Instantiate player drone
		drone = new Entity()
			.add(new Drone())
			.add(new Point())
			.add(
				new Sprite(assets.getImage('drone/drone.png'))
					.offset(viewport.width/2, viewport.height/2)
					.pivot(camera.get(Point))
					.centerOrigin()
			);
		// Store drone speed value
		speed = drone.get(Drone).getSpeed();

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
	 * Continually listen for key inputs and respond accordingly
	 */
	function poll_input(dt)
	{
		// 
		var _drone =
		{
			position: drone.get(Point),
			sprite: drone.get(Sprite),
			speed: speed
		};

		if (keys.holding('UP'))
		{
			var x = Math.sin(_drone.sprite.rotation * Math.PI_RAD);
			var y = Math.cos(_drone.sprite.rotation * Math.PI_RAD) * -1;

			_drone.position.setVelocity(
				x * _drone.speed,
				y * _drone.speed,
				true
			);
		}

		if (keys.holding('LEFT'))
		{
			drone.get(Drone).addSpin(-speed);
		}

		if (keys.holding('RIGHT'))
		{
			drone.get(Drone).addSpin(speed);
		}
	}

	/**
	 * One-time bindings for single-press inputs
	 */
	function bind_input_handlers()
	{
		// Spin stabilization
		input.on('S', function()
		{
			drone.get(Drone).stabilize();
		});
	}

	// --------------------------------------- //
	// ------------- Update loop ------------- //
	// --------------------------------------- //

	/**
	 * Iterate over all Sprites and clear
	 * the screen at their drawn coordinates
	 */
	function clear_screen()
	{
		var sprite, position, coordinates, buffer;

		for (var e = 0 ; e < entities.length ; e++)
		{
			sprite = entities[e].get(Sprite);

			if (sprite !== null)
			{
				position = sprite.getScreenCoordinates();
				coordinates =
				{
					x: position.x,
					y: position.y,
					width: sprite.scale * sprite.getWidth(),
					height: sprite.scale * sprite.getHeight()
				};

				// Only clear screen for visible Sprites
				if (
					(coordinates.x < viewport.width && coordinates.x + coordinates.width > 0) &&
					(coordinates.y < viewport.height && coordinates.y + coordinates.height > 0)
				)
				{
					if (sprite.rotation > 0)
					{
						buffer = Math.max(coordinates.width, coordinates.height);
					}
					else
					{
						if (sprite.snap) buffer = 0;
						else buffer = 1;
					}

					screen.game.clear(
						coordinates.x - buffer,
						coordinates.y - buffer,
						coordinates.width + 2*buffer,
						coordinates.height + 2*buffer
					);
				}
			}
		}
	}

	/**
	 * Have the camera follow the player drone
	 */
	function update_camera()
	{
		var view = camera.get(Point).getPosition();
		var player = drone.get(Point).getPosition();

		camera.get(Point).setPosition(
			lerp(view.x, player.x, 0.075),
			lerp(view.y, player.y, 0.075)
		);
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
				poll_input(1/60);
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