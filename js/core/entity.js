/**
 * A blank template object which can store
 * and manage component/entity instances
 */
function Entity()
{
	// Private:
	var _ = this;
	var components = [];
	var children = [];
	var searched_component = null;

	/**
	 * Depending on [action], either returns the component or
	 * a boolean representing its availability from the entity
	 */
	function component_data(component, action)
	{
		if (action === 'get' && searched_component instanceof component)
		{
			// If a component type specified by get()
			// matches the saved reference, return
			// it immediately without further lookups
			return searched_component;
		}

		for (var c = 0 ; c < components.length ; c++)
		{
			if (components[c] instanceof component)
			{
				// Save the component reference to optimize
				// consecutive same-component lookups
				searched_component = components[c];

				if (action === 'get') return components[c];
				if (action === 'has') return true;
			}
		}

		if (action === 'get') return null;
		if (action === 'has') return false;
	}

	// Public:
	this.parent = null;

	this.update = function(dt)
	{
		// Update all components first
		for (var c = 0 ; c < components.length ; c++)
		{
			components[c].update(dt);
		}

		// Then update all child entities
		for (var c = 0 ; c < children.length ; c++)
		{
			children[c].update(dt);
		}
	}

	this.onAddedToParent = function(entity)
	{
		_.parent = entity;

		for (var c = 0 ; c < components.length ; c++)
		{
			var _component = components[c];

			if (typeof _component.onOwnerAddedToParent === 'function')
			{
				_component.onOwnerAddedToParent();
			}
		}
	}

	this.add = function(component)
	{
		components.push(component);

		if (typeof component.onAdded === 'function')
		{
			component.onAdded(_);
		}

		return _;
	}

	this.addChild = function(entity)
	{
		entity.onAddedToParent(_);
		children.push(entity);
		return _;
	}

	this.disposeChildren = function()
	{
		children.length = 0;
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
		for (var c = 0 ; c < components.length ; c++)
		{
			var _component = components[c];

			if (_component instanceof component)
			{
				if (typeof _component.onRemoved === 'function')
				{
					_component.onRemoved();
				}

				components.splice(c, 1);
				break;
			}
		}

		return _;
	}

	this.forAllComponentsOfType = function(component, handler)
	{
		if (_.has(component))
		{
			handler(_.get(component));
		}

		for (var c = 0 ; c < children.length ; c++)
		{
			children[c].forAllComponentsOfType(component, handler);
		}
	}
}