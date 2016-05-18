function GameInstance(controller, assets)
{
	// Private:
	var _ = this;

	var owner = null;
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
	var hud;
	var stage = new Entity();

	var DEBUG_MODE = false;
	var DEBUG_stats_cycle = 0;

	// ------------------------------------- //
	// ------------- DEBUGGING ------------- //
	// ------------------------------------- //

	/**
	 * Update stats every 3 frames
	 */
	function DEBUG_show_stats(dt)
	{
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

	/**
	 * Debug-mode-specific cycle updates
	 */
	function DEBUG_update()
	{
		drone.get(Drone).restoreEnergy();
	}

	// ------------------------------------------ //
	// ------------- INITIALIZATION ------------- //
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

		stage.addChild(background);
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
		// Construct level layout
		var entities = new LevelLoader(assets)
			.buildLevel(level)
			.getEntities();

		// Add level entities (station modules) to [stage]
		for (var e = 0 ; e < entities.length ; e++)
		{
			var module = entities[e];
			module.get(Sprite)
				.offset(viewport.width/2, viewport.height/2)
				.pivot(camera.get(Point));
			stage.addChild(module);
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
				new Sprite(assets.getImage('game/drone/drone.png'))
					.offset(viewport.width/2, viewport.height/2)
					.pivot(camera.get(Point))
					.centerOrigin()
			);
		// Store drone speed value
		speed = drone.get(Drone).getMaxSpeed();

		// Build level structure
		load_level();

		// Add camera + player entities last
		stage.addChild(camera);
		stage.addChild(drone);

		// Set up HUD
		hud = new HUD(assets);

		// Set initial camera position and start game loop
		update_camera();
		_.start();
	}

	// ----------------------------------------------------- //
	// ------------- INTERNAL GAMEPLAY METHODS ------------- //
	// ----------------------------------------------------- //

	/**
	 * Looks for HardwarePart instances close in proximity
	 * to the player Drone and docks with the nearest
	 */
	function enter_docking_mode()
	{
		var player = drone.get(Point).getPosition();
		var minimum_distance = Number.POSITIVE_INFINITY;
		var position, distance, entity;

		// Get center point of player
		player.x += drone.get(Sprite).getWidth()/2;
		player.y += drone.get(Sprite).getHeight()/2;

		stage.forAllComponentsOfType(HardwarePart, function(part)
		{
			// Get center point of part
			position = part.getPosition();
			position.x += part.getSpecs().width/2;
			position.y += part.getSpecs().height/2;

			// Get and compare distances
			distance = Vec2.distance(player.x, player.y, position.x, position.y);

			if (distance < minimum_distance)
			{
				entity = part.getOwner();
				minimum_distance = distance;
			}
		});

		if (minimum_distance < 150 && drone.get(Point).getAbsoluteVelocity() < 75)
		{
			drone.get(Drone).dockWith(entity);
		}
	}

	// ----------------------------------------- //
	// ------------- INPUT ACTIONS ------------- //
	// ----------------------------------------- //

	/**
	 * Continually listen for held keys
	 */
	function poll_input(dt)
	{
		if (drone.get(Drone).isControllable())
		{
			if (keys.holding('UP'))
			{
				drone.get(Drone).consumeFuel(3*dt).addVelocity(speed);
			}

			if (keys.holding('LEFT'))
			{
				drone.get(Drone).consumeFuel(2*dt).addSpin(-speed);
			}

			if (keys.holding('RIGHT'))
			{
				drone.get(Drone).consumeFuel(2*dt).addSpin(speed);
			}
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

		// Docking mode
		input.on('D', function()
		{
			if (!drone.get(Drone).isDocking())
			{
				enter_docking_mode();
			}
			else
			{
				drone.get(Drone).abortDocking();
			}
		});
	}

	// --------------------------------------- //
	// ------------- UPDATE LOOP ------------- //
	// --------------------------------------- //

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
	 * Pass game state information to HUD and refresh it
	 */
	function update_HUD()
	{
		// Clear [screen.HUD]
		hud.clear();

		// Update the drone system stats HUD
		hud.updateDroneStats(drone.get(Drone));
	}

	// Public:
	this.update = function(dt)
	{
		if (active)
		{
			if (running && initialized)
			{
				poll_input(dt);
				update_camera();
				update_HUD();

				if (DEBUG_MODE)
				{
					DEBUG_show_stats(dt);
					DEBUG_update();
				}
			}
		}
	}

	this.onAdded = function(entity)
	{
		owner = entity;
		owner.addChild(stage);
	}

	this.setLevel = function(_level)
	{
		level = _level;
		return _;
	}

	this.init = function()
	{
		// Stop requestAnimationFrame() in the
		// SceneManager loop from causing script
		// hangs in tandem with level generation
		controller.scenes.pause();
		// Safeguard for calling init()
		// again on a loaded instance
		_.unload();
		add_background();
		return _;
	}

	this.start = function()
	{
		if (initialized)
		{
			if (!active) active = true;
			if (!running) running = true;

			// Restart SceneManager loop
			controller.scenes.resume();
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
		stage.disposeChildren();

		return _;
	}

	this.isLoaded = function()
	{
		return initialized;
	}

	this.debug = function(state)
	{
		DEBUG_MODE = state;
		return _;
	}
}