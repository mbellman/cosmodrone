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
		// Save camera component reference
		var view = camera.get(Point);
		// Get and build level layout
		var level_data = LevelData[level];
		var level_entities = new LevelLoader(assets)
			.setLayout(level_data.layout)
			.getEntities();
		var entity;

		for (var e = 0 ; e < level_entities.length ; e++)
		{
			entity = level_entities[e];
			entity.get(Sprite).pivot(view);
			entities.push(entity);
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
		var sprite = {}, buffer;

		for (var e = 0 ; e < entities.length ; e++)
		{
			sprite.component = entities[e].get(Sprite);

			if (sprite.component !== null)
			{
				// Get rendering information about the Sprite
				sprite.position = sprite.component.getScreenCoordinates();
				sprite.width = sprite.component.scale * sprite.component.getWidth();
				sprite.height = sprite.component.scale * sprite.component.getHeight();

				// Only clear screen around visible Sprites
				if (
					(sprite.position.x < viewport.width && sprite.position.x + sprite.width > 0) &&
					(sprite.position.y < viewport.height && sprite.position.y + sprite.height > 0)
				)
				{
					if (sprite.component.rotation > 0)
					{
						// Clear more space surrounding the sprite
						// if it is rotated to ensure proper erasure
						buffer = Math.max(sprite.width, sprite.height);
					}
					else
					{
						if (sprite.component.snap) buffer = 0;
						else buffer = 1;
					}

					screen.game.clear(
						sprite.position.x - buffer,
						sprite.position.y - buffer,
						sprite.width + 2*buffer,
						sprite.height + 2*buffer
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
	 * Game update loop
	 */
	function update(dt)
	{
		// Game system updates
		clear_screen();
		poll_input(dt);
		update_camera();

		// Entity updates
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