/**
 * -----------------
 * Component: Sprite
 * -----------------
 *
 * A sprite to be rendered onto [screen.game]
 */
function Sprite( _source )
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var source = _source || null;          // Graphic to render (Image or HTMLCanvasElement)
	var parent_offset = {x: 0, y: 0};      // Offset of the owner's parent/ancestor entity Sprite (where applicable)
	var offset = {x: 0, y: 0};             // A persistent offset as specified via Sprite.setOffset(x, y)
	var origin = {x: 0, y: 0};             // Origin point of the Sprite (for positioning, rotations, scaling, etc.)
	var parent = null;                     // Parent or ancestor entity Sprite
	var pivot;                             // Target Point for movement pivoting (motion opposite to)
	var alpha = 1;                         // Proper Sprite alpha, influenced by parent Sprite alpha (update internally)
	var bounds = {                         // Sprite's bounding rectangle (updated internally)
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};

	/**
	 * Update all Tweenable instances
	 */
	function update_tweens( dt )
	{
		_.x.update( dt );
		_.y.update( dt );
		_.scale.update( dt );
		_.rotation.update( dt );
		_.alpha.update( dt );
	}

	/**
	 * Search for a parent/ancestor entity Sprite and save one if found
	 */
	function check_parent()
	{
		if ( parent === null ) {
			parent = _.owner.getFromParents( Sprite );
		}
	}

	/**
	 * Recalculate the Sprite's global (on-screen) coordinates/visible size
	 */
	function update_bounding_box()
	{
		check_parent();

		if ( parent !== null ) {
			parent_offset = parent.getBoundingBox();
		}

		bounds.x = _.x._ - ( !!pivot ? pivot.getPosition().x : 0 ) + parent_offset.x + offset.x - origin.x;
		bounds.y = _.y._ - ( !!pivot ? pivot.getPosition().y : 0 ) + parent_offset.y + offset.y - origin.y;

		if ( source !== null ) {
			bounds.width = _.scale._ * source.width;
			bounds.height = _.scale._ * source.height;
		}

		if ( _.snap ) {
			bounds.x = Math.floor( bounds.x );
			bounds.y = Math.floor( bounds.y );
		}
	}

	/**
	 * Updates the Sprite's true [alpha]
	 * as influenced by parent Sprites
	 */
	function update_proper_alpha()
	{
		check_parent();

		if ( parent !== null ) {
			alpha = _.alpha._ * parent.getProperAlpha();
			return;
		}

		alpha = _.alpha._;
	}

	/**
	 * Sets globalAlpha of [screen.game]
	 */
	function apply_alpha()
	{
		if ( alpha < 1 ) {
			screen.game.setAlpha( alpha );
		}
	}

	/**
	 * Sets rotation of [screen.game]
	 */
	function apply_rotation()
	{
		_.rotation._ = mod( _.rotation._, 360 );

		if ( _.rotation._ > 0 ) {
			screen.game
				.translate( bounds.x + origin.x, bounds.y + origin.y )
				.rotate( _.rotation._ * Math.PI_RAD );
		}
	}

	/**
	 * Determines whether or not effects are used
	 */
	function has_effects()
	{
		return ( alpha < 1 || _.rotation._ != 0 );
	}

	// -- Public: --
	this.x = new Tweenable( 0 );
	this.y = new Tweenable( 0 );
	this.scale = new Tweenable( 1 );
	this.rotation = new Tweenable( 0 );
	this.alpha = new Tweenable( 1 );
	this.snap = false;

	this.update = function( dt )
	{
		update_tweens( dt );
		update_bounding_box();
		update_proper_alpha();

		if (source === null || alpha === 0 || !_.isOnScreen() ) {
			return;
		}

		if ( has_effects() ) screen.game.save();

		apply_alpha();
		apply_rotation();

		screen.game.draw.image(
			source,
			( _.rotation._ > 0 ? ( -origin.x * _.scale._ ) : bounds.x ),
			( _.rotation._ > 0 ? ( -origin.y * _.scale._ ) : bounds.y ),
			bounds.width,
			bounds.height
		);

		if ( has_effects() ) screen.game.restore();
	};

	this.onAdded = function()
	{
		if (
			source !== null &&
			!( source instanceof Image ) &&
			!( source instanceof HTMLCanvasElement )
		) {
			console.warn( 'Sprite: ' + source + ' is not an Image or HTMLCanvasElement object!' );
		}
	};

	this.onRemoved = function()
	{
		_.owner.forAllComponentsOfType( Sprite, function( sprite ) {
			sprite.unlistParent();
		} );
	};

	/**
	 * Clears the area around the Sprite
	 */
	this.erase = function()
	{
		var buffer = (
			_.rotation._ === 0 ?
				( _.snap ? 0 : 1)
			:
				( Math.max( bounds.width, bounds.height ) / 2 )
		);

		screen.game.clear(
			bounds.x - buffer,
			bounds.y - buffer,
			bounds.width + 2 * buffer,
			bounds.height + 2 * buffer
		);

		return _;
	};

	/**
	 * Returns the Sprite's bounding rectangle
	 */
	this.getBoundingBox = function()
	{
		return bounds;
	};

	/**
	 * Returns the adjusted parent-influenced [alpha] of the Sprite
	 */
	this.getProperAlpha = function()
	{
		return alpha;
	};

	/**
	 * Returns the width of the Sprite
	 */
	this.width = function()
	{
		return source.width;
	};

	/**
	 * Returns the height of the Sprite
	 */
	this.height = function()
	{
		return source.height;
	};

	/**
	 * Sets the Sprite's [x, y] coordinates
	 */
	this.setXY = function( x, y )
	{
		_.x._ = x;
		_.y._ = y;
		return _;
	};

	/**
	 * Set the Sprite's [source] asset/texture
	 */
	this.setSource = function( _source )
	{
		source = _source;
		return _;
	};

	/**
	 * Set the Sprite's origin
	 */
	this.setOrigin = function( x, y )
	{
		origin.x = x;
		origin.y = y;
		return _;
	};

	/**
	 * Set the Sprite's alpha value
	 */
	this.setAlpha = function( _alpha )
	{
		_.alpha._ = _alpha;
		return _;
	};

	/**
	 * Set the Sprite's [rotation] angle
	 */
	this.setRotation = function( rotation )
	{
		_.rotation._ = mod( rotation, 360 );
		return _;
	};

	/**
	 * Define a (moving) Point for the Sprite
	 * to move in the opposite direction of
	 */
	this.setPivot = function( _pivot )
	{
		pivot = _pivot;
		return _;
	};

	/**
	 * Set a constant rendering offset for the Sprite
	 */
	this.setOffset = function( x, y )
	{
		offset.x = x;
		offset.y = y;
		return _;
	};

	/**
	 * Automatically set the Sprite's origin to its center
	 */
	this.centerOrigin = function()
	{
		_.setOrigin( source.width / 2, source.height / 2 );
		return _;
	};

	/**
	 * Halt any Sprite property tweens
	 */
	this.stopTweens = function()
	{
		_.x.stop();
		_.y.stop();
		_.scale.stop();
		_.rotation.stop();
		_.alpha.stop();
		return _;
	};

	/**
	 * Reset parent/ancestor Sprite reference
	 */
	this.unlistParent = function()
	{
		parent = null;
		return _;
	};

	/**
	 * Determine whether the Sprite's rendering area is on-screen
	 */
	this.isOnScreen = function()
	{
		if ( source === null ) return false;

		return (
			( bounds.x < Viewport.width && bounds.x + bounds.width > 0) &&
			( bounds.y < Viewport.height && bounds.y + bounds.height > 0)
		);
	};

	/**
	 * Determine whether or not this Sprite lacks a [source] graphic
	 */
	this.isBlankSprite = function()
	{
		return ( source === null );
	};
}

/**
 * Static method for determining whether a bounding rectangle is on-screen
 */
Sprite.isOnScreen = function( x, y, width, height )
{
	return (
		( x < Viewport.width && x + width > 0 ) &&
		( y < Viewport.height && y + height > 0 )
	);
};

/**
 * ---------------------
 * Component: FillSprite
 * ---------------------
 *
 * A solid-color Sprite variant which
 * inherits Sprite's functionality
 */
function FillSprite( color, width, height )
{
	// -- Private: --
	var sprite = new Canvas().setSize( width, height );

	/**
	 * Create a [width] x [height] Canvas
	 * and fill it with a solid [color]
	 */
	sprite.draw.rectangle( 0, 0, width, height ).fill( color );

	/**
	 * Inherit Sprite and set its source to this instance's Canvas
	 */
	Sprite.call( this, sprite.element );
}

FillSprite.prototype = Object.create(Sprite.prototype);

/**
 * -----------------------
 * Component: VectorSprite
 * -----------------------
 *
 * A special Sprite variant which allows
 * for custom vector graphics rendering
 */
function VectorSprite()
{
	/**
	 * Public Canvas instance for custom control
	 */
	this.sprite = new Canvas();

	/**
	 * Inherit Sprite and set its source to the instance's Canvas
	 */
	Sprite.call( this , this.sprite.element );
}

VectorSprite.prototype = Object.create(Sprite.prototype);