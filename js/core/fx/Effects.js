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

	var oscillation = {
		on: false,
		speed: 0,
		counter: 0
	};

	var range = {
		alpha: {low: 0, high: 1, delta: 1},
		time: {low: 0.5, high: 1.0}
	};

	// Public:
	this.update = function( dt )
	{
		if ( !oscillation.on && !sprite.alpha.isTweening() ) {
			// Start new flicker tween
			sprite.alpha.tweenTo(
				randomFloat( range.alpha.low, range.alpha.high ),
				randomFloat( range.time.low, range.time.high ),
				Ease.quad.inOut
			);
		} else {
			if ( oscillation.on ) {
				oscillation.counter += ( oscillation.speed * dt );

				var value = ( 1 + Math.sin( oscillation.counter ) ) / 2;
				sprite.alpha._ = range.alpha.low + value * range.alpha.delta;
			}
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
		range.alpha.low = clamp( low, 0, 1 );
		range.alpha.high = clamp( high, 0, 1 );
		range.alpha.delta = range.alpha.high - range.alpha.low;
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

	/**
	 * Turn on alpha sine oscillation with a custom [speed]
	 */
	this.oscillate = function( speed )
	{
		oscillation.on = true;
		oscillation.speed = speed || 1;
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
	var onMove = function() {};

	// -- Public: --
	this.update = function( dt )
	{
		t += ( dt / period ) * ( is_reversed ? -1 : 1 );

		var COS_t = Math.cos( t );
		var SIN_t = Math.sin( t );

		if ( sprite !== null ) {
			sprite.x._ = anchor.x + ( radius.x * COS_t * angle.cosine ) - ( radius.y * SIN_t * angle.sine );
			sprite.y._ = anchor.y + ( radius.y * SIN_t * angle.cosine ) + ( radius.x * COS_t * angle.sine );

			onMove( sprite, mod( t, Math.TAU ) );
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
		_angle = mod( _angle, 360 ) * Math.DEG_TO_RAD;
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
		onMove = handler;
		return _;
	}
}

/**
 * -------------------------
 * Component: SpriteSequence
 * -------------------------
 *
 * Plays an animated image sequence using
 * clippings from a sprite sheet asset
 */
function SpriteSequence( asset )
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var spritesheet = asset;
	var vertical = false;
	var animation;
	var timer = 0;
	var frame = {
		speed: 50,
		width: 0,
		height: 0,
		current: 0,
		MAX: 0
	};

	// -- Public: --
	this.update = function( dt )
	{
		timer += ( dt * 1000 );

		if ( timer > frame.speed ) {
			timer = 0;
			frame.current = ( frame.current + 1 ) % frame.MAX;

			var clip_X = ( vertical ? 0 : frame.current * frame.width );
			var clip_Y = ( vertical ? frame.current * frame.height : 0 );

			animation.sprite
				.clear()
				.draw.image(
					spritesheet,
					clip_X, clip_Y, frame.width, frame.height,
					0, 0, frame.width, frame.height
				);
		}
	};

	this.onAdded = function()
	{
		animation = new RasterSprite();
		animation.sprite.setSize( frame.width, frame.height );

		_.owner.add( animation );
	};

	/**
	 * Configure animation/spritesheet properties
	 */
	this.setOptions = function( options )
	{
		frame.speed = options.speed || 50;
		frame.width = options.frameWidth || 0;
		frame.height = options.frameHeight || 0;
		frame.MAX = options.frames || 0;
		vertical = !!options.vertical;
		return _;
	};
}