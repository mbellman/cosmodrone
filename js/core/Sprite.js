/**
 * -----------------
 * DEPENDENCIES:
 *
 * render/Canvas.js
 * core/Entity.js
 * core/Tweenable.js
 * -----------------
 */

/**
 * -------------
 * Class: Sprite
 * -------------
 *
 * A sprite to be rendered onto [screen.game]
 */
function Sprite( _source )
{
	// -- Private: --
	var _ = this;
	var owner = null;
	var source = _source || null;          // Image to render (Image or HTMLCanvasElement)
	var parent_offset = {x: 0, y: 0};      // The offset of the owner's parent entity Sprite (updated internally)
	var offset = {x: 0, y: 0};             // A persistent offset as specified via Sprite.setOffset(x, y)
	var origin = {x: 0, y: 0};             // Origin point of the Sprite (for positioning, rotations, scaling, etc.)
	var render = {x: 0, y: 0};             // On-screen coordinates of the Sprite (updated internally)
	var pivot;                             // Target Point for movement pivoting (motion opposite to)
	var alpha = 1;                         // Proper Sprite alpha, influenced by parent Sprite alpha (update internally)

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
	 * Update the saved on-screen coordinates of the sprite
	 */
	function update_screen_coordinates()
	{
		// Update info on owner's parent entity Sprite offset
		if ( owner.parent !== null && owner.parent.has( Sprite ) ) {
			parent_offset = owner.parent.get( Sprite ).getScreenCoordinates();
		}

		// Update screen coordinates
		render.x = _.x._ - ( !!pivot ? pivot.getPosition().x : 0 ) + parent_offset.x + offset.x - origin.x;
		render.y = _.y._ - ( !!pivot ? pivot.getPosition().y : 0 ) + parent_offset.y + offset.y - origin.y;

		if ( _.snap ) {
			render.x = Math.floor( render.x );
			render.y = Math.floor( render.y );
		}
	}

	/**
	 * Updates the Sprite's true [alpha]
	 * as influenced by parent Sprites
	 */
	function update_proper_alpha()
	{
		if ( owner.parent !== null && owner.parent.has( Sprite ) ) {
			alpha = _.alpha._ * owner.parent.get( Sprite ).getProperAlpha();
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
	 * Prepares [screen.game] for rendering rotated Sprite
	 */
	function apply_rotation()
	{
		_.rotation._ = mod( _.rotation._, 360 );

		if ( _.rotation._ > 0 ) {
			screen.game
				.translate( render.x + origin.x, render.y + origin.y )
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
		update_screen_coordinates();
		update_proper_alpha();

		if (source === null || alpha === 0) {
			// No need to draw blank/invisible Sprites
			return;
		}

		// Don't draw offscreen objects
		if ( render.x > viewport.width || render.x + source.width < 0 ) return;
		if ( render.y > viewport.height || render.y + source.height < 0 ) return;

		if ( has_effects() ) screen.game.save();

		apply_alpha();
		apply_rotation();

		screen.game.draw.image(
			source,
			( _.rotation._ > 0 ? -origin.x : render.x ),
			( _.rotation._ > 0 ? -origin.y : render.y ),
			source.width * _.scale._,
			source.height * _.scale._
		);

		if ( has_effects() ) screen.game.restore();
	}

	this.onAdded = function( entity )
	{
		owner = entity;

		if (
			source !== null &&
			!( source instanceof Image ) &&
			!( source instanceof HTMLCanvasElement )
		) {
			console.warn( 'Sprite: ' + source + ' is not an Image or HTMLCanvasElement object!' );
		}
	}

	/**
	 * Returns the rendered coordinates of the Sprite
	 */
	this.getScreenCoordinates = function()
	{
		return {
			x: render.x,
			y: render.y
		};
	}

	/**
	 * Returns the adjusted parent-influenced [alpha] of the Sprite
	 */
	this.getProperAlpha = function()
	{
		return alpha;
	}

	/**
	 * Returns the width of the Sprite
	 */
	this.getWidth = function()
	{
		return source.width;
	}

	/**
	 * Returns the height of the Sprite
	 */
	this.getHeight = function()
	{
		return source.height;
	}

	/**
	 * Sets the Sprite's [x, y] coordinates
	 */
	this.setXY = function( x, y )
	{
		_.x._ = x;
		_.y._ = y;
		return _;
	}

	/**
	 * Set the Sprite's [source] asset/texture
	 */
	this.setSource = function( _source )
	{
		source = _source;
		return _;
	}

	/**
	 * Set the Sprite's origin
	 */
	this.setOrigin = function( x, y )
	{
		origin.x = x;
		origin.y = y;
		return _;
	}

	/**
	 * Set the Sprite's alpha value
	 */
	this.setAlpha = function( _alpha )
	{
		_.alpha._ = _alpha;
		return _;
	}

	/**
	 * Set the Sprite's [rotation] angle
	 */
	this.setRotation = function( rotation )
	{
		_.rotation._ = mod( rotation, 360 );
		return _;
	}

	/**
	 * Define a (moving) Point for the Sprite
	 * to move in the opposite direction of
	 */
	this.setPivot = function( _pivot )
	{
		pivot = _pivot;
		return _;
	}

	/**
	 * Set a constant rendering offset for the Sprite
	 */
	this.setOffset = function( x, y )
	{
		offset.x = x;
		offset.y = y;
		return _;
	}

	/**
	 * Automatically set the Sprite's origin to its center
	 */
	this.centerOrigin = function()
	{
		_.setOrigin( source.width / 2, source.height / 2 );
		return _;
	}

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
	}
}

/**
 * -----------------
 * Class: FillSprite
 * -----------------
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
	 * Inherit and become an instance of Sprite
	 */
	Sprite.call( this, sprite.element );
}