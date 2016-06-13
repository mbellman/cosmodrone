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

	var DRONE_DATA;
	var stage = new Entity();
	var drone_HUD;
	var charge_meter;

	var charging = {
		on: false,
		timer: 0,
		speed: 8
	};
	var GRAPHICS = {
		droneHUD: Assets.getImage( 'game/ui/drone.png' )
	};
	var UI = {
		droneHUD: {
			x: 10,
			y: Viewport.height - GRAPHICS.droneHUD.height - 20
		},
		drone_system: {
			stabilizing: {x: 50, y: -4},
			docking: {x: 80, y: 1}
		},
		drone_meters: {
			health: {
				x: 56,
				y: 52,
				width: 232,
				height: 10,
				color: '#00ff30'
			},
			power: {
				x: 56,
				y: 70,
				width: 640,
				height: 18,
				color: '#00b4cc'
			},
			fuel: {
				x: 56,
				y: 76,
				width: 640,
				height: 6,
				color: '#ccd'
			}
		}
	};

	/**
	 * Redraws drone system information
	 * to the [drone_HUD] RasterSprite
	 */
	function redraw_drone_HUD()
	{
		var system = DRONE_DATA.getSystem();

		drone_HUD.sprite
			.clear()
			.draw.image( GRAPHICS.droneHUD );

		for ( var indicator in UI.drone_system )
		{
			var state = ( system[indicator] ? 'on.png' : 'off.png' );
			var file = 'game/ui/indicators/' + indicator + '-' + state;

			drone_HUD.sprite
				.draw.image(
					Assets.getImage( file ),
					UI.drone_system[indicator].x,
					UI.drone_system[indicator].y
				);
		}

		for ( var meter in UI.drone_meters )
		{
			var draw = UI.drone_meters[meter];
			var depletion = ( system[meter] / system['MAX_' + meter.toUpperCase()] );
			var width = Math.round( depletion * draw.width );

			drone_HUD.sprite
				.draw.rectangle( draw.x, draw.y, width, draw.height )
				.fill( draw.color );
		}
	}

	/**
	 * Sets up the drone charging meter
	 */
	function create_charge_meter()
	{
		charge_meter = new Entity()
			.add(
				new Sprite()
					.setXY(
						62 + UI.droneHUD.x,
						UI.droneHUD.y + GRAPHICS.droneHUD.height - 2
					)
					.setAlpha( 0 )
			);

		for ( var i = 0 ; i < 35 ; i++ ) {
			charge_meter.addChild(
				new Entity()
					.add(
						new Sprite( Assets.getImage( 'game/ui/charge.png' ) )
							.setXY( i * 18, 0 )
					)
			);
		}
	}

	/**
	 * Set up the HUD structure
	 */
	function generate_HUD_layout()
	{
		drone_HUD = new RasterSprite()
			.setXY(
				UI.droneHUD.x,
				UI.droneHUD.y
			);

		drone_HUD.sprite.setSize(
				GRAPHICS.droneHUD.width,
				GRAPHICS.droneHUD.height
			);

		create_charge_meter();

		stage.addChild(
			new Entity().add( drone_HUD ),
			charge_meter
		);
	}

	// -- Public: --
	this.update = function( dt )
	{
		redraw_drone_HUD();

		if ( charging.on ) {
			charging.timer += dt;

			for ( var i = 0 ; i < 35 ; i++ ) {
				var modifier = 3 * Math.PI * ( ( 35 - i ) / 35 );
				var alpha = clamp( Math.sin( charging.speed * charging.timer + modifier ), 0, 1 );

				charge_meter.child( i ).get( Sprite ).alpha._ = alpha;
			}
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
	 * Fade charge meter in
	 */
	this.showChargeMeter = function()
	{
		charging.on = true;
		charging.timer = 0;
		charge_meter.get( Sprite ).alpha.tweenTo( 1, 0.75, Ease.quad.out );
		return _;
	};

	/**
	 * Fade charge meter out
	 */
	this.hideChargeMeter = function()
	{
		charge_meter.get( Sprite ).alpha.tweenTo( 0, 0.75, Ease.quad.out, function() {
			charging.on = false;
		} );
		return _;
	};
}