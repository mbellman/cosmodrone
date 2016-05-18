/**
 * An instance of the game's HUD
 */
function HUD(assets)
{
	// Private:
	var _ = this;
	var graphics =
	{
		droneHUD: assets.getImage('game/ui/drone.png')
	};
	var UI =
	{
		droneHUD:
		{
			x: 10,
			y: viewport.height - 10 - graphics.droneHUD.height
		},
		meters:
		{
			power:
			{
				x: 56,
				y: 58,
				width: 178,
				height: 10,
				color: '#00e4ff'
			},
			fuel:
			{
				x: 56,
				y: 61,
				width: 178,
				height: 4,
				color: '#eed800'
			},
			health:
			{
				x: 56,
				y: 82,
				width: 178,
				height: 10,
				color: '#00ff30'
			},
			hardware:
			{
				x: 56,
				y: 85,
				width: 178,
				height: 4,
				color: '#3d584c'
			}
		},
		indicators:
		{
			stabilizing: {x: 50, y: -4},
			docking: {x: 80, y: 1}
		}
	};

	/**
	 * Clears [screen.HUD] where the HUD displayed
	 */
	function clear_HUD()
	{
		// Clear drone HUD
		screen.HUD.clear(
			UI.droneHUD.x,
			UI.droneHUD.y,
			graphics.droneHUD.width,
			graphics.droneHUD.height
		);
	}

	/**
	 * Draws a stat meter from a specific offset
	 */
	function draw_meter(meter, offsetX, offsetY, width)
	{
		screen.HUD.draw
			.rectangle(
				offsetX + UI.meters[meter].x,
				offsetY + UI.meters[meter].y,
				clamp(width, 0, UI.meters[meter].width),
				UI.meters[meter].height
			)
			.fill(UI.meters[meter].color);
	}

	/**
	 * Redraws the drone HUD on [screen.HUD]
	 */
	function redraw_drone_HUD(system)
	{
		// Draw drone stat meters
		var meters = ['power', 'fuel', 'health', 'hardware'];
		var meter, ratio, width;

		for (var m = 0 ; m < meters.length ; m++)
		{
			meter = meters[m];
			ratio = system[meter] / system['MAX_' + meter.toUpperCase()];
			width = Math.round(ratio * UI.meters[meter].width);

			draw_meter(meter, UI.droneHUD.x, UI.droneHUD.y, width);
		}

		// Draw the static UI over the meters
		screen.HUD.draw
			.image(
				graphics.droneHUD,
				UI.droneHUD.x,
				UI.droneHUD.y
			);

		// Draw system indicators
		var indicators = ['stabilizing', 'docking'];

		for (var i = 0 ; i < indicators.length ; i++)
		{
			// Get indicator name
			var indicator = indicators[i];
			// Get correct indicator graphic for on/off state
			var file = 'game/ui/indicators/' + indicator + '-' + (system[indicator] ? 'on.png' : 'off.png');

			screen.HUD.draw
				.image(
					assets.getImage(file),
					UI.droneHUD.x + UI.indicators[indicator].x,
					UI.droneHUD.y + UI.indicators[indicator].y
				);
		}
	}

	// Public:
	this.clear = function()
	{
		clear_HUD();
	}

	this.updateDroneStats = function(drone)
	{
		redraw_drone_HUD(drone.getSystem());
	}
}