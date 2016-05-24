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
	var searched_parent_component = null;

	/**
	 * Depending on [action], either returns the component or
	 * a boolean representing its availability from the entity
	 */
	function component_lookup( component, action )
	{
		if ( searched_component instanceof component ) {
			if ( action === 'get' ) return searched_component;
			if ( action === 'has' ) return true;
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

	/**
	 * Test an object's status as a Component
	 */
	function is_component( component )
	{
		return (
			typeof component.owner !== 'undefined' &&
			typeof component.update === 'function' &&
			typeof component.onAdded === 'function' &&
			typeof component.onOwnerAddedToParent === 'function' &&
			typeof component.onRemoved === 'function'
		);
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
	};

	/**
	 * Called when this Entity gets
	 * added as a child to another Entity
	 */
	this.onAddedToParent = function( entity )
	{
		_.parent = entity;

		for ( var c = 0 ; c < components.length ; c++ ) {
			components[c].onOwnerAddedToParent();
		}
	};

	/**
	 * Add a component to the entity by instance
	 */
	this.add = function( component )
	{
		if ( !is_component( component ) ) {
			console.warn('Entity: attempted to add a non-Component instance to entity');
			return;
		}

		component.owner = _;
		component.onAdded();
		components.push( component );
		return _;
	};

	/**
	 * Add a child sub-entity to this entity
	 */
	this.addChild = function( entity )
	{
		entity.onAddedToParent( _ );
		children.push( entity );
		return _;
	};

	/**
	 * Get rid of child entities
	 */
	this.disposeChildren = function()
	{
		for ( var c = 0 ; c < children.length ; c++ ) {
			children[c].forAllComponents( function( component ) {
				component.onRemoved();
			});
		}

		children.length = 0;
		return _;
	};

	/**
	 * Retrieve a Component by instance name
	 */
	this.get = function( component )
	{
		return component_lookup( component, 'get' );
	};

	/**
	 * Retrieves the first available component from
	 * the entity or its children by instance name.
	 */
	this.find = function( component )
	{
		if ( _.has( component ) ) {
			return _.get( component );
		}

		for ( var c = 0 ; c < children.length ; c++ ) {
			var search = children[c].find( component );

			if ( search !== null ) {
				return search;
			}
		}

		return null;
	};

	/**
	 * Retrieve a Component from parent entities by instance
	 * name; returns null if no parents have the Component
	 */
	this.getFromParents = function( component )
	{
		if ( searched_parent_component instanceof component ) {
			return searched_parent_component;
		}

		var parent = _.parent;

		while ( parent !== null ) {
			if ( parent.has( component ) ) {
				searched_parent_component = component;
				return parent.get( component );
			}

			parent = parent.parent;
		}

		return null;
	};

	/**
	 * Returns the [n]th child of the entity if one exists
	 */
	this.getNthChild = function( n )
	{
		return children[n] || null;
	};

	/**
	 * Verify that this Entity has a Component by instance name
	 */
	this.has = function( component )
	{
		return component_lookup( component, 'has' );
	};

	/**
	 * Remove a Component from this Entity by instance name
	 */
	this.remove = function( component )
	{
		for ( var c = 0 ; c < components.length ; c++ ) {
			if ( components[c] instanceof component ) {
				components[c].onRemoved();
				components.splice( c, 1 );
				break;
			}
		}

		return _;
	};

	/**
	 * Run a [handler] operation on all Components of this
	 * Entity, and recursively on its children. [handler]
	 * receives the Component instance as an argument.
	 */
	this.forAllComponents = function( handler )
	{
		for ( var c = 0 ; c < components.length ; c++ ) {
			handler( components[c] );
		}

		for ( var c = 0 ; c < children.length ; c++ ) {
			children[c].forAllComponents( handler );
		}
	};

	/**
	 * Component-selective variant of forAllComponents()
	 */
	this.forAllComponentsOfType = function( component, handler )
	{
		if ( _.has( component ) ) {
			handler( _.get( component ) );
		}

		for ( var c = 0 ; c < children.length ; c++ ) {
			children[c].forAllComponentsOfType( component, handler );
		}
	};

	/**
	 * Run a [handler] operation on direct descendant child entities
	 */
	this.forDirectChildren = function( handler )
	{
		for ( var c = 0 ; c < children.length ; c++ ) {
			handler( children[c] );
		}
	};
}