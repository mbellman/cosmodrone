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
	 * Fade in hardware part's alert icon graphic
	 */
	this.showAlert = function()
	{
		var alert = _.owner.$( 'alert' );

		if ( alert.has( Sprite ) ) {
			alert.get( Sprite ).alpha.tweenTo( 1, 0.5, Ease.quad.out );
		}
	};

	/**
	 * Fade out hardware part's alert icon graphic
	 */
	this.hideAlert = function()
	{
		var alert = _.owner.$( 'alert' );

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