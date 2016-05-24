/**
 * ----------------
 * Class: Component
 * ----------------
 *
 * A self-regulating logic module which can be added to entities
 */
function Component()
{
	/**
	 * The component's owner entity
	 */
	this.owner = null;

	/**
	 * Component update cycle, using [dt] as a timestep in seconds
	 */
	this.update = function( dt ) {};

	/**
	 * Component added to entity handler
	 */
	this.onAdded = function() {};

	/**
	 * Component owner added to parent entity handler
	 */
	this.onOwnerAddedToParent = function() {};

	/**
	 * Component removed from owner handler
	 */
	this.onRemoved = function() {};
}