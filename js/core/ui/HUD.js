/**
 * ----------
 * Class: HUD
 * ----------
 *
 * An instance of the game's HUD interface
 */
function HUD()
{
	// -- Private: --
	var _ = this;
	var GRAPHICS = {
		droneHUD: Assets.getImage( 'game/ui/drone.png' )
	};
	var UI = {
		droneHUD: {
			x: 10,
			y: Viewport.height - 10 - GRAPHICS.droneHUD.height
		},
		meters: {
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
		},
		indicators: {
			stabilizing: {x: 50, y: -4},
			docking: {x: 80, y: 1}
		}
	};

	/**
	 * Clears [screen.HUD] where the HUD is displayed
	 */
	function clear_HUD()
	{
		// Clear drone HUD
		screen.HUD.clear(
			UI.droneHUD.x,
			UI.droneHUD.y,
			GRAPHICS.droneHUD.width,
			GRAPHICS.droneHUD.height
		);

		// TODO: Remaining clear operations
	}

	/**
	 * Draws a stat meter from a specific offset
	 */
	function draw_meter( meter, offsetX, offsetY, width )
	{
		screen.HUD.draw
			.rectangle(
				offsetX + UI.meters[meter].x,
				offsetY + UI.meters[meter].y,
				clamp( width, 0, UI.meters[meter].width ),
				UI.meters[meter].height
			)
			.fill( UI.meters[meter].color );
	}

	/**
	 * Redraws the drone HUD on [screen.HUD]
	 */
	function redraw_drone_HUD( system )
	{
		// Draw drone stat meters
		var meters = ['power', 'fuel', 'health'];
		var meter, ratio, width;

		for ( var m = 0 ; m < meters.length ; m++ )
		{
			meter = meters[m];
			ratio = system[meter] / system['MAX_' + meter.toUpperCase()];
			width = Math.round( ratio * UI.meters[meter].width );

			draw_meter( meter, UI.droneHUD.x, UI.droneHUD.y, width );
		}

		// Draw the static frame over the meters
		screen.HUD.draw.image( GRAPHICS.droneHUD, UI.droneHUD.x, UI.droneHUD.y );

		// Draw system indicators
		var indicators = ['stabilizing', 'docking'];

		for ( var i = 0 ; i < indicators.length ; i++ )
		{
			// Get indicator name
			var indicator = indicators[i];
			// Get correct indicator graphic for on/off state
			var file = 'game/ui/indicators/' + indicator + '-' + (system[indicator] ? 'on.png' : 'off.png');

			screen.HUD.draw.image(
				Assets.getImage( file ),
				UI.droneHUD.x + UI.indicators[indicator].x,
				UI.droneHUD.y + UI.indicators[indicator].y
			);
		}
	}

	// -- Public: --
	/**
	 * Erase everything for next render cycle
	 */
	this.clear = function()
	{
		clear_HUD();
	};

	/**
	 * Rerender drone stats to HUD
	 */
	this.updateDroneStats = function( drone )
	{
		redraw_drone_HUD( drone.getSystem() );
	};
}