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

		if (typeof component.setOwner === 'function')
		{
			component.setOwner(_);
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