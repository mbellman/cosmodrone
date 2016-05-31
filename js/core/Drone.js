/**
 * ----------------
 * Component: Drone
 * ----------------
 *
 * The player drone instance
 */
function Drone()
{
	Component.call( this );

	// -- Private: --
	var _ = this;

	// Real-time drone properties
	var spin = 0;
	var power = 500;
	var fuel = 350;
	var health = 100;
	var hardware = 100;
	var stabilizing = false;

	// Flags for automatic spin maneuvering
	var angle_approach = false;
	var angle_slow = false;

	// Saved value for the angle retrograde to the drone's
	// motion; recalculated via update_retrograde_angle()
	var retrograde_angle = 180;

	// Values/flags for automatic docking
	var docking = {
		// Docking state boolean
		on: false,
		// Docking target hardware part
		target: null,
		// Orientation for docking (see: get_docking_angle())
		angle: 0,
		// Coordinate distance to the docking terminal
		distance: {},
		// Docking procedure phase (see: control_docking_procedure())
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
	function get_docking_angle( orientation )
	{
		switch ( orientation ) {
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

		var ax = ( direction.x < 0 ? 270 : 90 );
		var ay = ( direction.y < 0 ? 0 : 180 );

		if ( docking.angle === 0 || docking.angle === 180 ) return ax;
		if ( docking.angle === 90 || docking.angle === 270 ) return ay;
	}

	/**
	 * Update the drone's saved [retrograde_angle]
	 */
	function update_retrograde_angle()
	{
		var velocity = _.owner.get( Point ).getVelocity();
		retrograde_angle =  mod( Math.RAD_PI * -1 * Math.atan2( velocity.x, velocity.y ), 360 );
	}

	/**
	 * Returns the distance in degrees between two angles
	 */
	function get_rotation_distance( angle1, angle2 )
	{
		var high = Math.max( angle1, angle2 );
		var low = Math.min( angle1, angle2 );

		var d1 = high - low;
		var d2 = ( 360 - high ) + low;

		return Math.min( d1, d2 );
	}

	/**
	 * Returns +/- depending on the shortest rotation to [angle]
	 */
	function get_rotation_direction( angle )
	{
		var rotation = _.owner.get( Sprite ).rotation._;

		var high = Math.max( rotation, angle );
		var low = Math.min( rotation, angle );

		var forward = ( 360 - high ) + low;
		var back = high - low;

		return (
			forward > back ?
				( rotation > angle ? -1 : 1 )
			:
				( rotation > angle ? 1 : -1 )
		);
	}

	/**
	 * Checks the offset between the drone and
	 * the target docking terminal and returns
	 * -/+ for both axes depending on direction
	 */
	function get_docking_alignment_direction()
	{
		var direction = {
			x: 0,
			y: 0
		};

		if ( docking.angle === 0 || docking.angle === 180 ) {
			// Align along the x-axis
			direction.x = ( docking.distance.x > 0 ? -1 : 1 );
		} else {
			// Align along the y-axis
			direction.y = ( docking.distance.y > 0 ? -1 : 1 );
		}

		return direction;
	}

	/**
	 * Checks and saves the distance between
	 * the player drone and the docking terminal
	 * (expressed in the coordinates the drone
	 * must be at to have successfully docked)
	 */
	function track_target_distance()
	{
		var player = _.owner.get( Point ).getPosition();
		var target = docking.target.get( HardwarePart ).getPosition();
		var specs = docking.target.get( HardwarePart ).getSpecs();

		var top = ( specs.orientation === 'top' );
		var left = ( specs.orientation === 'left' );

		target.x += ( specs.x + ( left ? -1 : 1 ) * _.owner.get( Sprite ).width() / 2 );
		target.y += ( specs.y + ( top ? -1 : 1 ) * _.owner.get( Sprite ).height() / 2 );

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

		if ( Math.abs( spin ) < 1 ) {
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
		angle_slow = false;
	}

	/**
	 * Gradually and fluidly spins the drone to [angle]
	 */
	function spin_to_angle( angle, dt )
	{
		consume_fuel( dt );

		var distance = get_rotation_distance( _.owner.get( Sprite ).rotation._, angle );
		var direction = get_rotation_direction( angle );

		if ( angle_slow ) {
			// Reduce angular velocity
			stabilize_spin();

			if ( spin === 0 || distance < 1 )
			{
				spin = 0;
				stabilizing = false;
				_.owner.get( Sprite ).rotation._ = angle;
			}

			return;
		}

		if ( angle_approach && Math.abs( spin ) < 200 ) {
			// Accelerate toward [angle]
			_.addSpin( MAX_SPEED * direction );
		}

		if ( distance < ( 10 * Math.abs( spin ) * dt ) ) {
			// Getting close to [angle], so start slowing down
			angle_slow = true;
			return;
		}

		// For slower angular velocities...
		if ( spin < 75 ) {
			if ( ( direction < 0 && spin > 0 ) || ( direction > 0 && spin < 0 ) ) {
				// ...if we're spinning "away" from [angle],
				// slow down and prepare to spin the other way...
				stabilize_spin();

				if ( spin === 0 ) {
					angle_approach = true;
					return;
				}
			} else {
				// ...otherwise, speed up for [angle] approach
				angle_approach = true;
			}
		}
	}

	/**
	 * Triggers docking cycle
	 */
	function launch_docking_procedure( target )
	{
		stabilizing = false;

		docking.on = true;
		docking.target = target;
		docking.angle = get_docking_angle( docking.target.get( HardwarePart ).getSpecs().orientation );
		docking.phase = 1;

		// Update [retrograde_angle] for docking phase 1
		update_retrograde_angle();
		reset_spin_procedure();
	}

	/**
	 * Handle docking cycle as it progresses.
	 *
	 * Docking phases:
	 *
	 *  1. Spin to [retrograde_angle]
	 *  2. Slow drone to 0 velocity
	 *  3. Spin parallel to docking terminal
	 *  4. After thrusting toward docking alignment position, spin retrograde again
	 *  5. Slow drone to 0 velocity at docking alignment position
	 *  6. Spin to [docking.angle]
	 *  7. Thrust toward docking terminal
	 *
	 */
	function control_docking_procedure( dt )
	{
		switch ( docking.phase ) {

			// 1. Spin to [retrograde_angle]
			case 1:
				if ( _.owner.get( Point ).getAbsoluteVelocity() === 0 ) {
					// Already stopped; advance to docking phase 3
					reset_spin_procedure();
					docking.phase = 3;
					return;
				}

				spin_to_angle( retrograde_angle, dt );

				if ( _.owner.get( Sprite ).rotation._ === retrograde_angle ) {
					docking.phase = 2;
				}

				break;

			// 2. Slow drone to 0 velocity
			case 2:
				if ( _.owner.get( Point ).getAbsoluteVelocity() > MAX_SPEED ) {
					// Fire thrusters retrograde
					_.addVelocity( MAX_SPEED );
					consume_fuel( dt );
					return;
				}

				_.owner.get( Point ).setVelocity( 0, 0 );
				reset_spin_procedure();
				docking.phase = 3;
				break;

			// 3. Spin parallel to docking terminal for alignment approach
			case 3:
				track_target_distance();

				var angle = get_docking_alignment_angle();
				spin_to_angle( angle, dt );

				if ( _.owner.get( Sprite ).rotation._ === angle ) {
					// Alignment approach angle reached; give a small forward pulse
					_.addVelocity( 4 * MAX_SPEED );
					consume_fuel( 4 * dt );

					// Update [retrograde_angle] for next phase
					update_retrograde_angle();
					reset_spin_procedure();
					docking.phase = 4;
				}

				break;

			// 4. After thrusting toward docking alignment position, spin retrograde again
			case 4:
				spin_to_angle( retrograde_angle, dt );

				if ( _.owner.get( Sprite ).rotation._ === retrograde_angle ) {
					docking.phase = 5;
				}

				break;

			// 5. Slow drone to 0 velocity at docking alignment position
			case 5:
				track_target_distance();

				// Only use distance along the relevant axis
				var distance = (
					( docking.angle === 0 || docking.angle === 180 ) ?
						docking.distance.x
					:
						docking.distance.y
				);

				if ( Math.abs( distance ) < 1 ) {
					if ( _.owner.get( Point ).getAbsoluteVelocity() > MAX_SPEED ) {
						// Fire thrusters retrograde
						_.addVelocity( MAX_SPEED );
						consume_fuel( dt );
						return;
					}

					_.owner.get( Point ).setVelocity( 0, 0 );
					reset_spin_procedure();
					docking.phase = 6;
				} else {
					if (
						_.owner.get( Sprite ).rotation._ === get_docking_alignment_angle() &&
						Math.abs( distance ) > 30
					) {
						// Overshot target; reset to phase 2
						docking.phase = 2;
					}
				}

				break;

			// 6. Spin to [docking.angle]
			case 6:
				spin_to_angle( docking.angle, dt );

				if ( _.owner.get( Sprite ).rotation._ === docking.angle ) {
					// Give a small forward pulse
					_.addVelocity( 4 * MAX_SPEED );
					consume_fuel( 4 * dt );
					docking.phase = 7;
				}

				break;

			// 7. Thrust toward docking terminal
			case 7:
				track_target_distance();

				var distance = (
					( docking.angle === 0 || docking.angle === 180 ) ?
						Math.abs( docking.distance.y )
					:
						Math.abs( docking.distance.x )
				);

				if ( distance < 1 )
				{
					// Docked!
					_.owner.get( Point ).setVelocity( 0, 0 );
					docking.on = false;
				}

				break;
		}
	}

	/**
	 * Internal power consumption cycle
	 */
	function consume_power( dt )
	{
		if ( out_of_power ) return;

		power -= dt;

		if ( stabilizing ) power -= dt;
		if ( docking.on ) power -= 3 * dt;

		if ( power < 0 ) {
			power = 0;
			out_of_power = true;

			system_shutdown();

			// TODO: Custom out-of-power event callback
		}
	}

	/**
	 * Fuel consumption (occurs only when maneuvering)
	 */
	function consume_fuel( dt )
	{
		if ( out_of_fuel ) return;

		fuel -= dt;

		if ( stabilizing ) fuel -= 2 * dt;

		if ( fuel < 0 ) {
			fuel = 0;
			out_of_fuel = true;

			system_shutdown();

			// TODO: Custom out-of-fuel event callback
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		if ( docking.on && !out_of_power && !out_of_fuel ) {
			control_docking_procedure( dt );
		}

		if ( stabilizing && !docking.on && !out_of_power && !out_of_fuel ) {
			stabilize_spin();
		}

		_.owner.get( Sprite ).rotation._ += ( spin * dt );

		consume_power( dt );

		if ( stabilizing ) {
			consume_fuel( dt );
		}
	};

	/**
	 * Return the drone's maximum instantaneous thrust speed
	 */
	this.getMaxSpeed = function()
	{
		return MAX_SPEED;
	};

	/**
	 * Get a report on the drone's standing
	 */
	this.getSystem = function()
	{
		return {
			velocity: _.owner.get( Point ).getAbsoluteVelocity(),
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
	};

	/**
	 * Reduce fuel amount
	 */
	this.consumeFuel = function( dt )
	{
		consume_fuel( dt );
		return _;
	};

	/**
	 * Restore power and fuel back to full capacity
	 */
	this.restoreEnergy = function()
	{
		power = MAX_POWER;
		fuel = MAX_FUEL;
	};

	/**
	 * Thrust forward by [amount]
	 */
	this.addVelocity = function( amount )
	{
		var rotation = _.owner.get( Sprite ).rotation._;
		var x = Math.sin( rotation * Math.PI_RAD );
		var y = Math.cos( rotation * Math.PI_RAD ) * -1;

		_.owner.get( Point ).setVelocity(
			x * amount,
			y * amount,
			true
		);

		return _;
	};

	/**
	 * Angular thrust by [amount]
	 */
	this.addSpin = function( amount )
	{
		spin += amount;
		stabilizing = false;
		return _;
	};

	/**
	 * Turn on spin stabilization
	 */
	this.stabilize = function()
	{
		if ( !out_of_power && !out_of_fuel ) {
			stabilizing = true;
		}

		return _;
	};

	/**
	 * Begin docking to [target]
	 */
	this.dockWith = function( target )
	{
		launch_docking_procedure( target );
		return _;
	};

	/**
	 * Stop docking procedure
	 */
	this.abortDocking = function()
	{
		docking.on = false;
		return _;
	};

	/**
	 * Check to see whether Drone can be controlled
	 */
	this.isControllable = function()
	{
		return ( !out_of_power && !out_of_fuel && !docking.on );
	};

	/**
	 * Check to see if Drone is docking
	 */
	this.isDocking = function()
	{
		return docking.on;
	};
}