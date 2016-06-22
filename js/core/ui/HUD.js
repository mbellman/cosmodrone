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
		droneHUD: Assets.getImage( 'game/ui/drone.png' )
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
		radio: {
			x: 72,
			y: Viewport.height - Graphics.droneHUD.height + 95
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
					color: '#00ff30'
				},
				power: {
					x: 56,
					y: 230,
					width: 640,
					height: 18,
					color: '#00b4cc'
				},
				charge: {
					x: 56,
					y: 230,
					width: 640,
					height: 18,
					color: '#fff'
				},
				fuel: {
					x: 56,
					y: 236,
					width: 640,
					height: 6,
					color: '#ccd'
				}
			}
		}
	};

	// Important game objects
	var Data = {
		// Player Drone component
		drone: null,
		// Camera Point component
		camera: null,
		// Space station group entity
		station: null
	};

	// Power charge meter variables
	var charging = {
		on: false,
		timer: 0,
		speed: 15
	};

	// HUD stage
	var stage = new Entity();

	/**
	 * Set up the local radar map entity
	 */
	function create_radar_map()
	{
		Elements.radar = new Entity()
			.add(
				new Sprite()
					.setXY( Coordinates.radar.x, Coordinates.radar.y )
			)
			.add(
				new Radar()
					.setSize( Coordinates.radar.width, Coordinates.radar.height )
			);
	}

	/**
	 * Set up the radio signal indicator entity
	 */
	function create_radio_meter()
	{
		Elements.radio = new Entity()
			.add(
				new Sprite()
					.setXY( Coordinates.radio.x, Coordinates.radio.y )
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
	 * Set up the drone stats meter area entity
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
		create_radio_meter();
		create_drone_meters();

		stage.addChild(
			Elements.drone,
			Elements.radar,
			Elements.radio
		);
	}

	/**
	 * Update the local radar
	 */
	function refresh_radar()
	{
		Elements.radar.get( Radar ).scan(
			Data.station,
			Data.drone.owner.get( Point )
		);
	}

	/**
	 * Update drone system state icons and stat meters
	 */
	function refresh_drone_HUD()
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
			if ( meter === 'charge' ) {
				meter = 'power';
			}

			var display = Coordinates.drone.meters[meter];
			var depletion = ( system[meter] / system['MAX_' + meter.toUpperCase()] );
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
		refresh_radar();
		refresh_drone_HUD();
	};

	this.onAdded = function()
	{
		generate_HUD_layout();
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

		return _;
	};

	/**
	 * Display radio signal [strength], between 0 - 4
	 */
	this.updateRadioSignal = function( strength )
	{
		Elements.radio.$( 'signal' ).get( Sprite )
			.setSource( Assets.getImage( 'game/ui/radio/signal-' + strength + '.png' ) );

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