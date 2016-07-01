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

	// Game mode definitions
	var Modes = {
		PILOT_MODE: 1,
		DOCK_MODE: 2
	};

	// General variables
	var running = true;                       // Boolean for game active state
	var initialized = false;                  // Boolean for game session loaded state
	var level = 1;                            // Current level
	var mode = Modes.PILOT_MODE;              // Current gameplay mode
	var input = new InputHandler();           // Input event manager
	var keys = new Keys();                    // Key state manager
	var stage = new Entity();                 // Game entity hierarchy
	var background;                           // Background scene entity
	var station;                              // Space station entity hierarchy
	var camera;                               // Game camera object entity
	var drone;                                // Player drone entity
	var hud;                                  // HUD entity
	var textbox;                              // Dialogue box entity
	var frames;                               // FrameCounter component for periodic callbacks
	var FLAGS = {};                           // Event flags
	var DRONE_SPEED;                          // Drone acceleration rate

	// Cycle counter limits
	var SIGNAL_CYCLE = 30;                    // Number of frames before updating radio signal strength
	var DEBUG_STATS_CYCLE = 3;                // Number of frames before updating debug information

	// Debug variables
	var DEBUG_MODE = false;                   // Boolean for debug mode state
	var DEBUG_text;                           // Debug text entity

	// HardwarePart alert icon graphics
	var ALERT_RECHARGE = Assets.getImage( 'game/ui/alert/recharger.png' );
	var ALERT_REFUEL = Assets.getImage( 'game/ui/alert/refueler.png' );
	var ALERT_MALFUNCTION = 3;

	// ------------------------------------- //
	// ------------- DEBUGGING ------------- //
	// ------------------------------------- //

	/**
	 * Update stats every 3 frames
	 */
	function DEBUG_show_stats( dt )
	{
		dt = Round.toDecimal( dt, 4 );

		var DT_RATIO = ( 1 / 60 ) / dt;
		var fps = Math.round( 60 * DT_RATIO );
		var player = drone.get( Point ).getPosition( true );

		var data = [
			Viewport.width + ' x ' + Viewport.height,
			fps + 'fps, ' + dt,
			'X: ' + player.x + ', Y:' + player.y
		];

		DEBUG_text.get( TextString )
			.setString( '[rgb=#f00]' + data.join( '[br]' ) );
	}

	/**
	 * Debug-mode-specific cycle updates
	 */
	function DEBUG_run_updates()
	{
		// ...
	}

	// ------------------------------------------ //
	// ------------- INITIALIZATION ------------- //
	// ------------------------------------------ //

	/**
	 * Sets up a scrolling planetary background
	 */
	function create_background()
	{
		if ( typeof background !== 'undefined' && background.has( Background ) ) {
			return;
		}

		var t = Date.now();

		// Halt loop during generation/prerendering
		_.pause();

		// TODO: Load background configuration options from level data
		background = new Entity()
			.add(
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
								initialize_game();
							}
						}
					)
			);

		stage.addChild( background );
	}

	/**
	 * Purge the scrolling background via component removal
	 */
	function destroy_background()
	{
		if ( typeof background !== 'undefined' && background.has( Background ) ) {
			background.remove( Background );
		}
	}

	/**
	 * Create the player drone entity and accompanying camera
	 */
	function create_player()
	{
		camera = new Entity()
			.add( new Point() );

		drone = new Entity()
			.add( new Point() )
			.add( new Countdown() )
			.add(
				new Drone()
					.onDocking( handle_docking )
					.onUnDocking( handle_undocking )
			)
			.add(
				new Sprite( Assets.getImage( 'game/drone/1.png' ) )
					.setOffset( Viewport.width / 2, Viewport.height / 2 )
					.setPivot( camera.get( Point ) )
					.centerOrigin()
			);

		DRONE_SPEED = drone.get( Drone ).getMaxSpeed();
	}

	/**
	 * Create a new [station] entity, load and create a new
	 * [level] layout, and add the returned entities to [station]
	 */
	function create_level()
	{
		station = new Entity();

		var entities = new LevelLoader()
			.buildLevel( level )
			.getEntities();

		for ( var e = 0 ; e < entities.length ; e++ ) {
			var module = entities[e];

			module.get( Sprite )
				.setOffset( Viewport.width / 2, Viewport.height / 2 )
				.setPivot( camera.get( Point ) );

			station.addChild( module );
		}
	}

	/**
	 * Set up persistent alert icons near all hardware parts
	 */
	function create_alert_icons()
	{
		station.forAllComponentsOfType( HardwarePart, function( part ) {
			switch ( part.getSpecs().name ) {
				case 'RECHARGER':
					part.setAlert( ALERT_RECHARGE );
					break;
				case 'REFUELER':
					part.setAlert( ALERT_REFUEL );
					break;
				default:
					// TODO: Consider adding a default "docking" alert to remaining hardware
					break;
			}
		} );
	}

	/**
	 * Set up the dialogue textbox entity
	 */
	function create_textbox()
	{
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
	}

	/**
	 * Set up the HUD entity
	 */
	function create_HUD()
	{
		hud = new Entity()
			.add(
				new HUD()
					.watch(
						{
							drone: drone.get( Drone ),
							station: station
						}
					)
			);
	}

	/**
	 * Set up functions to run periodically
	 */
	function register_cycles()
	{
		frames = new FrameCounter()
			.every( SIGNAL_CYCLE, check_radio_signal );

		if ( DEBUG_MODE ) {
			frames.every( DEBUG_STATS_CYCLE, DEBUG_show_stats );
		}

		stage.add( frames );
	}

	/**
	 * Instantiate game objects
	 */
	function initialize_game()
	{
		initialized = true;

		input.listen();
		keys.listen();

		create_player();
		create_level();
		create_alert_icons();
		create_textbox();
		create_HUD();

		stage.addChild( station, camera, drone, hud, textbox );

		bind_input_handlers();
		register_cycles();
		update_camera();
		set_drone_light_off();
		_.start();

		print_dialogue( 'Welcome! Testing! Test. Testing! 1234567890! : - )' );

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
	 * Ascertains the closest hardware part of [type] and
	 * returns an object with its owner entity and distance
	 */
	function find_closest_hardware( type )
	{
		type = type || '';

		var player = drone.get( Point ).getPosition();
		var minimum_distance = Number.POSITIVE_INFINITY;
		var position, distance, target;

		station.forAllComponentsOfType( HardwarePart, function( part ) {
			if ( type === '' || part.getSpecs().name === type ) {
				position = part.getPosition();
				position.x += part.getSpecs().width / 2;
				position.y += part.getSpecs().height / 2;

				distance = Vec2.distance( player.x, player.y, position.x, position.y );

				if ( distance < minimum_distance ) {
					target = part.owner;
					minimum_distance = distance;
				}
			}
		} );

		return {
			part: target,
			distance: minimum_distance
		};
	}

	/**
	 * Make the drone's light blink for 1/5 of a second
	 */
	function set_drone_light_on()
	{
		drone.get( Sprite ).setSource( Assets.getImage( 'game/drone/2.png' ) );

		drone.get( Countdown )
			.wait( 0.2 )
			.fire( set_drone_light_off );
	}

	/**
	 * Keep the drone's light off for 1.5 seconds
	 */
	function set_drone_light_off()
	{
		drone.get( Sprite ).setSource( Assets.getImage( 'game/drone/1.png' ) );

		drone.get( Countdown )
			.wait( 1.5 )
			.fire( set_drone_light_on );
	}

	/**
	 * Determine drone signal strength based on
	 * the closest 'COMM_DISH' hardware part
	 */
	function check_radio_signal()
	{
		var _drone = drone.get( Drone );
		var radio = find_closest_hardware( 'COMM_DISH' );

		if ( typeof radio.part !== 'undefined' ) {
			drone.get( Drone ).signal = 4 - Math.floor( clamp( radio.distance, 0, 4000 ) / 1000 );
		} else {
			drone.get( Drone ).signal = 0;
		}

		hud.get( HUD ).updateRadioSignal( drone.get( Drone ).signal );
	}

	/**
	 * Check for nearby hardware parts and dock with
	 * any close enough in proximity to the drone
	 */
	function enter_docking_mode()
	{
		var hardware = find_closest_hardware();

		if (
			hardware.distance < 200 &&
			drone.get( Point ).getAbsoluteVelocity() < 50
		) {
			drone.get( Drone ).dockWith( hardware.part );
		}
	}

	/**
	 * Docking event handler
	 */
	function handle_docking( specs )
	{
		mode = Modes.DOCK_MODE;

		switch ( specs.name ) {
			case 'RECHARGER':
				print_dialogue( 'This is a recharger unit. Use it to recharge your power!' );
				hud.get( HUD ).showChargeMeter();
				break;
			case 'REFUELER':
				print_dialogue( 'This is a refueler unit. Use it to refuel your propellant!' );
				break;
			default:
				hud.get( HUD ).expandStationPane();
				break;
		}
	}

	/**
	 * Undocking event handler
	 */
	function handle_undocking()
	{
		hud.get( HUD )
			.hideChargeMeter()
			.collapseStationPane();

		mode = Modes.PILOT_MODE;
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

		var hide_delay = 10 + ( string.length * 30 ) / 1000;

		textbox.find( TextPrinter ).print( string );
		textbox.find( Countdown ).wait( hide_delay );
	}

	/**
	 * Print a succession of dialogue strings
	 *
	 * TODO: Set up external dialogue bank and
	 * load [text] in from the global object
	 */
	function print_dialogue_chunk( text )
	{

	}

	// ----------------------------------------- //
	// ------------- INPUT ACTIONS ------------- //
	// ----------------------------------------- //

	/**
	 * Check to see whether the player is scrolling
	 * through the hardware part list with SHIFT
	 */
	function is_scrolling_hardware()
	{
		return (
			keys.holding( 'SHIFT' ) &&
			mode === Modes.PILOT_MODE
		);
	}

	/**
	 * Continually listen for held keys
	 */
	function poll_input( dt )
	{
		if ( !is_scrolling_hardware() ) {
			if ( drone.get( Drone ).isControllable() ) {
				if ( keys.holding( 'UP' ) ) {
					drone.get( Drone )
						.consumeFuel( 3 * dt )
						.addVelocity( DRONE_SPEED );
				}

				if ( keys.holding( 'LEFT' ) ) {
					drone.get( Drone )
						.consumeFuel( 2 * dt )
						.addSpin( -DRONE_SPEED );
				}

				if ( keys.holding( 'RIGHT' ) ) {
					drone.get( Drone )
						.consumeFuel( 2 * dt )
						.addSpin( DRONE_SPEED );
				}
			}
		} else {
			// Immediately restore HUD visibility
			// when navigating hardware menu
			hud.get( HUD ).unfade();
		}
	}

	/**
	 * Bindings for single-press inputs
	 */
	function bind_input_handlers()
	{
		var _Drone = drone.get( Drone );

		// Partially hide HUD on input...
		input.on( 'input', function( key ) {
			if (
				// ...if in pilot mode...
				mode === Modes.PILOT_MODE &&
				// ...and the pressed key is not SHIFT...
				key !== 16 &&
				// ...and the player isn't scrolling through hardware
				!is_scrolling_hardware()
			) {
				hud.get( HUD ).fade();
			}
		} );

		// Spin stabilization
		input.on( 'S', function() {
			if ( _Drone.isControllable() ) {
				_Drone.stabilize();
			}
		} );

		// Docking-related actions
		input.on( 'D', function() {
			if ( _Drone.signal > 0 ) {
				if ( _Drone.isDocked() ) {
					_Drone.undock();
				} else
				if ( !_Drone.isDocking() ) {
					enter_docking_mode();
				} else {
					_Drone.abortDocking();
				}
			}
		} );

		// Hardware menu navigation
		input.on( 'UP', function() {
			if ( is_scrolling_hardware() ) {
				hud.get( HUD ).scrollHardware( 'up' );
			}
		} );

		input.on( 'DOWN', function() {
			if ( is_scrolling_hardware() ) {
				hud.get( HUD ).scrollHardware( 'down' );
			}
		} );

		input.on( 'ENTER', function() {
			if ( is_scrolling_hardware() ) {
				hud.get( HUD ).selectHardware();
			}
		} );
	}

	// ---------------------------------------- //
	// ------------- UPDATE CYCLE ------------- //
	// ---------------------------------------- //

	/**
	 * Set the [camera] position to a value between
	 * its current position and the drone position
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

	// -- Public: --
	this.update = function( dt )
	{
		if ( initialized && running ) {
			poll_input( dt );
			update_camera();

			if ( DEBUG_MODE ) {
				DEBUG_run_updates();
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
		// Stop requestAnimationFrame() in the SceneManager loop from
		// causing script hangs in tandem with level generation
		controller.scenes.pause();

		// Safeguard for calling init() again on a loaded instance
		_.unload();

		create_background();
		//initialize_game();
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
		keys.unlisten().reset();
		input.unlisten().unbindEvents();
		destroy_background();
		stage.disposeAll();

		return _;
	};

	/**
	 * Check to see whether the game has initialized
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