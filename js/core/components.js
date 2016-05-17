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

	// Real-time drone properties
	var spin = 0;
	var power = 500;
	var fuel = 350;
	var health = 100;
	var hardware = 100;
	var stabilizing = false;

	// Flags for automatic spin maneuvering
	var angle_approach = false;
	var angle_stop = false;

	// Saved value for the angle retrograde to the drone's
	// motion; recalculated via get_retrograde_angle()
	var retrograde_angle = 180;

	// Values/flags for automatic docking
	var docking =
	{
		// Docking state boolean
		on: false,
		// Docking target hardware part
		target: null,
		// Orientation for docking (see: get_docking_angle())
		angle: 0,
		// Coordinate distance to the docking terminal
		distance: {},
		// The docking procedure has seven phases:
		// 1. Spin to [retrograde_angle]
		// 2. Slow drone to 0 velocity
		// 3. Spin parallel to docking terminal
		// 4. After thrusting toward docking alignment position, spin retrograde again
		// 5. Slow drone to 0 velocity at docking alignment position
		// 6. Spin to [docking.angle]
		// 7. Thrust toward docking terminal
		phase: 1
	};

	// Flags which determine whether the drone can operate
	var out_of_power = false;
	var out_of_fuel = false;

	// Drone property limits
	var MAX_SPEED = 3;
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
	 * Returns the angle necessary to approach the docking
	 * alignment position from the drone's current location
	 */
	function get_docking_alignment_angle()
	{
		var direction = get_docking_alignment_direction();

		var dx = (direction.x < 0 ? 270 : 90);
		var dy = (direction.y < 0 ? 0 : 180);

		if (docking.angle === 0 || docking.angle === 180) return dx;
		if (docking.angle === 90 || docking.angle === 270) return dy;
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
	 * Checks the offset between the drone and
	 * the target docking terminal and returns
	 * -/+ for both axes depending on direction
	 */
	function get_docking_alignment_direction()
	{
		var direction =
		{
			x: 0,
			y: 0
		};

		if (docking.angle === 0 || docking.angle === 180)
		{
			// Align along the x-axis
			direction.x = (docking.distance.x > 0 ? -1 : 1);
		}
		else
		{
			// Align along the y-axis
			direction.y = (docking.distance.y > 0 ? -1 : 1);
		}

		return direction;
	}

	/**
	 * Checks and saves the distance between
	 * the player drone and the docking target
	 */
	function track_target_distance()
	{
		var player = owner.get(Point).getPosition();
		var target = docking.target.get(HardwarePart).getPosition();
		var specs = docking.target.get(HardwarePart).getSpecs();

		// Pinpoint the hardware part's docking terminal.
		// (For the top and left terminals we want to
		// negatively offset the stopping point so the
		// drone halts at the proper coordinates)
		var top = (specs.orientation === 'top');
		var left = (specs.orientation === 'left');
		target.x += (specs.x + (left ? -1 : 1) * owner.get(Sprite).getWidth()/2);
		target.y += (specs.y + (top ? -1 : 1) * owner.get(Sprite).getHeight()/2);

		docking.distance.x = player.x - target.x;
		docking.distance.y = player.y - target.y;
	}

	/**
	 * Invoked upon power/fuel loss
	 */
	function system_shutdown()
	{
		stabilizing = false;
		docking.on = false;
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
	 * Resets flags for [spin_to_angle()]
	 */
	function reset_spin_procedure()
	{
		angle_approach = false;
		angle_stop = false;
	}

	/**
	 * Gradually and fluidly spins the drone to [angle]
	 */
	function spin_to_angle(angle, dt)
	{
		consume_fuel(dt);

		if (angle_stop)
		{
			// Slow down spin to arrive at [angle]
			stabilize_spin();

			if (spin === 0)
			{
				// Done spinning!
				owner.get(Sprite).rotation = angle;
			}

			return;
		}

		// Get rotational "distance" from [angle]
		var distance = get_rotation_distance(owner.get(Sprite).rotation, angle);
		// Determine spin direction of the shortest rotation to [angle]
		var direction = get_rotation_direction(angle);

		if (angle_approach && spin < 200)
		{
			// Rotate drone toward [angle] up to a speed limit
			_.addSpin(MAX_SPEED * direction);
		}

		// Start spin stabilization if the drone's
		// rotation is close enough to [angle]
		// (proportional to its angular velocity).
		// 10 is an arbitrary constant that happens
		// to yield an optimally smooth deceleration
		// when dt reflects a ~60fps refresh rate.
		if (distance < (10 * Math.abs(spin) * dt))
		{
			angle_stop = true;
			return;
		}

		// For slower angular velocities...
		if (spin < 75)
		{
			if ((direction < 0 && spin > 0) || (direction > 0 && spin < 0))
			{
				// If we're spinning "away" from [angle],
				// slow down and prepare to spin the other way
				stabilize_spin();

				if (spin === 0)
				{
					// Slowed to 0, so start spinning the other way
					angle_approach = true;
					return;
				}
			}
			else
			{
				// If we're spinning toward [angle], speed up as necessary
				angle_approach = true;
			}
		}
	}

	/**
	 * Triggers docking cycle
	 */
	function launch_docking_procedure(target)
	{
		stabilizing = false;

		// Reset docking parameters
		docking.on = true;
		docking.target = target;
		docking.angle = get_docking_angle(docking.target.get(HardwarePart).getSpecs().orientation);
		docking.phase = 1;

		// Update [retrograde_angle] for docking phase 1
		retrograde_angle = get_retrograde_angle();
		reset_spin_procedure();
	}

	/**
	 * Handle docking cycle as it progresses
	 */
	function control_docking_procedure(dt)
	{
		switch (docking.phase)
		{
			// 1. Spin to [retrograde_angle]
			case 1:
				if (owner.get(Point).getAbsoluteVelocity() === 0)
				{
					// Unnecessary to spin retrograde
					// or slow down if already stopped;
					// advance to docking phase 3
					reset_spin_procedure();
					docking.phase = 3;
					return;
				}

				// Spin retrograde in preparation for slowdown
				spin_to_angle(retrograde_angle, dt);

				if (owner.get(Sprite).rotation === retrograde_angle)
				{
					// [retrograde_angle] reached; advance docking phase
					docking.phase = 2;
				}

				break;
			// 2. Slow drone to 0 velocity
			case 2:
				if (owner.get(Point).getAbsoluteVelocity() > MAX_SPEED)
				{
					_.addVelocity(MAX_SPEED);
					consume_fuel(dt);
					return;
				}

				// Lock drone at 0 velocity
				owner.get(Point).setVelocity(0, 0);
				reset_spin_procedure();
				// Advance docking phase
				docking.phase = 3;
				break;
			// 3. Spin parallel to docking terminal for alignment approach
			case 3:
				// Determine which way the drone needs
				// to face in order to approach alignment
				track_target_distance();
				var angle = get_docking_alignment_angle();

				spin_to_angle(angle, dt);

				if (owner.get(Sprite).rotation === angle)
				{
					// Alignment approach angle reached; give a small forward pulse
					_.addVelocity(4*MAX_SPEED);
					consume_fuel(4*dt);
					// Update [retrograde_angle] for next phase
					retrograde_angle = get_retrograde_angle();
					reset_spin_procedure();
					// Advance docking phase
					docking.phase = 4;
				}

				break;
			// 4. After thrusting toward docking alignment position, spin retrograde again
			case 4:
				spin_to_angle(retrograde_angle, dt);

				if (owner.get(Sprite).rotation === retrograde_angle)
				{
					// [retrograde_angle] reached; advance docking phase
					docking.phase = 5;
				}

				break;
			// 5. Slow drone to 0 velocity at docking alignment position
			case 5:
				// Determine distance to alignment position
				track_target_distance();
				var distance = (docking.angle === 0 || docking.angle === 180) ? docking.distance.x : docking.distance.y;

				if (Math.abs(distance) < 1)
				{
					if (owner.get(Point).getAbsoluteVelocity() > MAX_SPEED)
					{
						// Slow down approach to alignment position
						_.addVelocity(MAX_SPEED);
						consume_fuel(dt);
						return;
					}

					// Stop at alignment position
					owner.get(Point).setVelocity(0, 0);
					reset_spin_procedure();
					// Advance docking phase
					docking.phase = 6;
				}
				else
				{
					if (owner.get(Sprite).rotation === get_docking_alignment_angle() && Math.abs(distance) > 30)
					{
						// Overshot target; reset to phase 2
						docking.phase = 2;
					}
				}

				break;
			// 6. Spin to [docking.angle]
			case 6:
				spin_to_angle(docking.angle, dt);

				if (owner.get(Sprite).rotation === docking.angle)
				{
					// Give a small forward pulse
					_.addVelocity(4*MAX_SPEED);
					consume_fuel(4*dt);
					docking.phase = 7;
				}

				break;
			// 7. Thrust toward docking terminal
			case 7:
				track_target_distance();

				// Continually check approach distance
				if (
					// For top/bottom terminals, check y-axis distance
					((docking.angle === 0 || docking.angle === 180) && Math.abs(docking.distance.y) < 1) ||
					// For left/right terminals, check x-axis distance
					((docking.angle === 90 || docking.angle === 270) && Math.abs(docking.distance.x) < 1)
				)
				{
					// Docked!
					owner.get(Point).setVelocity(0, 0);
					docking.on = false;
				}

				break;
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
		if (docking.on) power -= 3*dt;

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
		if (docking.on && !out_of_power && !out_of_fuel)
		{
			control_docking_procedure(dt);
		}

		// Regular spin stabilization
		if (stabilizing && !docking.on && !out_of_power && !out_of_fuel)
		{
			stabilize_spin();
		}

		// Update drone Sprite rotation with new [spin] value
		owner.get(Sprite).rotation += (spin * dt);
		// Gradually reduce drone energy
		consume_power(dt);
		// Gradually reduce fuel during stabilization
		if (stabilizing)
		{
			consume_fuel(dt);
		}
	}

	this.onAdded = function(entity)
	{
		owner = entity;
	}

	this.getMaxSpeed = function()
	{
		return MAX_SPEED;
	}

	this.getSystem = function()
	{
		return {
			velocity: owner.get(Point).getAbsoluteVelocity(),
			stabilizing: stabilizing,
			docking: docking.on,
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

	this.restoreEnergy = function()
	{
		power = MAX_POWER;
		fuel = MAX_FUEL;
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
		docking.on = false;
		return _;
	}

	this.isControllable = function()
	{
		return (!out_of_power && !out_of_fuel && !docking.on);
	}

	this.isDocking = function()
	{
		return docking.on;
	}
}