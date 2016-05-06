/**
 * A sprite to be rendered on the game screen
 */
function Sprite()
{

}

/**
 * A drifting [x, y] coordinate
 */
function MovingPoint()
{
	// Private:
	var _ = this;
	var position = new Vec2();
	var velocity = new Vec2();

	// Public:
	this.update = function(dt)
	{
		position.add(velocity, dt);
	}

	this.getPosition = function(round)
	{
		return {
			x: (!!round ? Math.floor(position.x) : position.x),
			y: (!!round ? Math.floor(position.y) : position.y)
		};
	}

	this.setPosition = function(x, y)
	{
		position.x = x;
		position.y = y;
		return _;
	}

	this.setVelocity = function(x, y)
	{
		velocity.x = x;
		velocity.y = y;
		return _;
	}
}

/**
 * Clouds above the terrain layer
 */
function Cloud()
{
	// Private:
	var _ = this;
	var image;
	var shadow;
	var type;

	// Public:
	this.update = function(dt){}

	this.getImage = function()
	{
		return image;
	}

	this.getShadow = function()
	{
		return shadow;
	}

	this.setImage = function(_image)
	{
		image = _image;
		return _;
	}

	this.setShadow = function(_shadow)
	{
		shadow = _shadow;
		return _;
	}
}

/**
 * The player drone
 */
function Drone()
{
	// Private:
	var _ = this;

	// Public:
	this.update = function(dt)
	{

	}
}