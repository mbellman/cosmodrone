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

	var GRAPHICS = {
		droneHUD: Assets.getImage( 'game/ui/drone.png' )
	};

	var DRONE_DATA;
	var stage = new Entity();

	var charging = {
		on: false,
		timer: 0,
		speed: 15
	};

	var COORDINATES = {
		radio: {
			x: 72,
			y: Viewport.height - GRAPHICS.droneHUD.height + 95
		},
		drone: {
			HUD: {
				x: 10,
				y: Viewport.height - GRAPHICS.droneHUD.height - 20
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

	var ELEMENTS = {
		radio: null,
		drone: null
	};

	/**
	 * Set up the radio signal indicator
	 */
	function create_radio_meter()
	{
		ELEMENTS.radio = new Entity()
			.add(
				new Sprite()
					.setXY( COORDINATES.radio.x, COORDINATES.radio.y )
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
	 * Set up the drone stats HUD
	 */
	function create_drone_HUD()
	{
		var display;

		ELEMENTS.drone = new Entity()
			.add(
				new Sprite( GRAPHICS.droneHUD )
					.setXY( COORDINATES.drone.HUD.x, COORDINATES.drone.HUD.y )
			);

		for ( var indicator in COORDINATES.drone.system ) {
			display = COORDINATES.drone.system[indicator];

			ELEMENTS.drone.addChild(
				new Entity()
					.add(
						new Sprite()
							.setXY( display.x, display.y )
					)
			);
		}

		for ( var meter in COORDINATES.drone.meters )
		{
			display = COORDINATES.drone.meters[meter];

			ELEMENTS.drone.addChild(
				new Entity( meter )
					.add(
						new FillSprite( display.color, display.width, display.height )
							.setXY( display.x, display.y )
					)
			);
		}

		// Charge meter is invisible by default
		ELEMENTS.drone.$( 'charge' ).get( FillSprite ).setAlpha( 0 );
	}

	/**
	 * Set up the full HUD structure
	 */
	function generate_HUD_layout()
	{
		create_radio_meter();
		create_drone_HUD();

		stage.addChild(
			ELEMENTS.drone,
			ELEMENTS.radio
		);
	}

	// -- Public: --
	this.update = function( dt )
	{
		var system = DRONE_DATA.getSystem();
		var i = 0;

		for ( var indicator in COORDINATES.drone.system ) {
			var state = ( system[indicator] ? 'on.png' : 'off.png' );
			var file = 'game/ui/indicators/' + indicator + '-' + state;

			ELEMENTS.drone.child( i++ ).get( Sprite )
				.setSource( Assets.getImage( file ) );
		}

		for ( var meter in COORDINATES.drone.meters ) {
			if ( meter === 'charge' ) {
				meter = 'power';
			}

			var display = COORDINATES.drone.meters[meter];
			var depletion = ( system[meter] / system['MAX_' + meter.toUpperCase()] );
			var width = Math.round( depletion * display.width );

			ELEMENTS.drone.child( i++ ).get( FillSprite )
				.setSize( width, display.height )
		}

		if ( charging.on ) {
			charging.timer += dt;

			var flash = ( 1 + Math.sin( charging.speed * charging.timer ) ) / 2;

			ELEMENTS.drone.$( 'charge' ).get( FillSprite )
				.setAlpha( flash );
		}
	};

	this.onAdded = function()
	{
		generate_HUD_layout();
		_.owner.addChild( stage );
	};

	/**
	 * Save a reference to the [drone] component instance
	 */
	this.watchDrone = function( drone )
	{
		DRONE_DATA = drone;
		return _;
	};

	/**
	 * Display radio signal [strength], between 0 - 4
	 */
	this.updateRadioSignal = function( strength )
	{
		ELEMENTS.radio.$( 'signal' ).get( Sprite )
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

		ELEMENTS.drone.$( 'charge' ).get( Sprite )
			.alpha.tweenTo( 0, 0.5, Ease.quad.out);

		return _;
	};
}