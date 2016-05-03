/**
 * A blank template object which can store
 * and manage multiple component instances
 */
function Entity()
{
	// Private:
	var _ = this;
	var components = [];

	/**
	 * Depending on [action], either returns the component or
	 * a boolean representing its availability from the entity
	 */
	function component_data(component, action)
	{
		for (var c = 0 ; c < components.length ; c++)
		{
			if (components[c] instanceof component)
			{
				if (action === 'get') return components[c];
				if (action === 'has') return true;
			}
		}

		if (action === 'get') return null;
		if (action === 'has') return false;
	}

	// Public:
	this.add = function(component)
	{
		components.push(component);

		if (typeof component.onAdded === 'function')
		{
			component.onAdded();
		}

		return _;
	}

	this.get = function(component)
	{
		return component_data(component, 'get');
	}

	this.has = function(component)
	{
		return component_data(component, 'has');
	}

	this.remove = function(component)
	{
		var c = 0;

		while (c < components.length)
		{
			var _component = components[c];

			if (_component instanceof component)
			{
				if (typeof _component.onRemoved === 'function')
				{
					_component.onRemoved();
				}

				components.splice(c, 1);
				continue;
			}

			c++;
		}

		return _;
	}

	this.update = function(dt)
	{
		for (var c = 0 ; c < components.length ; c++)
		{
			components[c].update(dt);
		}
	}
}

/**
 * A sprite to be rendered on the game screen
 */
function GameSprite()
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
	this.getPosition = function()
	{
		return {
			x: position.x,
			y: position.y
		};
	}

	this.setVelocity = function(x, y)
	{
		velocity.x = x;
		velocity.y = y;
		return _;
	}

	this.setPosition = function(x, y)
	{
		position.x = x;
		position.y = y;
		return _;
	}

	this.update = function(dt)
	{
		position.add(velocity, dt);
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
	this.getType = function()
	{
		return type;
	}

	this.setType = function(_type)
	{
		type = _type;
		return _;
	}

	this.update = function(dt){}
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