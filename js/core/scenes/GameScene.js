/**
 * --------------------
 * Component: GameScene
 * --------------------
 *
 * Active Game object
 */
function GameScene( controller )
{
	Component.call( this );

	// -- Private: --
	var _ = this;

	var running = true;
	var initialized = false;
	var level = 1;
	var input = new InputHandler();
	var keys = new Keys();
	var camera;
	var drone;
	var speed;
	var background = new Entity();
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
	function DEBUG_show_stats( dt )
	{
		if ( ++DEBUG_stats_cycle > 2 ) {
			DEBUG_stats_cycle = 0;

			var DT_RATIO = ( 1 / 60 ) / dt;
			var fps = Math.round( 60 * DT_RATIO );
			var player = drone.get( Point ).getPosition( true );

			var data = [
				Viewport.width + ' x ' + Viewport.height,
				fps + 'fps, ' + dt,
				'X: ' + player.x + ', Y:' + player.y
			];

			DEBUG.innerHTML = data.join( '<br />' );
		}
	}

	/**
	 * Debug-mode-specific cycle updates
	 */
	function DEBUG_run_update()
	{
		drone.get( Drone ).restoreEnergy();
	}

	// ------------------------------------------ //
	// ------------- INITIALIZATION ------------- //
	// ------------------------------------------ //

	/**
	 * Sets up a scrolling planetary background
	 */
	function add_background()
	{
		if ( background.has( Background ) ) {
			return;
		}

		var t = Date.now();

		// Halt loop during generation/prerendering
		_.pause();

		background.add(
			new Background()
				.configure(
					{
						iterations: 11,
						elevation: 250,
						concentration: 35,
						smoothness: 8,
						repeat: true,
						cities: 250,
						maxCitySize: 40,
						tileSize: 2,
						lightAngle: 220,
						hours: [12, 19, 20, 0, 4, 6],
						cycleSpeed: 60,
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
						progress: function( rendered, total )
						{
							console.log('Rendering...' + rendered + '/' + total + '...');
						},
						complete: function()
						{
							console.log('Total init time: ' + ( Date.now() - t ) + 'ms');
							init_complete();
						}
					}
				)
		);

		stage.addChild( background );
	}

	/**
	 * Halts the scrolling background instance and
	 * dereferences its contents for garbage collection
	 */
	function destroy_background()
	{
		if ( background !== null && background.has( Background ) ) {
			background.remove( Background );
		}
	}

	/**
	 * Load level layout from data
	 */
	function load_level()
	{
		var entities = new LevelLoader()
			.buildLevel( level )
			.getEntities();

		for ( var e = 0 ; e < entities.length ; e++ ) {
			var module = entities[e];

			module.get( Sprite )
				.setOffset( Viewport.width / 2, Viewport.height / 2 )
				.setPivot( camera.get( Point ) );

			stage.addChild( module );
		}
	}

	/**
	 * Finish initialization and start game
	 */
	function init_complete()
	{
		initialized = true;

		input.listen();
		keys.listen();
		bind_input_handlers();

		camera = new Entity().add( new Point() );
		drone = new Entity()
			.add( new Drone() )
			.add( new Point() )
			.add(
				new Sprite( Assets.getImage( 'game/drone/drone.png' ) )
					.setOffset( Viewport.width / 2, Viewport.height / 2 )
					.setPivot( camera.get( Point ) )
					.centerOrigin()
			);
		speed = drone.get( Drone ).getMaxSpeed();

		load_level();

		stage.addChild( camera );
		stage.addChild( drone );

		hud = new HUD();

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
		var player = drone.get( Point ).getPosition();
		var minimum_distance = Number.POSITIVE_INFINITY;
		var position, distance, entity;

		player.x += drone.get( Sprite ).width() / 2;
		player.y += drone.get( Sprite ).height() / 2;

		stage.forAllComponentsOfType( HardwarePart, function( part ) {
			position = part.getPosition();
			position.x += part.getSpecs().width / 2;
			position.y += part.getSpecs().height / 2;

			distance = Vec2.distance( player.x, player.y, position.x, position.y );

			if ( distance < minimum_distance ) {
				entity = part.owner;
				minimum_distance = distance;
			}
		} );

		if ( minimum_distance < 200 && drone.get( Point ).getAbsoluteVelocity() < 50 ) {
			drone.get( Drone ).dockWith( entity );
		}
	}

	// ----------------------------------------- //
	// ------------- INPUT ACTIONS ------------- //
	// ----------------------------------------- //

	/**
	 * Continually listen for held keys
	 */
	function poll_input( dt )
	{
		if ( drone.get( Drone ).isControllable() ) {
			if ( keys.holding( 'UP' ) ) {
				drone.get( Drone ).consumeFuel( 3 * dt ).addVelocity( speed );
			}

			if ( keys.holding( 'LEFT' ) ) {
				drone.get( Drone ).consumeFuel( 2 * dt ).addSpin( -speed );
			}

			if ( keys.holding( 'RIGHT' ) ) {
				drone.get( Drone ).consumeFuel( 2 * dt ).addSpin( speed );
			}
		}
	}

	/**
	 * One-time bindings for single-press inputs
	 */
	function bind_input_handlers()
	{
		// Spin stabilization
		input.on( 'S', function() {
			drone.get( Drone ).stabilize();
		} );

		// Docking mode
		input.on( 'D', function() {
			if ( !drone.get( Drone ).isDocking() ) {
				enter_docking_mode();
			} else {
				drone.get( Drone ).abortDocking();
			}
		} );
	}

	// --------------------------------------- //
	// ------------- UPDATE LOOP ------------- //
	// --------------------------------------- //

	/**
	 * Have the camera follow the player drone
	 */
	function update_camera()
	{
		var view = camera.get( Point ).getPosition();
		var player = drone.get( Point ).getPosition();

		camera.get( Point ).setPosition(
			lerp( view.x, player.x, 0.075 ),
			lerp( view.y, player.y, 0.075 )
		);
	}

	/**
	 * Pass game state information to HUD and refresh it
	 */
	function update_HUD()
	{
		hud.clear();
		hud.updateDroneStats( drone.get( Drone ) );
	}

	// Public:
	this.update = function( dt )
	{
		if ( initialized && running ) {
			poll_input( dt );
			update_camera();
			update_HUD();

			if ( DEBUG_MODE ) {
				DEBUG_show_stats( dt );
				DEBUG_run_update();
			}
		}
	};

	this.onAdded = function()
	{
		_.owner.addChild( stage );
	};

	/**
	 * Configure the game level
	 */
	this.setLevel = function( _level )
	{
		level = _level;
		return _;
	};

	/**
	 * Load game instance
	 */
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
	};

	/**
	 * Start/resume game
	 */
	this.start = function()
	{
		if ( initialized ) {
			if ( !running ) running = true;

			// Restart SceneManager loop
			controller.scenes.resume();
		}

		return _;
	};

	/**
	 * Pause game
	 */
	this.pause = function()
	{
		running = false;
		return _;
	};

	/**
	 * Stop game and dereference objects for garbage collection
	 */
	this.unload = function()
	{
		initialized = false;
		_.pause();
		destroy_background();

		keys.unlisten().reset();
		input.unlisten().unbindEvents();
		camera = null;
		drone = null;
		stage.disposeChildren();

		return _;
	};

	/**
	 * Check to see whether the game is loaded
	 */
	this.isLoaded = function()
	{
		return initialized;
	};

	/**
	 * Set debug mode
	 */
	this.debug = function( bool )
	{
		DEBUG_MODE = bool;
		return _;
	};
}