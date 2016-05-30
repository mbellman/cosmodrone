/**
 * ------------------
 * Component: Flicker
 * ------------------
 *
 * An alpha-flickering effect for Sprites
 */
function Flicker()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var sprite;
	var range = {
		alpha: {low: 0, high: 1},
		time: {low: 0.5, high: 1.0}
	};

	// Public:
	this.update = function( dt )
	{
		if ( !sprite.alpha.isTweening() ) {
			// Start new flicker tween
			sprite.alpha.tweenTo(
				randomFloat( range.alpha.low, range.alpha.high ),
				randomFloat( range.time.low, range.time.high ),
				Ease.quad.inOut
			);
		}
	};

	this.onAdded = function()
	{
		sprite = _.owner.get( Sprite );
	};

	/**
	 * Define the [low] and [high] of the flicker alpha range
	 */
	this.setAlphaRange = function( low, high )
	{
		range.alpha.low = low;
		range.alpha.high = high;
		return _;
	};

	/**
	 * Define the [low] and [high] of the flicker time range
	 */
	this.setTimeRange = function( low, high )
	{
		range.time.low = low;
		range.time.high = high;
		return _;
	};
}

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
 * ----------------------
 * Component: Oscillation
 * ----------------------
 *
 * Oscillates a Sprite by having it trace
 * out a parameterized elliptical path
 */
function Oscillation( width, height, is_reversed )
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var sprite = null;
	var period = 0;
	var t = 0;
	var TAU = 2 * Math.PI;
	var while_moving = function() {};
	var angle = {
		sine: 0,
		cosine: 1
	};
	var anchor = {
		x: null,
		y: null
	};
	var radius = {
		x: ( width / 2 ),
		y: ( height / 2 )
	};

	// -- Public: --
	this.update = function( dt )
	{
		t += ( dt / period ) * ( is_reversed ? -1 : 1 );

		var COS_t = Math.cos( t );
		var SIN_t = Math.sin( t );

		if ( sprite !== null ) {
			sprite.x._ = anchor.x + ( radius.x * COS_t * angle.cosine ) - ( radius.y * SIN_t * angle.sine );
			sprite.y._ = anchor.y + ( radius.y * SIN_t * angle.cosine ) + ( radius.x * COS_t * angle.sine );

			while_moving( sprite, mod( t, TAU ) );
		}
	};

	this.onAdded = function()
	{
		if ( _.owner.has( Sprite ) ) {
			sprite = _.owner.get( Sprite );
		}

		if ( anchor.x === null && anchor.y === null ) {
			anchor.x = sprite.x._;
			anchor.y = sprite.y._;
		}
	};

	/**
	 * Set the anchor point for the revolution
	 */
	this.setAnchor = function( _x, _y )
	{
		anchor.x = _x;
		anchor.y = _y;
		return _;
	};

	/**
	 * Set the oscillation period (time to complete a full revolution)
	 */
	this.setPeriod = function( seconds )
	{
		period = ( seconds / TAU );
		return _;
	};

	/**
	 * Set the rotate of the ellipse path
	 */
	this.setRotation = function( _angle )
	{
		_angle = mod( _angle, 360 ) * Math.PI_RAD;
		angle.sine = Math.sin( _angle );
		angle.cosine = Math.cos( _angle );
		return _;
	};

	/**
	 * Set starting angular offset
	 */
	this.setStart = function( _t )
	{
		t = _t;
		return _;
	};

	/**
	 * Set a handler to be run during the oscillation
	 */
	this.whileMoving = function( handler )
	{
		while_moving = handler;
		return _;
	}
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
}