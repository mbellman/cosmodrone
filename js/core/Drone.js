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

	// Flags for automatic spin maneuvering
	var spin_accelerate = false;
	var spin_decelerate = false;

	// Saved value for the angle retrograde to the drone's
	// motion; recalculated via [update_retrograde_angle()]
	var retrograde_angle = 180;

	// Values/flags for automatic docking
	var docking = {
		// Docking target hardware part
		target: null,
		// Target hardware type
		hardware: null,
		// Orientation for docking (see: get_docking_angle())
		angle: 0,
		// Coordinate distance to the docking terminal
		distance: {},
		// Docking procedure phase (see: control_docking_procedure())
		phase: 1,
		// Docking completion handler; automatically receives
		// the target HardwarePart specs as an argument
		onComplete: function() {},
		// Undocking handler
		onDetach: function() {}
	};

	// Drone stats object
	var System = {
		// Angular velocity
		spin: 0,
		// Spin stabilization state boolean
		stabilizing: false,
		// docking state boolean
		docking: false,
		// Power level
		power: 500,
		// Fuel level
		fuel: 350,
		// Drone health
		health: 100,
		// Instantaneous thrust speed
		MAX_SPEED: 3,
		// Upper bound for power
		MAX_POWER: 500,
		// Upper bound for fuel
		MAX_FUEL: 350,
		// Upper bound for health
		MAX_HEALTH: 100
	};

	var is_docked = false;
	var out_of_power = false;
	var out_of_fuel = false;

	var thrusters = new Entity();

	/**
	 * Check to see whether the drone can still run
	 */
	function is_operational()
	{
		return !out_of_power && !out_of_fuel;
	}

	/**
	 * Invoked upon power/fuel loss
	 */
	function system_shutdown()
	{
		System.stabilizing = false;
		System.docking = false;
	}

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
	 * Update the drone's saved [retrograde_angle]
	 */
	function update_retrograde_angle()
	{
		var velocity = _.owner.get( Point ).getVelocity();
		retrograde_angle =  mod( -1 * Math.atan2( velocity.x, velocity.y ) * Math.RAD_TO_DEG, 360 );
	}

	/**
	 * Returns the shortest distance in degrees between two angles
	 */
	function get_spin_distance( angle1, angle2 )
	{
		var high = Math.max( angle1, angle2 );
		var low = Math.min( angle1, angle2 );

		var d1 = high - low;
		var d2 = ( 360 - high ) + low;

		return Math.min( d1, d2 );
	}

	/**
	 * Returns +/-1 depending on the shortest rotation to [angle]
	 */
	function get_spin_direction( angle )
	{
		var rotation = _.owner.get( Sprite ).rotation._;

		var high = Math.max( rotation, angle );
		var low = Math.min( rotation, angle );

		var cw = ( 360 - high ) + low;
		var ccw = high - low;

		return (
			cw > ccw ?
				( rotation > angle ? -1 : 1 )
			:
				( rotation > angle ? 1 : -1 )
		);
	}

	/**
	 * Docking alignment is defined as stopping at a
	 * fixed point "in front" of a docking terminal
	 * before final approach. This method returns +/-1
	 * indicating the direction to the alignment point
	 * along either x or y from the drone's position
	 * (the axis depends on the terminal's orientation).
	 * [track_target_distance()] should be called before
	 * this method in order to set [docking.distance].
	 */
	function get_docking_alignment_direction()
	{
		if ( docking.angle === 0 || docking.angle === 180 ) {
			// x direction for horizontal alignment approach
			return ( docking.distance.x > 0 ? -1 : 1 );
		}

		if ( docking.angle === 90 || docking.angle === 270 ) {
			// y direction for vertical alignment approach
			return ( docking.distance.y > 0 ? -1 : 1 );
		}
	}

	/**
	 * Returns the directional angle needed to
	 * approach docking alignment, ascertained
	 * via [get_docking_alignment_direction()]
	 */
	function get_docking_alignment_angle()
	{
		var direction = get_docking_alignment_direction();

		if ( docking.angle === 0 || docking.angle === 180 ) {
			return ( direction < 0 ? 270 : 90 );
		}

		if ( docking.angle === 90 || docking.angle === 270 ) {
			return ( direction < 0 ? 0 : 180 );
		}
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

		var DRONE_W = _.owner.get( Sprite ).width();
		var DRONE_H = _.owner.get( Sprite ).height();
		var TERMINAL_HALF_W = 20;
		var overlap = 8;

		// Align distance units to terminal based
		// on the hardware sprite's orientation
		switch ( specs.orientation ) {
			case 'top':
				target.x += ( -specs.x + TERMINAL_HALF_W );
				target.y -= ( DRONE_H / 2 - overlap );
				break;
			case 'right':
				target.x += ( specs.width + DRONE_W / 2 - overlap );
				target.y += ( -specs.y + TERMINAL_HALF_W );
				break;
			case 'bottom':
				target.x += ( -specs.x + TERMINAL_HALF_W );
				target.y += ( specs.height + DRONE_H / 2 - overlap );
				break;
			case 'left':
				target.x -= ( DRONE_W / 2 - overlap );
				target.y += ( -specs.y + TERMINAL_HALF_W );
				break;
		}

		docking.distance.x = player.x - target.x;
		docking.distance.y = player.y - target.y;
	}

	/**
	 * Gradually reduces spin to 0
	 */
	function stabilize_spin()
	{
		System.stabilizing = true;
		System.spin *= 0.9;

		if ( Math.abs( System.spin ) < 1 ) {
			System.stabilizing = false;
			System.spin = 0;
		}
	}

	/**
	 * Resets flags for [spin_to_angle()]
	 */
	function reset_spin_procedure()
	{
		spin_accelerate = false;
		spin_decelerate = false;
	}

	/**
	 * Gradually and fluidly spins the drone to [angle]
	 */
	function spin_to_angle( angle, dt )
	{
		consume_fuel( dt );

		var distance = get_spin_distance( _.owner.get( Sprite ).rotation._, angle );
		var direction = get_spin_direction( angle );
		var SPIN_VELOCITY = Math.abs( System.spin );

		if ( spin_decelerate ) {
			stabilize_spin();

			if ( System.spin === 0 || distance < 1 )
			{
				if ( SPIN_VELOCITY > 25 || distance > 3 ) {
					// Either distance to angle is < 1 and spin velocity is too high,
					// or the angle was overshot - either way, reset the spin procedure
					// so it can continue running on the next cycle and self-correct
					reset_spin_procedure();
					return;
				}

				System.spin = 0;
				System.stabilizing = false;
				_.owner.get( Sprite ).rotation._ = angle;
			}

			return;
		}

		if ( spin_accelerate && SPIN_VELOCITY < 200 ) {
			_.addSpin( System.MAX_SPEED * direction );
		}

		if ( distance < ( 10 * SPIN_VELOCITY * dt ) ) {
			spin_decelerate = true;
			return;
		}

		// If the drone is spinning "away" from [angle]
		// at a slow enough rate, slow down and prepare
		// to spin faster in the opposite direction.
		if (
			(
				( direction < 0 && System.spin > 0 ) ||
				( direction > 0 && System.spin < 0 )
			) &&
			SPIN_VELOCITY < 75
		) {
			stabilize_spin();

			if ( System.spin === 0 ) {
				spin_accelerate = true;
				return;
			}
		} else {
			// Otherwise, speed up for [angle] approach
			spin_accelerate = true;
		}
	}

	/**
	 * Triggers docking cycle
	 */
	function launch_docking_procedure( target )
	{
		var specs = target.get( HardwarePart ).getSpecs();

		System.stabilizing = false;
		System.docking = true;

		docking.target = target;
		docking.hardware = specs.name;
		docking.angle = get_docking_angle( specs.orientation );
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
				if ( _.owner.get( Point ).getAbsoluteVelocity() > System.MAX_SPEED ) {
					// Fire thrusters retrograde
					_.addVelocity( System.MAX_SPEED );
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
					_.addVelocity( 4 * System.MAX_SPEED );
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

				// Only check distance along the relevant axis
				var distance = Math.abs(
					( docking.angle === 0 || docking.angle === 180 ) ?
						docking.distance.x
					:
						docking.distance.y
				);

				if ( distance < 1 ) {
					if ( _.owner.get( Point ).getAbsoluteVelocity() > System.MAX_SPEED ) {
						// Fire thrusters retrograde
						_.addVelocity( System.MAX_SPEED );
						consume_fuel( dt );
						return;
					}

					_.owner.get( Point ).setVelocity( 0, 0 );
					reset_spin_procedure();
					docking.phase = 6;
				} else {
					if (
						_.owner.get( Sprite ).rotation._ === get_docking_alignment_angle() &&
						distance > 30
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
					_.addVelocity( 4 * System.MAX_SPEED );
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
					System.docking = false;
					is_docked = true;

					_.owner.get( Point ).setVelocity( 0, 0 );
					docking.onComplete( docking.target.get( HardwarePart ).getSpecs() );
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

		System.power -= dt;

		if ( System.stabilizing ) System.power -= dt;
		if ( System.docking ) System.power -= dt;

		if ( System.power < 0 ) {
			System.power = 0;
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

		System.fuel -= dt;

		if ( System.stabilizing ) System.fuel -= dt;

		if ( System.fuel < 0 ) {
			System.fuel = 0;
			out_of_fuel = true;

			system_shutdown();

			// TODO: Custom out-of-fuel event callback
		}
	}

	/**
	 * Animate thruster lights on
	 */
	function set_thrusters_on()
	{
		var sprite = thrusters.get( Sprite );

		if ( sprite.alpha._ === 0 ) {
			sprite.alpha.tweenTo( 1, 0.5, Ease.quad.out );
		}

		thrusters.get( Countdown ).wait( 0.5 );
	}

	/**
	 * Animate thruster lights off
	 */
	function set_thrusters_off()
	{
		thrusters.get( Sprite ).alpha.tweenTo( 0, 0.5, Ease.quad.out );
	}

	// -- Public: --
	/**
	 * Radio signal strength
	 */
	this.signal = 4;

	this.update = function( dt )
	{
		if ( is_operational() ) {
			if ( System.docking ) {
				control_docking_procedure( dt );
			}

			if ( System.stabilizing ) {
				consume_fuel( dt );

				if ( !System.docking ) {
					// Only run stabilization here if the docking
					// mode procedure isn't already managing it
					stabilize_spin();
				}
			}
		}

		_.owner.get( Sprite ).rotation._ += ( System.spin * dt );

		if ( is_docked ) {
			switch ( docking.hardware ) {
				case 'RECHARGER':
					System.power = Math.min( System.power + 30 * dt, System.MAX_POWER );
					break;
				case 'REFUELER':
					System.fuel = Math.min( System.fuel + 20 * dt, System.MAX_FUEL );
					break;
			}
		} else {
			consume_power( dt );
		}
	};

	this.onAdded = function()
	{
		thrusters
			.add(
				new Sprite( Assets.getImage( 'game/drone/thrusters.png' ) )
					.setXY( 12, 52 )
					.setAlpha( 0 )
			)
			.add(
				new Countdown()
					.fire( set_thrusters_off )
			);

		_.owner.addChild( thrusters );
	};

	/**
	 * Return the drone's maximum instantaneous thrust speed
	 */
	this.getMaxSpeed = function()
	{
		return System.MAX_SPEED;
	};

	/**
	 * Get a report on the drone's stats
	 */
	this.getSystem = function()
	{
		return System;
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
	 * Thrust forward by [amount]
	 */
	this.addVelocity = function( amount )
	{
		var rotation = _.owner.get( Sprite ).rotation._;

		var x = Math.sin( rotation * Math.DEG_TO_RAD );
		var y = Math.cos( rotation * Math.DEG_TO_RAD ) * -1;

		_.owner.get( Point ).setVelocity(
			x * amount,
			y * amount,
			true
		);

		set_thrusters_on();

		return _;
	};

	/**
	 * Angular thrust by [amount]
	 */
	this.addSpin = function( amount )
	{
		System.spin += amount;
		System.stabilizing = false;
		return _;
	};

	/**
	 * Turn on spin stabilization
	 */
	this.stabilize = function()
	{
		if ( is_operational() ) {
			System.stabilizing = true;
		}

		return _;
	};

	/**
	 * Begin docking to [target]
	 */
	this.dockWith = function( target )
	{
		target.get( HardwarePart ).hideAlert();
		launch_docking_procedure( target );
		return _;
	};

	/**
	 * Detach from currently docked terminal
	 */
	this.undock = function()
	{
		if ( is_docked ) {
			docking.target.get( HardwarePart ).showAlert();
			_.addVelocity( 2 * -System.MAX_SPEED );
			docking.onDetach();

			is_docked = false;
		}
	};

	/**
	 * Stop docking procedure
	 */
	this.abortDocking = function()
	{
		docking.target.get( HardwarePart ).showAlert();
		System.docking = false;
		return _;
	};

	/**
	 * Set a handler to be run on docking completion.
	 * The handler automatically receives the docking
	 * target HardwarePart specs as an argument.
	 */
	this.onDocking = function( handler )
	{
		docking.onComplete = handler;
		return _;
	};

	/**
	 * Set a handler to be run upon undocking
	 */
	this.onUnDocking = function( handler )
	{
		docking.onDetach = handler;
		return _;
	};

	/**
	 * Check to see whether Drone can be player-controlled
	 */
	this.isControllable = function()
	{
		return (
			is_operational() &&
			_.signal > 0 &&
			!System.docking &&
			!is_docked
		);
	};

	/**
	 * Check to see if Drone is docking
	 */
	this.isDocking = function()
	{
		return System.docking;
	};

	/**
	 * Check to see if Drone is currently docked to a terminal
	 */
	this.isDocked = function()
	{
		return is_docked;
	};
}