/**
 * -------------
 * Class: Entity
 * -------------
 *
 * A blank template object which can store
 * and manage component/entity instances
 */
function Entity()
{
	// -- Private: --
	var _ = this;
	var components = [];
	var children = [];
	var searched_component = null;

	/**
	 * Depending on [action], either returns the component or
	 * a boolean representing its availability from the entity
	 */
	function component_lookup( component, action )
	{
		if ( action === 'get' && searched_component instanceof component ) {
			// If a component type specified by get()
			// matches the saved reference, return
			// it immediately without further lookups
			return searched_component;
		}

		for ( var c = 0 ; c < components.length ; c++ ) {
			if ( components[c] instanceof component ) {
				// Save the component reference to optimize
				// consecutive same-component lookups
				searched_component = components[c];

				if ( action === 'get' ) return components[c];
				if ( action === 'has' ) return true;
			}
		}

		if ( action === 'get' ) return null;
		if ( action === 'has' ) return false;
	}

	// -- Public: --
	this.parent = null;

	/**
	 * Update cycle
	 */
	this.update = function( dt )
	{
		for ( var c = 0 ; c < components.length ; c++ ) {
			components[c].update(dt);
		}

		for ( var c = 0 ; c < children.length ; c++ ) {
			children[c].update(dt);
		}
	}

	/**
	 * Called when this Entity gets
	 * added as a child to another Entity
	 */
	this.onAddedToParent = function( entity )
	{
		_.parent = entity;

		for ( var c = 0 ; c < components.length ; c++ ) {
			var _component = components[c];

			if (typeof _component.onOwnerAddedToParent === 'function') {
				_component.onOwnerAddedToParent();
			}
		}
	}

	/**
	 * Add a Component to the Entity by instance
	 */
	this.add = function( component )
	{
		components.push( component );

		if ( typeof component.onAdded === 'function' ) {
			component.onAdded(_);
		}

		return _;
	}

	/**
	 * Add a child Entity to the Entity
	 */
	this.addChild = function( entity )
	{
		entity.onAddedToParent( _ );
		children.push( entity );
		return _;
	}

	/**
	 * Get rid of child entities
	 */
	this.disposeChildren = function()
	{
		children.length = 0;
		return _;
	}

	/**
	 * Retrieve a Component by instance name
	 */
	this.get = function( component )
	{
		return component_lookup( component, 'get' );
	}

	/**
	 * Verify that this Entity has a Component by instance name
	 */
	this.has = function( component )
	{
		return component_lookup( component, 'has' );
	}

	/**
	 * Remove a Component from this Entity by instance name
	 */
	this.remove = function( component )
	{
		for ( var c = 0 ; c < components.length ; c++ ) {
			var _component = components[c];

			if ( _component instanceof component ) {
				if ( typeof _component.onRemoved === 'function' ) {
					_component.onRemoved();
				}

				components.splice( c, 1 );
				break;
			}
		}

		return _;
	}

	/**
	 * Recursively look for all instances of a Component
	 * in the entity and its children, and run a [handler]
	 * routine for all of them. [handler] automatically
	 * receives the Component instance as an argument.
	 */
	this.forAllComponentsOfType = function( component, handler )
	{
		if ( _.has( component ) ) {
			handler( _.get( component ) );
		}

		for ( var c = 0 ; c < children.length ; c++ ) {
			children[c].forAllComponentsOfType( component, handler );
		}
	}
}