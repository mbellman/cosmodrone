/**
 * --------------
 * Component: HUD
 * --------------
 *
 * An instance of the game's HUD interface
 */
function HUD()
{
	Component.call( this );

	// -- Private: --
	var _ = this;

	// Shorthand asset references
	var Graphics = {
		droneHUD: Assets.getImage( 'game/ui/drone.png' ),
		noise: {
			1: Assets.getImage( 'game/ui/radio/noise-1.png' ),
			2: Assets.getImage( 'game/ui/radio/noise-2.png' ),
			3: Assets.getImage( 'game/ui/radio/noise-3.png' ),
			4: Assets.getImage( 'game/ui/radio/noise-4.png' )
		}
	};

	// Major HUD element groups
	var Elements = {
		radar: null,
		radio: null,
		drone: null
	};

	// HUD element group display coordinates
	var Coordinates = {
		radar: {
			x: 72,
			y: Viewport.height - Graphics.droneHUD.height - 10,
			width: 150,
			height: 100
		},
		signal: {
			x: 72,
			y: Viewport.height - Graphics.droneHUD.height + 98
		},
		drone: {
			HUD: {
				x: 10,
				y: Viewport.height - Graphics.droneHUD.height - 20
			},
			system: {
				stabilizing: {x: 50, y: 156},
				docking: {x: 80, y: 162}
			},
			meters: {
				health: {
					x: 56,
					y: 212,
					width: 232,
					height: 10,
					stat: 'health',
					color: '#00ff30'
				},
				power: {
					x: 56,
					y: 230,
					width: 640,
					height: 18,
					stat: 'power',
					color: '#00b4cc'
				},
				charge: {
					x: 56,
					y: 230,
					width: 640,
					height: 18,
					stat: 'power',
					color: '#fff'
				},
				fuel: {
					x: 56,
					y: 236,
					width: 640,
					height: 6,
					stat: 'fuel',
					color: '#ccd'
				}
			}
		}
	};

	// Important game objects
	var Data = {
		// Player Drone component
		drone: null,
		// Space station group entity
		station: null
	};

	// Power charge meter variables
	var charging = {
		on: false,
		timer: 0,
		speed: 15
	};

	var stage = new Entity();                         // HUD stage
	var frames = new FrameCounter();                  // FrameCounter component for noise cycle
	var radio_signal = 4;                             // Radio signal strength (0 - 4)
	var radar_noise = 1;                              // Noise graphic to show for radar (cycles from 1 - 4)

	// ------------------------------------------ //
	// ------------- INITIALIZATION ------------- //
	// ------------------------------------------ //

	/**
	 * Set the radar signal source to the player
	 * drone's coordinate point only if both exist
	 */
	function update_radar_source()
	{
		if (
			Data.drone !== null &&
			Data.drone.owner.has( Sprite ) &&
			Elements.radar !== null
		) {
			Elements.radar.find( Radar )
				.setSignalSource( Data.drone.owner.get( Sprite ) );
		}
	}

	/**
	 * Set up the local radar map
	 */
	function create_radar_map()
	{
		Elements.radar = new Entity()
			.add(
				new Sprite()
					.setXY( Coordinates.radar.x, Coordinates.radar.y )
			)
			.addChild(
				new Entity( 'noise' )
					.add(
						new Sprite( Graphics.noise[1] )
							.setAlpha( 0 )
					)
					.add(
						new Flicker()
							.setTimeRange( 0.25, 0.5 )
					),
				new Entity()
					.add(
						new Radar()
							.setSize( Coordinates.radar.width, Coordinates.radar.height )
					)
			);
	}

	/**
	 * Set up the radio signal indicator
	 */
	function create_signal_indicator()
	{
		Elements.signal = new Entity()
			.add(
				new Sprite()
					.setXY( Coordinates.signal.x, Coordinates.signal.y )
			)
			.addChild(
				new Entity( 'signal' )
					.add(
						new Sprite( Assets.getImage( 'game/ui/radio/signal-4.png' ) )
							.setXY( 30, 2 )
					),
				new Entity()
					.add(
						new Sprite( Assets.getImage( 'game/ui/radio/base.png' ) )
							.setXY( 10, 16 )
					),
				new Entity()
					.add(
						new SpriteSequence( Assets.getImage( 'game/ui/radio/dish.png' ) )
							.setOptions(
								{
									frames: 8,
									frameWidth: 28,
									frameHeight: 22,
									speed: 100,
									vertical: true
								}
							)
					)
			);
	}

	/**
	 * Set up the drone stats meter group
	 */
	function create_drone_meters()
	{
		var display;

		Elements.drone = new Entity()
			.add(
				new Sprite( Graphics.droneHUD )
					.setXY( Coordinates.drone.HUD.x, Coordinates.drone.HUD.y )
			);

		for ( var indicator in Coordinates.drone.system ) {
			display = Coordinates.drone.system[indicator];

			Elements.drone.addChild(
				new Entity()
					.add(
						new Sprite()
							.setXY( display.x, display.y )
					)
			);
		}

		for ( var meter in Coordinates.drone.meters )
		{
			display = Coordinates.drone.meters[meter];

			Elements.drone.addChild(
				new Entity( meter )
					.add(
						new FillSprite( display.color, display.width, display.height )
							.setXY( display.x, display.y )
					)
			);
		}

		// Charge meter is invisible by default
		Elements.drone.$( 'charge' ).get( FillSprite ).setAlpha( 0 );
	}

	/**
	 * Set up the full HUD structure
	 */
	function generate_HUD_layout()
	{
		create_radar_map();
		create_signal_indicator();
		create_drone_meters();

		frames.every( 3, refresh_radar_noise );

		stage
			.addChild(
				Elements.drone,
				Elements.radar,
				Elements.signal
			)
			.add( frames );
	}

	// ---------------------------------------- //
	// ------------- UPDATE CYCLE ------------- //
	// ---------------------------------------- //

	/**
	 * Cycle through the various radar 'noise'
	 * graphics to produce continuous distortion
	 */
	function refresh_radar_noise()
	{
		if ( ++radar_noise > 4 ) {
			radar_noise = 1;
		}

		Elements.radar.$( 'noise' ).get( Sprite )
			.setSource( Graphics.noise[radar_noise] );
	}

	/**
	 * Update the radio area, refreshing the
	 * local radar and signal strength indicator
	 */
	function refresh_radio()
	{
		var noise = 1 - ( radio_signal / 4 );

		Elements.radar.find( Radar )
			.scan( Data.station )
			.setClarity( 1 - ( noise / 2 ) );

		Elements.radar.$( 'noise' ).get( Flicker )
			.setAlphaRange( noise, noise + 0.1 );

		Elements.signal.child( 0 ).get( Sprite )
			.setSource( Assets.getImage( 'game/ui/radio/signal-' + radio_signal + '.png' ) );
	}

	/**
	 * Update drone system state icons and stat meters
	 */
	function refresh_drone_HUD( dt )
	{
		var system = Data.drone.getSystem();
		var i = 0;

		for ( var indicator in Coordinates.drone.system ) {
			var state = ( system[indicator] ? 'on.png' : 'off.png' );
			var file = 'game/ui/indicators/' + indicator + '-' + state;

			Elements.drone.child( i++ ).get( Sprite )
				.setSource( Assets.getImage( file ) );
		}

		for ( var meter in Coordinates.drone.meters ) {
			var display = Coordinates.drone.meters[meter];
			var depletion = ( system[display.stat] / system['MAX_' + display.stat.toUpperCase()] );
			var width = Math.round( depletion * display.width );

			Elements.drone.child( i++ ).get( FillSprite )
				.setSize( width, display.height )
		}

		if ( charging.on ) {
			charging.timer += dt;

			var flash = ( 1 + Math.sin( charging.speed * charging.timer ) ) / 2;

			Elements.drone.$( 'charge' ).get( FillSprite )
				.setAlpha( flash );
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		refresh_radio();
		refresh_drone_HUD( dt );
	};

	this.onAdded = function()
	{
		generate_HUD_layout();
		update_radar_source();
		_.owner.addChild( stage );
	};

	/**
	 * Save references to important game [objects] so
	 * their HUD data can be updated in real-time
	 */
	this.watch = function( objects )
	{
		for ( var object in objects ) {
			if ( Data.hasOwnProperty( object ) ) {
				Data[object] = objects[object];
			}
		}

		update_radar_source();
		return _;
	};

	/**
	 * Control radar noise level and update signal
	 * indicator via radio signal [strength] (0 - 4)
	 */
	this.updateRadioSignal = function( strength )
	{
		radio_signal = strength;
		return _;
	};

	/**
	 * Fade charge meter in
	 */
	this.showChargeMeter = function()
	{
		charging.on = true;
		charging.timer = 0;
		return _;
	};

	/**
	 * Fade charge meter out
	 */
	this.hideChargeMeter = function()
	{
		charging.on = false;

		Elements.drone.$( 'charge' ).get( Sprite )
			.alpha.tweenTo( 0, 0.5, Ease.quad.out);

		return _;
	};
}