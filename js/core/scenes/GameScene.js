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
	var DRONE_SPEED;
	var background = new Entity();
	var hud;
	var stage = new Entity();

	var textbox;
	var textbox_timer = 0;

	var FLAGS = {};

	var DEBUG_MODE = false;
	var DEBUG_text;
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

			DEBUG_text.get( TextString).setString( '[rgb=#f00]' + data.join( '[br]' ) );
		}
	}

	/**
	 * Debug-mode-specific cycle updates
	 */
	function DEBUG_run_update()
	{
		// ...
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

		// TODO: Load background configuration options from level data
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
						maxCitySize: 45,
						tileSize: 2,
						lightAngle: 220,
						//hours: [12, 19, 20, 0, 4, 6],
						hours: [12],
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
	 * Load level layout, adding returned entities to the [stage]
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
	 * Finish initialization (background generation) and start game
	 */
	function init_complete()
	{
		initialized = true;

		input.listen();
		keys.listen();
		bind_input_handlers();

		camera = new Entity().add( new Point() );
		drone = new Entity()
			.add( new Point() )
			.add(
				new Drone()
					.onDocking( handle_docking )
			)
			.add(
				new Sprite( Assets.getImage( 'game/drone/drone.png' ) )
					.setOffset( Viewport.width / 2, Viewport.height / 2 )
					.setPivot( camera.get( Point ) )
					.centerOrigin()
			);
		DRONE_SPEED = drone.get( Drone ).getMaxSpeed();

		textbox = new Entity()
			.add(
				new Sprite( Assets.getImage( 'game/ui/textbox.png' ) )
					.setXY( 100, -200 )
			)
			.addChild(
				new Entity()
					.add(
						new Sprite().setXY( 30, 30 )
					)
					.add(
						new TextPrinter( 'Monitor' )
							.setSound(
								Assets.getAudio( 'ui/blip1.wav' ),
								Assets.getAudio( 'ui/blip2.wav' )
							)
							.setInterval( 30 )
					)
					.add(
						new Countdown().fire( hide_dialogue )
					)
			);

		hud = new HUD();

		load_level();
		stage.addChild( camera, drone, textbox );
		update_camera();
		_.start();

		print_dialogue( 'Dialogue test. Testing. 1234567890. +!-_-!+' );

		if ( DEBUG_MODE ) {
			DEBUG_text = new Entity()
				.add( new TextString( 'Monitor' ) )
				.addToParent( stage );
		}
	}

	// -------------------------------------------- //
	// ------------- GAMEPLAY METHODS ------------- //
	// -------------------------------------------- //

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

	/**
	 * Docking event handler
	 */
	function handle_docking( part )
	{
		switch ( part.name ) {
			case 'RECHARGER':
				print_dialogue( 'This is a recharger unit. Use it to recharge your power!' );
				break;
			case 'REFUELER':
				print_dialogue( 'This is a refueler unit. Use it to refuel your propellant!' );
				break;
			default:
				break;
		}
	}

	/**
	 * Swivel the dialogue box into view
	 */
	function show_dialogue()
	{
		textbox.get( Sprite ).y.tweenTo( 0, 0.75, Ease.quad.inOut );
	}

	/**
	 * Swivel the dialogue box out of view
	 */
	function hide_dialogue()
	{
		textbox.get( Sprite ).y.tweenTo( -200, 0.75, Ease.quad.inOut );
	}

	/**
	 * Print new dialogue into the text box,
	 * bringing it into view if it isn't already
	 */
	function print_dialogue( string )
	{
		if ( textbox.get( Sprite ).y._ === -200 ) {
			show_dialogue();
		}

		var timer = 10 + ( string.length * 30 ) / 1000;

		textbox.find( TextPrinter ).print( string );
		textbox.find( Countdown ).wait( timer );
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
				drone.get( Drone ).consumeFuel( 3 * dt ).addVelocity( DRONE_SPEED );
			}

			if ( keys.holding( 'LEFT' ) ) {
				drone.get( Drone ).consumeFuel( 2 * dt ).addSpin( -DRONE_SPEED );
			}

			if ( keys.holding( 'RIGHT' ) ) {
				drone.get( Drone ).consumeFuel( 2 * dt ).addSpin( DRONE_SPEED );
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
			if ( drone.get( Drone ).isDocked() ) {
				drone.get( Drone ).undock();
			} else
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
		//init_complete();
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