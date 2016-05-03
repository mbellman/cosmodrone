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
	var type = 0;

	// Public:
	this.update = function(dt){}

	this.getType = function()
	{
		return type;
	}

	this.setType = function(_type)
	{
		type = _type;
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