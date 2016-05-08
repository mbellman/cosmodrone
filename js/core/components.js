/**
 * A sprite to be rendered onto [screen.game]
 */
function Sprite(source)
{
	// Private:
	var _ = this;
	var target;

	// Public:
	this.x = 0;
	this.y = 0;
	this.scale = 1;
	this.alpha = 1;

	this.update = function(dt)
	{
		var draw =
		{
			x: _.x - (!!target ? target.getPosition().x : 0),
			y: _.y - (!!target ? target.getPosition().y : 0)
		};

		// Avoid drawing objects offscreen
		if (draw.x > viewport.width || draw.x + source.width < 0) return;
		if (draw.y > viewport.height || draw.y + source.height < 0) return;

		screen.game.setGlobalAlpha(_.alpha);
		screen.game.draw.image(source, draw.x, draw.y, source.width * _.scale, source.height * _.scale);
	}

	this.setXY = function(x, y)
	{
		_.x = x;
		_.y = y;
		return _;
	}

	this.follow = function(_target)
	{
		target = _target;
		return _;
	}

	this.setAlpha = function(alpha)
	{
		_.alpha = alpha;
		return _;
	}
}

/**
 * A drifting [x, y] coordinate
 */
function MovingPoint()
{
	// Private:
	var _ = this;
	var owner = null;
	var position = new Vec2();
	var velocity = new Vec2();

	/**
	 * Method for updating the Sprite coordinates
	 * of the owner entity where applicable
	 */
	function update_sprite()
	{
		if (owner !== null)
		{
			var sprite = owner.get(Sprite);

			if (sprite !== null)
			{
				sprite.setXY(position.x, position.y);
			}
		}
	}

	// Public:
	this.update = function(dt)
	{
		position.add(velocity, dt);
		update_sprite();
	}

	this.getPosition = function(round)
	{
		return {
			x: (!!round ? Math.floor(position.x) : position.x),
			y: (!!round ? Math.floor(position.y) : position.y)
		};
	}

	this.getVelocity = function()
	{
		return {
			x: velocity.x,
			y: velocity.y
		};
	}

	this.getAbsoluteVelocity = function()
	{
		return velocity.magnitude();
	}

	this.setPosition = function(x, y, is_modifier)
	{
		position.x = (is_modifier ? position.x+x : x);
		position.y = (is_modifier ? position.y+y : y);

		update_sprite();

		return _;
	}

	this.setVelocity = function(x, y, is_modifier)
	{
		velocity.x = (is_modifier ? velocity.x+x : x);
		velocity.y = (is_modifier ? velocity.y+y : y);
		return _;
	}

	this.setOwner = function(entity)
	{
		owner = entity;
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

	this.getType = function()
	{
		return type;
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

	this.getSpeed = function()
	{
		return 3;
	}
}