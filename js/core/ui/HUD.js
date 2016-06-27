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
		DRONE_PANE: Assets.getImage( 'game/ui/panes/drone.png' ),
		DRONE_PANE_GLOW: Assets.getImage( 'game/ui/panes/drone-glow.png' ),
		DRONE_PANE_SHADOW: Assets.getImage( 'game/ui/panes/drone-shadow.png' ),
		DRONE_HEALTH: Assets.getImage( 'game/ui/health.png' ),
		STATION_PANE: Assets.getImage( 'game/ui/panes/station.png' ),
		STATION_PANE_GLOW: Assets.getImage( 'game/ui/panes/station-glow.png' ),
		NOISE: {
			1: Assets.getImage( 'game/ui/radio/noise-1.png' ),
			2: Assets.getImage( 'game/ui/radio/noise-2.png' ),
			3: Assets.getImage( 'game/ui/radio/noise-3.png' ),
			4: Assets.getImage( 'game/ui/radio/noise-4.png' )
		}
	};

	// HUD element coordinates
	var Coordinates = {
		drone: {
			HUD: {
				x: 0,
				y: Viewport.height - Graphics.DRONE_PANE.height
			},
			system: {
				stabilizing: {x: 575, y: 40},
				docking: {x: 605, y: 45}
			},
			meters: {
				power: {
					x: 102,
					y: 12,
					width: 560,
					height: 24,
					stat: 'power',
					max_stat: 'MAX_POWER',
					color: '#0df'
				},
				charge: {
					x: 102,
					y: 12,
					width: 560,
					height: 24,
					stat: 'power',
					max_stat: 'MAX_POWER',
					color: '#fff'
				},
				fuel: {
					x: 102,
					y: 40,
					width: 560,
					height: 10,
					stat: 'fuel',
					max_stat: 'MAX_FUEL',
					color: '#eee'
				}
			}
		},
		station: {
			HUD: {
				x: Viewport.width - 250,
				y: 75
			},
			radar: {
				x: 16,
				y: 336,
				width: 220,
				height: 150
			},
			signal: {
				x: 18,
				y: 340
			},
		}
	};

	// HUD pane elements
	var Panes = {
		drone: null,
		station: null
	};

	// Entity cache
	var Elements = {
		health: null,
		radar: null,
		signal: null
	};

	// Game objects
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
	var countdown = new Countdown();                  // Countdown for automatic pane reveal
	var radio_signal = 4;                             // Radio signal strength (0 - 4)
	var noise_level = 0;                              // Noise level value, expressed as ( 1 - ( radio_signal / 4 ) )
	var radar_noise = 1;                              // Noise graphic to show for radar (cycles from 1 - 4)
	var timer = 0;                                    // dt counter

	// ------------------------------------------ //
	// ------------- INITIALIZATION ------------- //
	// ------------------------------------------ //

	/**
	 * Set the radar signal source to the player
	 * drone's Sprite coordinates once both exist
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
	 * Set up the drone stats pane
	 */
	function create_drone_pane()
	{
		var display;

		// Shadow + glowing background
		Panes.drone = new Entity()
			.add(
				new Sprite( Graphics.DRONE_PANE_SHADOW )
					.setXY( Coordinates.drone.HUD.x, Coordinates.drone.HUD.y )
			)
			.addChild(
				new Entity()
					.add(
						new Sprite( Graphics.DRONE_PANE_GLOW )
							.setXY( 0, -14 )
					)
					.add(
						new Flicker()
							.setAlphaRange( 0.1, 0.8 )
							.oscillate( 1.5 )
					)
			);

		// Stat meters
		for ( var meter in Coordinates.drone.meters )
		{
			display = Coordinates.drone.meters[meter];

			Panes.drone
				.addChild(
					new Entity( meter )
						.add(
							new FillSprite( display.color, display.width, display.height )
								.setXY( display.x, display.y )
						)
				);
		}

		// System indicator icons
		for ( var indicator in Coordinates.drone.system ) {
			display = Coordinates.drone.system[indicator];

			Panes.drone
				.addChild(
					new Entity()
						.add(
							new Sprite()
								.setXY( display.x, display.y )
						)
				);
		}

		// Glass pane cover
		Panes.drone
			.addChild(
				new Entity()
					.add(
						new Sprite( Graphics.DRONE_PANE )
					)
			);

		// Health meter
		Elements.health = new Entity()
			.add(
				new Sprite()
					.setXY( 20, 68 )
			)
			.addToParent( Panes.drone );

		for ( var i = 0 ; i < 28 ; i++ ) {
			Elements.health
				.addChild(
					new Entity()
						.add(
							new Sprite( Graphics.DRONE_HEALTH )
								.setXY( i * 20, 0 )
								.centerOrigin()
						)
				);
		}

		// Set charge meter to invisible by default
		Panes.drone.$( 'charge' ).get( FillSprite ).setAlpha( 0 );
	}

	/**
	 * Set up the local radar map
	 */
	function create_radar_map()
	{
		Elements.radar = new Entity()
			.add(
				new Sprite()
					.setXY( Coordinates.station.radar.x, Coordinates.station.radar.y )
			)
			.addChild(
				new Entity( 'noise' )
					.add(
						new Sprite( Graphics.NOISE[1] )
							.setAlpha( 0 )
					)
					.add(
						new Flicker()
							.setTimeRange( 0.25, 0.5 )
					),
				new Entity()
					.add(
						new Radar()
							.setSize( Coordinates.station.radar.width, Coordinates.station.radar.height )
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
					.setXY( Coordinates.station.signal.x, Coordinates.station.signal.y )
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
	 * Set up the station information pane, detailing
	 * the radar map, hardware list, and additional info
	 */
	function create_station_pane()
	{
		create_radar_map();
		create_signal_indicator();

		Panes.station = new Entity()
			.add(
				new Sprite()
					.setXY( Coordinates.station.HUD.x, Coordinates.station.HUD.y )
			)
			.addChild(
				new Entity()
					.add(
						new Sprite( Graphics.STATION_PANE_GLOW )
							.setXY( -16, -16 )
					)
					.add(
						new Flicker()
							.setAlphaRange( 0.1, 0.25 )
							.oscillate( 1.5 )
					),
				new Entity()
					.add(
						new Sprite( Graphics.STATION_PANE)
					),
				Elements.radar,
				Elements.signal
			);
	}

	/**
	 * Set up the full HUD structure
	 */
	function generate_HUD_layout()
	{
		create_drone_pane();
		create_station_pane();

		frames.every( 3, update_radar_noise );

		stage
			.addChild( Panes.drone, Panes.station )
			.add( frames )
			.add( countdown );
	}

	// ---------------------------------------- //
	// ------------- UPDATE CYCLE ------------- //
	// ---------------------------------------- //

	/**
	 * Cycle through the various radar 'noise'
	 * graphics to produce continuous disruption
	 */
	function update_radar_noise()
	{
		if ( ++radar_noise > 4 ) {
			radar_noise = 1;
		}

		// TODO: Use a SpriteSequence
		Elements.radar.$( 'noise' ).get( Sprite )
			.setSource( Graphics.NOISE[radar_noise] );
	}

	/**
	 * Update drone pane area
	 */
	function refresh_drone_pane( dt )
	{
		var system = Data.drone.getSystem();
		var i = 1;

		// Stat meters
		for ( var meter in Coordinates.drone.meters ) {
			var display = Coordinates.drone.meters[meter];
			var depletion = ( system[display.stat] / system[display.max_stat] );
			var width = Math.round( depletion * display.width );

			Panes.drone.child( i++ ).get( FillSprite )
				.setSize( width, display.height )
		}

		// System indicators
		for ( var indicator in Coordinates.drone.system ) {
			var state = ( system[indicator] ? 'on.png' : 'off.png' );
			var file = 'game/ui/indicators/' + indicator + '-' + state;

			// TODO: Use a SpriteSequence
			Panes.drone.child( i++ ).get( Sprite )
				.setSource( Assets.getImage( file ) );
		}

		// Health meter
		for ( var i = 0 ; i < 28 ; i++ ) {
			var health_orb = Elements.health.child( i );

			if ( health_orb.name !== 'off' ) {
				health_orb.get( Sprite ).alpha._ = 0.66 + Math.wave( 7 * timer - i ) / 3;
			}
		}

		// Power charging effect
		if ( charging.on ) {
			charging.timer += dt;

			var flash = Math.wave( charging.speed * charging.timer );

			Panes.drone.$( 'charge' ).get( FillSprite )
				.setAlpha( flash );
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		timer += dt;

		Elements.radar.find( Radar ).scan( Data.station );
		refresh_drone_pane( dt );
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
		noise_level = 1 - ( radio_signal / 4 );

		Elements.radar.find( Radar )
			.setClarity( 1 - ( noise_level / 2 ) );

		Elements.radar.$( 'noise' ).get( Flicker )
			.setAlphaRange( noise_level, noise_level + 0.1 );

		// TODO: Use a SpriteSequence
		Elements.signal.child( 0 ).get( Sprite )
			.setSource( Assets.getImage( 'game/ui/radio/signal-' + radio_signal + '.png' ) );

		return _;
	};

	/**
	 * Reveal the full drone pane
	 */
	this.showDronePane = function()
	{
		Panes.drone.get( Sprite )
			.y.tweenTo(
				Viewport.height - Graphics.DRONE_PANE.height,
				1.0,
				Ease.quad.inOut
			);

		return _;
	};

	/**
	 * Cause the drone pane to swivel down and
	 * become partially hidden. After a delay
	 * the pane will swivel back up again.
	 */
	this.hideDronePane = function()
	{
		if ( !Panes.drone.get( Sprite ).y.isTweening() ) {
			Panes.drone.get( Sprite ).y.tweenTo(
				Viewport.height - 85,
				0.5,
				Ease.quad.inOut
			);
		}

		countdown.wait( 5 ).fire( _.showDronePane );
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

		Panes.drone.$( 'charge' ).get( Sprite )
			.alpha.tweenTo( 0, 0.5, Ease.quad.out);

		return _;
	};
}