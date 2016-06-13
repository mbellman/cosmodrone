/**
 * ----------------
 * Component: Point
 * ----------------
 *
 * A static or moving [x, y] coordinate
 */
function Point()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var position = new Vec2();
	var velocity = new Vec2();

	/**
	 * If the owner entity has a Sprite component,
	 * internally update its [x, y] coordinates
	 */
	function update_sprite()
	{
		if ( _.owner !== null && _.owner.has( Sprite ) ) {
			_.owner.get( Sprite ).setXY( position.x, position.y );
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		position.add( velocity, dt );
		update_sprite();
	};

	/**
	 * Get the position of the Point, optionally rounded
	 */
	this.getPosition = function( is_rounded )
	{
		return {
			x: ( !!is_rounded ? Math.floor( position.x ) : position.x ),
			y: ( !!is_rounded ? Math.floor( position.y ) : position.y )
		};
	};

	/**
	 * Get the velocity of a moving Point
	 */
	this.getVelocity = function()
	{
		return {
			x: velocity.x,
			y: velocity.y
		};
	};

	/**
	 * Get the velocity's magnitude for a moving Point
	 */
	this.getAbsoluteVelocity = function()
	{
		return velocity.magnitude();
	};

	/**
	 * Update the position of the Point, optionally
	 * just offsetting from its current position
	 */
	this.setPosition = function( x, y, is_offset )
	{
		position.x = ( is_offset ? position.x + x : x );
		position.y = ( is_offset ? position.y + y : y );

		update_sprite();

		return _;
	};

	/**
	 * Update the velocity vector of a moving Point,
	 * optionally offsetting from its current position
	 */
	this.setVelocity = function( x, y, is_offset )
	{
		velocity.x = ( is_offset ? velocity.x + x : x );
		velocity.y = ( is_offset ? velocity.y + y : y );
		return _;
	};
}

/**
 * -----------------------
 * Component: HardwarePart
 * -----------------------
 *
 * A dockable hardware part unit fixed to space station modules
 */
function HardwarePart()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var x = 0;
	var y = 0;
	var specs = {};
	var moving = false;

	/**
	 * Updates the internal [x] and [y] position values
	 * for this hardware part to maintain them within
	 * the coordinate system of the player Drone
	 */
	function update_coordinates()
	{
		if ( _.owner !== null && _.owner.parent !== null ) {
			if ( _.owner.has( Sprite ) && _.owner.parent.has( Point ) ) {
				var module = _.owner.parent.get( Point ).getPosition();
				var sprite = _.owner.get( Sprite );

				x = module.x + sprite.x._;
				y = module.y + sprite.y._;
			}
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		if ( moving ) {
			update_coordinates();
		}
	};

	this.onOwnerAddedToParent = function()
	{
		update_coordinates();
	};

	/**
	 * Return hardware part position
	 */
	this.getPosition = function()
	{
		return {
			x: x,
			y: y
		};
	};

	/**
	 * Return specifications for this hardware part
	 */
	this.getSpecs = function()
	{
		return specs;
	};

	/**
	 * Set hardware part specifications
	 */
	this.setSpecs = function( _specs )
	{
		specs = _specs;
		return _;
	};

	/**
	 * Set whether or not this hardware
	 * part is constantly moving, and
	 * therefore requires continual
	 * re-evaluation for positioning
	 */
	this.setMoving = function( boolean )
	{
		moving = boolean;
		return _;
	};

	/**
	 * Update the hardware part's alert icon [graphic]
	 */
	this.setAlert = function( graphic )
	{
		_.owner.get( AlertIcon ).rebuild( graphic );
		return _;
	};

	/**
	 * Fade in hardware part's alert icon
	 */
	this.showAlert = function()
	{
		_.owner.get( AlertIcon ).show();
		return _;
	};

	/**
	 * Fade out hardware part's alert icon
	 */
	this.hideAlert = function()
	{
		_.owner.get( AlertIcon ).hide();
		return _;
	};
}

/**
 * --------------------
 * Component: AlertIcon
 * --------------------
 *
 * A bouncing alert icon coupled with station hardware
 */
function AlertIcon()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var alert = new Entity();

	/**
	 * Calculates and returns offsets for the
	 * icon based on the owner hardware specs
	 */
	function get_offsets()
	{
		var specs = _.owner.get( HardwarePart ).getSpecs();
		var position = {x: 0, y: 0};
		var arrow = {x: 0, y: 0};
		var oscillation = {W: 0, H: 0};
		var margin = 50;

		switch( specs.orientation ) {
			case 'top':
				position.x = specs.width / 2;
				position.y = -margin;
				arrow.x = 16;
				arrow.y = 44;
				oscillation.H = 10;
				break;
			case 'right':
				position.x = specs.width + margin;
				position.y = specs.height / 2;
				arrow.x = -8;
				arrow.y = 16;
				oscillation.W = -10;
				break;
			case 'bottom':
				position.x = specs.width / 2;
				position.y = specs.height + margin;
				arrow.x = 16;
				arrow.y = -8;
				oscillation.H = -10;
				break;
			case 'left':
				position.x = -margin;
				position.y = specs.height / 2;
				arrow.x = 44;
				arrow.y = 16;
				oscillation.W = 10;
				break;
		}

		return {
			POSITION: position,
			ARROW: arrow,
			OSCILLATION: oscillation
		};
	}

	/**
	 * Returns the appropriate arrow asset for an alert
	 * icon based on the owner hardware orientation
	 */
	function get_arrow_graphic()
	{
		var specs = _.owner.get( HardwarePart ).getSpecs();

		switch( specs.orientation ) {
			case 'top':
				return Assets.getImage( 'game/ui/alert/arrow-B.png' );
			case 'right':
				return Assets.getImage( 'game/ui/alert/arrow-L.png' );
			case 'bottom':
				return Assets.getImage( 'game/ui/alert/arrow-T.png' );
			case 'left':
				return Assets.getImage( 'game/ui/alert/arrow-R.png' );
			default:
				return null;
		}
	}

	// -- Public: --
	this.onAdded = function()
	{
		_.owner.addChild( alert );
	};

	/**
	 * Reconstruct a hardware part's alert
	 * icon with a new [graphic] indicator
	 */
	this.rebuild = function( graphic )
	{
		if ( _.owner === null || !_.owner.has( HardwarePart ) ) {
			return;
		}

		var offsets = get_offsets();
		var arrow = get_arrow_graphic();

		alert
			.disposeChildren()
			.remove( Oscillation )
			.add(
				new Sprite( Assets.getImage( 'game/ui/alert/alert-box.png' ) )
					.setXY( offsets.POSITION.x, offsets.POSITION.y )
					.centerOrigin()
			)
			.add(
				new Oscillation( offsets.OSCILLATION.W, offsets.OSCILLATION.H )
					.setPeriod( 1 )
			)
			.addChild(
				new Entity().add(
					new Sprite( arrow )
						.setXY( offsets.ARROW.x, offsets.ARROW.y )
				),
				new Entity().add(
					new Sprite( graphic )
						.setXY( 26, 26 )
						.centerOrigin()
				)
			);
	};

	this.show = function()
	{
		if ( alert.has( Sprite ) ) {
			alert.get( Sprite ).alpha.tweenTo( 1, 0.5, Ease.quad.out );
		}
	};

	this.hide = function()
	{
		if ( alert.has( Sprite ) ) {
			alert.get( Sprite ).alpha.tweenTo( 0, 0.5, Ease.quad.out );
		}
	};
}

/**
 * --------------------
 * Component: Countdown
 * --------------------
 *
 * Runs custom events after an elapsed duration
 */
function Countdown()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var timer = 0;
	var fire = function() {};

	// -- Public: --
	this.update = function( dt )
	{
		if ( timer > 0 ) {
			timer -= dt;

			if ( timer <= 0 ) {
				fire();
			}
		}
	};

	/**
	 * Set the countdown time in [seconds]
	 */
	this.wait = function( seconds )
	{
		timer = seconds;
		return _;
	};

	/**
	 * Set the countdown completion [handler]
	 */
	this.fire = function( handler )
	{
		fire = handler;
		return _;
	};
}