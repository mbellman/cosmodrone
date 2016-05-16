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
	var specs = {};
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
	}

	this.onOwnerAddedToParent = function()
	{
		update_coordinates();
	}

	this.getOwner = function()
	{
		return owner;
	}

	this.getPosition = function()
	{
		return {
			x: x,
			y: y
		};
	}

	this.getSpecs = function()
	{
		return specs;
	}

	this.setSpecs = function(_specs)
	{
		specs = _specs;
		return _;
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

	// Properties of the drone
	var speed = 3;
	var spin = 0;
	var power = 500;
	var fuel = 350;
	var health = 100;
	var hardware = 100;
	var stabilizing = false;

	// Values/flags for automatic retrograde rotation
	var retrograde = false;
	var retrograde_angle = 180;
	var retrograde_angle_approach = false;
	var retrograde_angle_stop = false;

	// Values/flags for automatic docking
	var docking = false;
	var docking_slowdown = false;
	var docking_target = null;
	var docking_angle = 0;
	var docking_angle_stop = false;
	var docking_distance = {};
	var docking_speed = 15;

	// Flags which determine whether the drone can operate
	var out_of_power = false;
	var out_of_fuel = false;

	// Max values
	var MAX_POWER = 500;
	var MAX_FUEL = 350;
	var MAX_HEALTH = 100;
	var MAX_HARDWARE = 100;

	/**
	 * Returns one of 4 angles depending
	 * on top/right/bottom/left orientation
	 */
	function get_docking_angle(orientation)
	{
		switch (orientation)
		{
			case 'top':
				return 180;
			case 'right':
				return 270;
			case 'bottom':
				return 0;
			case 'left':
				return 90;
			default:
				return 0;
		}
	}

	/**
	 * Return the drone's retrograde angle
	 */
	function get_retrograde_angle()
	{
		var velocity = owner.get(Point).getVelocity();
		return mod(Math.RAD_PI * -1 * Math.atan2(velocity.x, velocity.y), 360);
	}

	/**
	 * Returns +/- depending on the shortest rotation to [angle]
	 */
	function get_rotation_direction(angle)
	{
		var rotation = owner.get(Sprite).rotation;

		var high = Math.max(rotation, angle);
		var low = Math.min(rotation, angle);

		var forward = (360 - high) + low;
		var back = high - low;

		return (
			forward > back ?
				(rotation > angle ? -1 : 1)
			:
				(rotation > angle ? 1 : -1)
		);
	}

	/**
	 * Returns the distance in degrees between two angles
	 */
	function get_rotation_distance(angle1, angle2)
	{
		var high = Math.max(angle1, angle2);
		var low = Math.min(angle1, angle2);

		var d1 = high - low;
		var d2 = (360 - high) + low;

		return Math.min(d1, d2);
	}

	/**
	 * Checks the offset between the drone and
	 * the target docking terminal and returns
	 * repositioning coordinates used to nudge
	 * the drone into alignment for docking
	 */
	function get_alignment_direction()
	{
		var increment =
		{
			x: 0,
			y: 0
		};

		if (docking_angle === 0 || docking_angle === 180)
		{
			// Align along the x-axis
			increment.x = (docking_distance.x > 1 ? -1 : 1);
		}
		else
		{
			// Align along the y-axis
			increment.y = (docking_distance.y > 1 ? -1 : 1);
		}

		return increment;
	}

	/**
	 * Checks and caches the distance between
	 * the player drone and the docking target
	 */
	function track_target_distance()
	{
		var player = owner.get(Point).getPosition();
		var target = docking_target.get(HardwarePart).getPosition();

		docking_distance.x = player.x - target.x;
		docking_distance.y = player.y - target.y;
	}

	/**
	 * Returns a boolean representing the drone's first-
	 * stage x or y alignment with the docking target
	 */
	function is_aligned_with_target()
	{
		if (docking_angle === 0 || docking_angle === 180)
		{
			// Check x-axis alignment
			return (Math.abs(docking_distance.x) < 1);
		}
		else
		{
			// Check y-axis alignment
			return (Math.abs(docking_distance.y) < 1);
		}
	}

	/**
	 * Invoked upon power/fuel loss
	 */
	function system_shutdown()
	{
		stabilizing = false;
		docking = false;
	}

	/**
	 * Triggers docking cycle
	 */
	function launch_docking_procedure(target)
	{
		stabilizing = false;

		// Set docking parameters
		docking = true;
		docking_slowdown = false;
		docking_target = target;
		docking_angle = get_docking_angle(docking_target.get(HardwarePart).getSpecs().orientation);
		docking_angle_stop = false;

		// Set retrograde orientation parameters
		retrograde = true;
		retrograde_angle = get_retrograde_angle();
		retrograde_angle_approach = false;
		retrograde_angle_stop = false;
	}

	/**
	 * Handle docking cycle as it progresses
	 */
	function control_docking_procedure(dt)
	{
		if (retrograde)
		{
			// 1. Set the drone to a retrograde orientation
			spin_retrograde(dt);
		}
		else
		{
			if (docking_slowdown)
			{
				// 2. Slow the drone to a halt
				if (owner.get(Point).getAbsoluteVelocity() > speed)
				{
					_.addVelocity(speed);
					return;
				}

				owner.get(Point).setVelocity(0, 0);
				docking_slowdown = false;
			}
			else
			{
				if (owner.get(Sprite).rotation !== docking_angle)
				{
					// 3. Move into proper docking orientation
					if (docking_angle_stop)
					{
						// Slow down as drone Sprite rotation approaches [docking_angle]
						stabilize_spin();

						if (spin === 0)
						{
							owner.get(Sprite).rotation = docking_angle;
						}

						return;
					}

					// Get rotational "distance" from [docking_angle]
					var distance = get_rotation_distance(owner.get(Sprite).rotation, docking_angle);
					// Determine spin direction of the shortest rotation to [docking_angle]
					var direction = get_rotation_direction(docking_angle);

					// Spin toward [docking_angle]
					if (spin < 100)
					{
						_.addSpin(speed * get_rotation_direction(docking_angle));
					}

					if (distance < (10 * Math.abs(spin) * dt))
					{
						// Rotation is approaching [docking_angle], so trigger slowdown!
						docking_angle_stop = true;
						return;
					}
				}
				else
				{
					// TODO: Improve the docking transition at this step
					// (Verify distance to docking target)
					track_target_distance();

					if (!is_aligned_with_target())
					{
						// 4. Move into proper docking alignment
						var align = get_alignment_direction();

						owner.get(Point).setPosition(
							align.x * docking_speed * dt,
							align.y * docking_speed * dt,
							true
						);
					}
					else
					{
						// 5. TODO: Approach hardware terminal
						docking = false;
					}
				}
			}
		}
	}

	/**
	 * Gradually spins the drone to its retrograde orientation
	 */
	function spin_retrograde(dt)
	{
		var velocity = owner.get(Point).getAbsoluteVelocity();

		if (retrograde_angle_stop || velocity === 0)
		{
			// Slow down spin to arrive at [retrograde_angle] or,
			// if velocity is 0, just to stop the drone's rotation
			stabilize_spin();

			if (spin === 0)
			{
				// Done spinning!
				if (velocity > 0)
				{
					// Lock the drone to the precise [retrograde_angle]
					// if it is moving in preparation for deceleration
					owner.get(Sprite).rotation = retrograde_angle;
				}

				retrograde = false;
				docking_slowdown = true;
			}

			return;
		}

		// Get rotational "distance" from [retrograde_angle]
		var distance = get_rotation_distance(owner.get(Sprite).rotation, retrograde_angle);
		// Determine spin direction of the shortest rotation to [retrograde_angle]
		var direction = get_rotation_direction(retrograde_angle);

		if (retrograde_angle_approach && spin < 100)
		{
			// Rotate drone toward [retrograde_angle]
			_.addSpin(speed * direction);
		}

		// Start spin stabilization if the drone's
		// rotation is close enough to [retrograde_angle]
		// (proportional to its angular velocity).
		// 10 is an arbitrary constant that happens
		// to yield an optimally smooth deceleration
		// when dt reflects a ~60fps refresh rate.
		if (distance < (10 * Math.abs(spin) * dt))
		{
			retrograde_angle_stop = true;
			return;
		}

		// For slower angular velocities...
		if (spin < 75)
		{
			if ((direction < 0 && spin > 0) || (direction > 0 && spin < 0))
			{
				// If we're spinning "away" from [retrograde_angle],
				// slow down and prepare to spin the other way
				stabilize_spin();

				if (spin === 0)
				{
					// Slowed to 0, so start spinning the other way
					retrograde_angle_approach = true;
					return;
				}
			}
			else
			{
				// If we're spinning toward [retrograde_angle], speed up as necessary
				retrograde_angle_approach = true;
			}
		}
	}

	/**
	 * Gradually reduces spin to 0
	 */
	function stabilize_spin()
	{
		stabilizing = true;
		spin *= 0.9;

		if (Math.abs(spin) < 1)
		{
			spin = 0;
			stabilizing = false;
		}
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
		if (stabilizing) power -= dt;
		// Consume additional power during docking
		if (docking) power -= 2*dt;

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
		// Consume additional fuel during docking
		if (docking) fuel -= 2*dt;

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
		// Docking procedure
		if (docking && !out_of_power && !out_of_fuel)
		{
			control_docking_procedure(dt);
		}

		// Regular spin stabilization
		if (stabilizing && !docking && !out_of_power && !out_of_fuel)
		{
			stabilize_spin();
		}

		// Update drone Sprite rotation with new [spin] value
		owner.get(Sprite).rotation += (spin * dt);
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
		return speed;
	}

	this.getSystem = function()
	{
		return {
			velocity: owner.get(Point).getAbsoluteVelocity(),
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

	this.addVelocity = function(amount)
	{
		var rotation = owner.get(Sprite).rotation;
		var x = Math.sin(rotation * Math.PI_RAD);
		var y = Math.cos(rotation * Math.PI_RAD) * -1;

		owner.get(Point).setVelocity(
			x * amount,
			y * amount,
			true
		);

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

	this.dockWith = function(target)
	{
		launch_docking_procedure(target);
		return _;
	}

	this.abortDocking = function()
	{
		docking = false;
		return _;
	}

	this.isControllable = function()
	{
		return (!out_of_power && !out_of_fuel && !docking);
	}

	this.isDocking = function()
	{
		return docking;
	}
}