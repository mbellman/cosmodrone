/**
 * --------------
 * DEPENDENCIES:
 *
 * core/Entity.js
 * core/Sprite.js
 * --------------
 */

/**
 * --------------
 * Class: Flicker
 * --------------
 *
 * An alpha-flickering effect for Sprites
 */
function Flicker()
{
	// -- Private: --
	var _ = this;
	var owner = null;
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
				random( range.alpha.low, range.alpha.high ),
				random( range.time.low, range.time.high ),
				Ease.quad.inOut
			);
		}
	}

	this.onAdded = function( entity )
	{
		owner = entity;
		sprite = owner.get( Sprite );
	}

	/**
	 * Define the [low] and [high] of the flicker alpha range
	 */
	this.setAlphaRange = function( low, high )
	{
		range.alpha.low = low;
		range.alpha.high = high;
		return _;
	}

	/**
	 * Define the [low] and [high] of the flicker time range
	 */
	this.setTimeRange = function( low, high )
	{
		range.time.low = low;
		range.time.high = high;
		return _;
	}
}

/**
 * ------------
 * Class: Point
 * ------------
 *
 * A static or moving [x, y] coordinate
 */
function Point()
{
	// -- Private: --
	var _ = this;
	var owner = null;
	var position = new Vec2();
	var velocity = new Vec2();

	/**
	 * If the owner entity has a Sprite component,
	 * internally update its [x, y] coordinates
	 */
	function update_sprite()
	{
		if ( owner !== null && owner.has( Sprite ) ) {
			owner.get( Sprite ).setXY( position.x, position.y );
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		position.add( velocity, dt );
		update_sprite();
	}

	this.onAdded = function( entity )
	{
		owner = entity;
	}

	/**
	 * Get the position of the Point, optionally rounded
	 */
	this.getPosition = function( is_rounded )
	{
		return {
			x: ( !!is_rounded ? Math.floor( position.x ) : position.x ),
			y: ( !!is_rounded ? Math.floor( position.y ) : position.y )
		};
	}

	/**
	 * Get the velocity of a moving Point
	 */
	this.getVelocity = function()
	{
		return {
			x: velocity.x,
			y: velocity.y
		};
	}

	/**
	 * Get the velocity's magnitude for a moving Point
	 */
	this.getAbsoluteVelocity = function()
	{
		return velocity.magnitude();
	}

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
	}

	/**
	 * Update the velocity vector of a moving Point,
	 * optionally offsetting from its current position
	 */
	this.setVelocity = function( x, y, is_offset )
	{
		velocity.x = ( is_offset ? velocity.x + x : x );
		velocity.y = ( is_offset ? velocity.y + y : y );
		return _;
	}
}

/**
 * -------------------
 * Class: HardwarePart
 * -------------------
 *
 * A dockable hardware part unit fixed to space station modules
 */
function HardwarePart()
{
	// -- Private: --
	var _ = this;
	var owner = null;
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
		if ( owner !== null && owner.parent !== null ) {
			if ( owner.has( Sprite ) && owner.parent.has( Point ) ) {
				// Get position of the parent station module
				var position = owner.parent.get( Point ).getPosition();

				// Get base [x, y] coordinates of the
				// owner Sprite in local (module) space
				var sprite = owner.get( Sprite );

				// Set the part coordinates as a sum of the two
				x = sprite.x._ + position.x;
				y = sprite.y._ + position.y;
			}
		}
	}

	// -- Public: --
	this.update = function( dt )
	{
		if ( moving ) {
			update_coordinates();
		}
	}

	this.onAdded = function( entity )
	{
		owner = entity;
	}

	this.onOwnerAddedToParent = function()
	{
		update_coordinates();
	}

	/**
	 * Return owner for Point component reference
	 * (see: GameInstance.js, enter_docking_mode())
	 */
	this.getOwner = function()
	{
		return owner;
	}

	/**
	 * Return hardware part position
	 */
	this.getPosition = function()
	{
		return {
			x: x,
			y: y
		};
	}

	/**
	 * Return specifications for this hardware part
	 */
	this.getSpecs = function()
	{
		return specs;
	}

	/**
	 * Set hardware part specifications
	 */
	this.setSpecs = function( _specs )
	{
		specs = _specs;
		return _;
	}

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
	}
}