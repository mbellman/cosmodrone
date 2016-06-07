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
	var while_moving = function() {};

	// -- Public: --
	this.update = function( dt )
	{
		t += ( dt / period ) * ( is_reversed ? -1 : 1 );

		var COS_t = Math.cos( t );
		var SIN_t = Math.sin( t );

		if ( sprite !== null ) {
			sprite.x._ = anchor.x + ( radius.x * COS_t * angle.cosine ) - ( radius.y * SIN_t * angle.sine );
			sprite.y._ = anchor.y + ( radius.y * SIN_t * angle.cosine ) + ( radius.x * COS_t * angle.sine );

			while_moving( sprite, mod( t, Math.TAU ) );
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
		period = ( seconds / Math.TAU );
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