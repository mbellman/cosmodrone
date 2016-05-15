/**
 * A sprite to be rendered onto [screen.game]
 */
function Sprite(source)
{
	// Private:
	var _ = this;
	var owner = null;
	var parent_offset = {x: 0, y: 0};      // The offset of the owner's parent entity Sprite (updated internally)
	var offset = {x: 0, y: 0};             // A persistent offset as specified via Sprite.offset(x, y)
	var origin = {x: 0, y: 0};             // Origin point of the Sprite
	var render = {x: 0, y: 0};             // On-screen coordinates of the Sprite (updated internally)
	var pivot;                             // Target Point for movement pivoting (motion opposite to)

	/**
	 * Update the internal on-screen position of the sprite
	 */
	function update_screen_coordinates()
	{
		// Update info on owner's parent entity Sprite offset
		if (owner.parent !== null && owner.parent.has(Sprite))
		{
			parent_offset = owner.parent.get(Sprite).getScreenCoordinates();
		}

		// Update screen coordinates
		render.x = _.x - (!!pivot ? pivot.getPosition().x : 0) + parent_offset.x + offset.x - origin.x;
		render.y = _.y - (!!pivot ? pivot.getPosition().y : 0) + parent_offset.y + offset.y - origin.y;

		if (_.snap)
		{
			render.x = Math.floor(render.x);
			render.y = Math.floor(render.y);
		}
	}

	/**
	 * Sets globalAlpha of [screen.game]
	 */
	function apply_alpha()
	{
		if (_.alpha < 1)
		{
			screen.game.alpha(_.alpha);
		}
	}

	/**
	 * Prepares [screen.game] for rendering rotated Sprite
	 */
	function apply_rotation()
	{
		_.rotation = mod(_.rotation, 360);

		if (_.rotation > 0)
		{
			screen.game
				.translate(render.x + origin.x, render.y + origin.y)
				.rotate(_.rotation * Math.PI_RAD);
		}
	}

	/**
	 * Determines whether or not effects are used
	 */
	function has_effects()
	{
		return (_.alpha < 1 || _.rotation != 0);
	}

	// Public:
	this.x = 0;
	this.y = 0;
	this.scale = 1;
	this.rotation = 0;
	this.alpha = 1;
	this.snap = false;

	this.update = function(dt)
	{
		update_screen_coordinates();

		// Avoid drawing offscreen objects
		if (render.x > viewport.width || render.x + source.width < 0) return;
		if (render.y > viewport.height || render.y + source.height < 0) return;

		if (has_effects()) screen.game.save();

		apply_alpha();
		apply_rotation();

		screen.game.draw.image(
			source,
			(_.rotation > 0 ? -origin.x : render.x),
			(_.rotation > 0 ? -origin.y : render.y),
			source.width * _.scale,
			source.height * _.scale
		);

		if (has_effects()) screen.game.restore();
	}

	this.onAdded = function(entity)
	{
		owner = entity;

		if (!(source instanceof Image))
		{
			console.warn('Sprite: ' + source + ' is not an Image object');
		}
	}

	this.getScreenCoordinates = function()
	{
		return render;
	}

	this.getWidth = function()
	{
		return source.width;
	}

	this.getHeight = function()
	{
		return source.height;
	}

	this.setXY = function(x, y)
	{
		_.x = x;
		_.y = y;
		return _;
	}

	this.setOrigin = function(x, y)
	{
		origin.x = x;
		origin.y = y;
		return _;
	}

	this.setAlpha = function(alpha)
	{
		_.alpha = alpha;
		return _;
	}

	this.setRotation = function(rotation)
	{
		_.rotation = mod(rotation, 360);
		return _;
	}

	this.centerOrigin = function()
	{
		_.setOrigin(source.width/2, source.height/2);
		return _;
	}

	this.pivot = function(_pivot)
	{
		pivot = _pivot;
		return _;
	}

	this.offset = function(x, y)
	{
		offset.x = x;
		offset.y = y;
		return _;
	}
}

/**
 * A static or moving [x, y] coordinate
 */
function Point()
{
	// Private:
	var _ = this;
	var owner = null;
	var position = new Vec2();
	var velocity = new Vec2();

	/**
	 * If the owner entity has a Sprite component,
	 * internally update its [x, y] coordinates
	 */
	function update_sprite()
	{
		if (owner !== null)
		{
			if (owner.has(Sprite))
			{
				owner.get(Sprite).setXY(position.x, position.y);
			}
		}
	}

	// Public:
	this.update = function(dt)
	{
		position.add(velocity, dt);
		update_sprite();
	}

	this.onAdded = function(entity)
	{
		owner = entity;
	}

	this.getPosition = function(round)
	{
		return {
			x: (!!round ? Math.floor(position.x) : position.x),
			y: (!!round ? Math.floor(position.y) : position.y)
		};
	}

	this.getVelocity = function()
	{
		return {
			x: velocity.x,
			y: velocity.y
		};
	}

	this.getAbsoluteVelocity = function()
	{
		return velocity.magnitude();
	}

	this.setPosition = function(x, y, is_modifier)
	{
		position.x = (is_modifier ? position.x + x : x);
		position.y = (is_modifier ? position.y + y : y);

		update_sprite();

		return _;
	}

	this.setVelocity = function(x, y, is_modifier)
	{
		velocity.x = (is_modifier ? velocity.x + x : x);
		velocity.y = (is_modifier ? velocity.y + y : y);
		return _;
	}
}

/**
 * A dockable hardware part unit fixed to space station modules
 */
function HardwarePart()
{
	// Private:
	var _ = this;
	var owner = null;
	var x = 0;
	var y = 0;
	var moving = false;

	/**
	 * Updates the internal x and y position values
	 * for this hardware part to maintain them within
	 * the coordinate system of the player Drone
	 */
	function update_coordinates()
	{
		if (owner !== null && owner.parent !== null)
		{
			if (owner.parent.has(Point) && owner.has(Sprite))
			{
				// Get position of the parent station module
				var position = owner.parent.get(Point).getPosition();

				// Get base [x, y] coordinates of the
				// owner Sprite in local (module) space
				var sprite = owner.get(Sprite);

				// Set the part coordinates as a sum of the two
				x = sprite.x + position.x;
				y = sprite.y + position.y;
			}
		}
	}

	// Public:
	this.update = function(dt)
	{
		if (moving) update_coordinates();
	}

	this.onAdded = function(entity)
	{
		owner = entity;
		update_coordinates();
	}

	this.getPosition = function()
	{
		return {
			x: x,
			y: y
		};
	}

	this.moving = function(boolean)
	{
		moving = boolean;
		return _;
	}
}

/**
 * The player drone
 */
function Drone()
{
	// Private:
	var _ = this;
	var owner = null;
	var spin = 0;
	var power = 500;
	var fuel = 350;
	var health = 100;
	var hardware = 100;
	var stabilizing = false;
	var docking = false;

	var out_of_power = false;
	var out_of_fuel = false;

	var MAX_POWER = 500;
	var MAX_FUEL = 350;
	var MAX_HEALTH = 100;
	var MAX_HARDWARE = 100;

	/**
	 * Invoked upon power/fuel loss
	 */
	function system_shutdown()
	{
		stabilizing = false;
		docking = false;
	}

	/**
	 * Internal power consumption cycle
	 */
	function consume_power(dt)
	{
		if (out_of_power) return;

		// Idle power consumption
		power -= dt;

		// Consume more power during stabilization
		if (stabilizing) power -= 2*dt;
		// Consume additional power during docking
		if (docking) power -= 3*dt;

		if (power < 0)
		{
			power = 0;
			out_of_power = true;

			system_shutdown();

			// TODO: Custom out-of-power event callback
		}
	}

	/**
	 * Fuel consumption (occurs only when maneuvering)
	 */
	function consume_fuel(dt)
	{
		if (out_of_fuel) return;

		fuel -= dt;

		// Consume fuel during stabilization
		if (stabilizing) fuel -= 2*dt;
		// Consume a little fuel during docking
		if (docking) fuel -= (dt / 2);

		if (fuel < 0)
		{
			fuel = 0;
			out_of_fuel = true;

			system_shutdown();

			// TODO: Custom out-of-fuel event callback
		}
	}

	// Public:
	this.update = function(dt)
	{
		// Spin stabilization
		if (stabilizing && !out_of_power && !out_of_fuel)
		{
			spin *= 0.9;

			if (Math.abs(spin) < 1)
			{
				spin = 0;
				stabilizing = false;
			}
		}

		if (owner !== null)
		{
			// Update drone Sprite rotation with new [spin] value
			owner.get(Sprite).rotation += (spin * dt);
		}

		// Gradually reduce drone energy
		consume_power(dt);
		// Gradually reduce fuel during maneuvers
		if (stabilizing || docking)
		{
			consume_fuel(dt);
		}
	}

	this.onAdded = function(entity)
	{
		owner = entity;
	}

	this.getSpeed = function()
	{
		return 3;
	}

	this.getSystem = function()
	{
		return {
			stabilizing: stabilizing,
			docking: docking,
			power: power,
			fuel: fuel,
			health: health,
			hardware: hardware,
			MAX_POWER: MAX_POWER,
			MAX_FUEL: MAX_FUEL,
			MAX_HEALTH: MAX_HEALTH,
			MAX_HARDWARE: MAX_HARDWARE
		};
	}

	this.consumeFuel = function(dt)
	{
		consume_fuel(dt);
		return _;
	}

	this.addSpin = function(amount)
	{
		// Update spin
		spin += amount;
		// Automatically turn off stabilization
		stabilizing = false;
		return _;
	}

	this.stabilize = function()
	{
		if (!out_of_power && !out_of_fuel)
		{
			stabilizing = true;
		}

		return _;
	}

	this.isControllable = function()
	{
		return (!out_of_power && !out_of_fuel && !docking);
	}
}