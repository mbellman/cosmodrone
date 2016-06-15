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
	var pivot;                             // A Point component for movement pivoting (motion away from)

	var alpha = 1;                         // Proper Sprite alpha, influenced by parent sprite alpha (update internally)
	var rotation = 0;                      // Proper Sprite rotation, influenced by parent sprite rotation (updated internally)

	var T = {                              // Transformed coordinates/origin based on parent sprite's coordinate system
		x: 0,
		y: 0,
		origin: {
			x: 0,
			y: 0
		}
	};

	var bounds = {                         // Sprite's on-screen bounding rectangle (updated internally)
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};

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
	 * Update all Tweenable properties
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
	 * Recalculate transformed [T] offsets based on parent coordinate system
	 */
	function update_transform()
	{
		if ( parent !== null && parent.getProperRotation() !== 0 ) {
			var theta = parent.getProperRotation() * Math.DEG_TO_RAD;
			var SIN_THETA = Math.sin( theta );
			var COS_THETA = Math.cos( theta );

			T.origin.x = origin.x + parent.getProperOrigin().x;
			T.origin.y = origin.y + parent.getProperOrigin().y;
			T.x = ( _.x._ * COS_THETA - _.y._ * SIN_THETA ) + parent.getProperOrigin().x;
			T.y = ( _.x._ * SIN_THETA + _.y._ * COS_THETA ) + parent.getProperOrigin().y;
			return;
		}

		T.x = _.x._;
		T.y = _.y._;
		T.origin.x = origin.x;
		T.origin.y = origin.y;
	}

	/**
	 * Recalculate the Sprite's global (on-screen) coordinates/visible size
	 */
	function update_bounding_box()
	{
		if ( parent !== null ) {
			parent_offset = parent.getBoundingBox();
		}

		bounds.x = T.x - ( !!pivot ? pivot.getPosition().x : 0 ) + parent_offset.x + offset.x - T.origin.x;
		bounds.y = T.y - ( !!pivot ? pivot.getPosition().y : 0 ) + parent_offset.y + offset.y - T.origin.y;

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
	 * as influenced by parent Sprite
	 */
	function update_proper_alpha()
	{
		if ( parent !== null ) {
			alpha = _.alpha._ * parent.getProperAlpha();
			return;
		}

		alpha = _.alpha._;
	}

	/**
	 * Updates the Sprite's true [rotation]
	 * as influenced by parent Sprite
	 */
	function update_proper_rotation()
	{
		_.rotation._ = mod( _.rotation._, 360 );

		if ( parent !== null ) {
			rotation = mod( _.rotation._ + parent.getProperRotation(), 360 );
			return;
		}

		rotation = mod( _.rotation._, 360 );
	}

	/**
	 * Sets globalAlpha of [screen.game] context
	 */
	function apply_alpha()
	{
		if ( alpha < 1 ) {
			screen.game.setAlpha( alpha );
		}
	}

	/**
	 * Sets rotation of [screen.game] context
	 */
	function apply_rotation()
	{
		if ( rotation > 0 ) {
			screen.game
				.translate( bounds.x + T.origin.x, bounds.y + T.origin.y )
				.rotate( rotation * Math.DEG_TO_RAD );
		}
	}

	/**
	 * Determines whether or not effects are used
	 */
	function has_effects()
	{
		return ( alpha < 1 || rotation != 0 );
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
		check_parent();
		update_tweens( dt );
		update_transform();
		update_proper_alpha();
		update_proper_rotation();
		update_bounding_box();

		if (source === null || alpha === 0 || !_.isOnScreen() ) {
			return;
		}

		if ( has_effects() ) screen.game.save();

		apply_alpha();
		apply_rotation();

		screen.game.draw.image(
			source,
			( rotation > 0 ? ( -T.origin.x * _.scale._ ) : bounds.x ),
			( rotation > 0 ? ( -T.origin.y * _.scale._ ) : bounds.y ),
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
	 * Returns the transformed parent-influenced [rotation] of the Sprite
	 */
	this.getProperRotation = function()
	{
		return rotation;
	};

	/**
	 * Returns the Sprite's transformed origin
	 */
	this.getProperOrigin = function()
	{
		return T.origin;
	};

	/**
	 * Returns the natural width of the Sprite asset
	 */
	this.width = function()
	{
		return source.width;
	};

	/**
	 * Returns the natural height of the Sprite asset
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
	var _ = this;
	var sprite = new Canvas().setSize( width, height );
	var size = {
		width: width,
		height: height
	};

	/**
	 * Draw the fill effect across the whole [sprite] canvas
	 */
	function redraw_fill()
	{
		sprite.draw.rectangle( 0, 0, size.width, size.height ).fill( color );
	}

	/**
	 * Inherit Sprite and set its source to this instance's Canvas
	 */
	Sprite.call( this, sprite.element );

	// -- Public: --
	this.onAdded = function()
	{
		redraw_fill();
	};

	/**
	 * Update the [width] and [height] of the FillSprite
	 */
	this.setSize = function( width, height )
	{
		size.width = width;
		size.height = height;

		sprite.setSize( width, height );
		redraw_fill();
		return _;
	};
}

FillSprite.prototype = Object.create(Sprite.prototype);
FillSprite.prototype.constructor = FillSprite;

/**
 * -----------------------
 * Component: RasterSprite
 * -----------------------
 *
 * A special Sprite variant which allows
 * for custom raster graphics rendering
 */
function RasterSprite()
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

RasterSprite.prototype = Object.create(Sprite.prototype);
RasterSprite.prototype.constructor = RasterSprite;