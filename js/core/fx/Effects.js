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
	var is_flickering = true;

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
		if ( is_flickering ) {
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

	/**
	 * Enable flicker effect
	 */
	this.enable = function()
	{
		is_flickering = true;
		return _;
	};

	/**
	 * Disable flicker effect and stop alpha tween
	 */
	this.disable = function()
	{
		is_flickering = false;
		sprite.alpha.stop();
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
	var spritesheet = asset;                          // Spritesheet source image
	var is_vertical = false;                          // Boolean state for vertical orientation of spritesheet
	var is_playing = true;                            // Boolean state for continual playback
	var animation = new RasterSprite();               // RasterSprite instance for animation frames to be rendered to
	var timer = 0;                                    // Time counter for frame advancing
	var clip = {};                                    // Reusable frame clipping object

	// Animation data
	var frame = {
		// Playback rate
		speed: 50,
		// Frame clipping width
		width: 0,
		// Frame clipping height
		height: 0,
		// Current frame
		current: 0,
		// Total frames
		total: 0
	};

	/**
	 * Update the sprite rendering
	 */
	function update_sprite()
	{
		if ( typeof animation === 'undefined' ) {
			return;
		}

		clip.x = ( is_vertical ? 0 : frame.current * frame.width );
		clip.y = ( is_vertical ? frame.current * frame.height : 0 );

		animation.sprite
			.clear()
			.draw.image(
				spritesheet,
				clip.x, clip.y, frame.width, frame.height,
				0, 0, frame.width, frame.height
			);
	}

	// -- Public: --
	this.update = function( dt )
	{
		if ( is_playing ) {
			timer += ( dt * 1000 );

			if ( timer > frame.speed ) {
				timer = 0;
				frame.current = ( frame.current + 1 ) % frame.total;

				update_sprite();
			}
		}
	};

	this.onAdded = function()
	{
		animation.sprite.setSize( frame.width, frame.height );
		_.owner.add( animation );
		update_sprite();
	};

	/**
	 * Configure animation properties
	 */
	this.setOptions = function( options )
	{
		frame.speed = options.speed || 50;
		frame.width = options.frameWidth || 0;
		frame.height = options.frameHeight || 0;
		frame.total = options.frames || 0;
		is_vertical = !!options.vertical;
		return _;
	};

	/**
	 * Jump to a specific frame in the sequence
	 */
	this.setFrame = function( _frame )
	{
		frame.current = ( _frame - 1 ) % frame.total;
		update_sprite();
		return _;
	};

	/**
	 * Set the SpriteSequence [x, y] coordinates
	 */
	this.setXY = function( x, y )
	{
		animation.setXY( x, y );
		return _;
	};

	/**
	 * Start/resume playback
	 */
	this.play = function()
	{
		is_playing = true;
		return _;
	};

	/**
	 * Pause playback
	 */
	this.pause = function()
	{
		is_playing = false;
		return _;
	};
}