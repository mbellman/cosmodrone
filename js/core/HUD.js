/**
 * An instance of the game's HUD
 */
function HUD(assets)
{
	// Private:
	var _ = this;
	var graphics =
	{
		droneHUD: assets.getImage('ui/drone.png')
	};
	var coordinates =
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
				height: 10
			},
			health:
			{
				x: 56,
				y: 82,
				width: 178,
				height: 10
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
			coordinates.droneHUD.x,
			coordinates.droneHUD.y,
			graphics.droneHUD.width,
			graphics.droneHUD.height
		);
	}

	/**
	 * Draws any one of similar system stat meters
	 */
	function draw_meter(meter, offsetX, offsetY, width, color)
	{
		screen.HUD.draw
			.rectangle(
				offsetX + coordinates.meters[meter].x,
				offsetY + coordinates.meters[meter].y,
				clamp(width, 0, coordinates.meters[meter].width),
				coordinates.meters[meter].height
			)
			.fill(color);
	}

	/**
	 * Redraws the drone HUD on [screen.HUD]
	 */
	function redraw_drone_HUD(system)
	{
		// Power meter
		var power_ratio = system.power / system.MAX_POWER;
		var power_width = Math.round(power_ratio * coordinates.meters.power.width);

		draw_meter('power', coordinates.droneHUD.x, coordinates.droneHUD.y, power_width, '#00e4ff');

		// Health meter
		var health_ratio = system.health / system.MAX_HEALTH;
		var health_width = Math.round(health_ratio * coordinates.meters.health.width);

		draw_meter('health', coordinates.droneHUD.x, coordinates.droneHUD.y, health_width, '#00ff30');

		// Draw the static UI over the meters
		screen.HUD.draw
			.image(
				graphics.droneHUD,
				coordinates.droneHUD.x,
				coordinates.droneHUD.y
			);

		// Draw system state indicators
		var indicators = ['stabilizing', 'docking'];

		for (var i = 0 ; i < indicators.length ; i++)
		{
			var indicator = indicators[i];
			var file = 'ui/indicators/' + indicator + '-' + (system[indicator] ? 'on.png' : 'off.png');

			screen.HUD.draw
				.image(
					assets.getImage(file),
					coordinates.droneHUD.x + coordinates.indicators[indicator].x,
					coordinates.droneHUD.y + coordinates.indicators[indicator].y
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