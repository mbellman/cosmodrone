/**
 * -------------------
 * Class: SceneManager
 * -------------------
 *
 * Resource for switching/updating the various game scenes
 */
function SceneManager()
{
	// -- Private: --
	var _ = this;
	var time;
	var FRAME_TIME = 1000 / 60;
	var MAX_DT = FRAME_TIME / 1000;
	var scenes = {};
	var active_scene = null;
	var running = false;
	var frame;

	/**
	 * Iterate over all Sprites in the active scene and
	 * clear the screen at their drawn coordinates
	 */
	function clear_sprites()
	{
		var cleared = false;
		var position, width, height, padding, box = {};

		scenes[active_scene].forAllComponentsOfType( Sprite, function( sprite ) {
			if ( cleared || sprite.getProperAlpha() === 0 || !sprite.isOnScreen() ) {
				return;
			}

			position = sprite.getScreenCoordinates();
			width = sprite.scale._ * sprite.getWidth();
			height = sprite.scale._ * sprite.getHeight();

			if ( sprite.rotation._ > 0 ) {
				// Widen the clear zone around rotated Sprites
				padding = Math.max( width, height );
			} else {
				padding = ( sprite.snap ? 0 : 1 );
			}

			// Constrain the clear rectangle to the screen's boundaries
			box.x = Math.max( position.x - padding, 0 );
			box.y = Math.max( position.y - padding, 0 );
			box.width = Math.min( width + 2 * padding, Viewport.width );
			box.height = Math.min( height + 2 * padding, Viewport.height );

			screen.game.clear( box.x, box.y, box.width, box.height );

			if ( box.x === 0 && box.y === 0 && box.width === Viewport.width && box.height === Viewport.height ) {
				// Last clear region took up whole screen
				// area, so no need to clear any more sprites
				cleared = true;
			}
		} );
	}

	/**
	 * Update cycle
	 */
	function loop()
	{
		if ( running ) {
			var now = Date.now();
			var dt = ( now - time );

			time = now - ( dt % FRAME_TIME );
			dt /= 1000;
			dt = Math.min( dt, MAX_DT );

			clear_sprites();
			scenes[active_scene].update( dt );

			frame = requestAnimationFrame( loop );
		}
	}

	// -- Public: --
	/**
	 * Add a new scene Entity to the list
	 */
	this.addScene = function( name, entity )
	{
		scenes[name] = entity;
		return _;
	};

	/**
	 * Determine whether a scene exists by [name]
	 */
	this.hasScene = function( name )
	{
		return scenes.hasOwnProperty( name );
	};

	/**
	 * Retrieve a scene by [name]
	 */
	this.getScene = function( name )
	{
		return scenes[name];
	};

	/**
	 * Remove a scene by [name]
	 */
	this.removeScene = function( name )
	{
		delete scenes[name];
		return _;
	};

	/**
	 * Set the active scene by [name],
	 * optionally as a new [entity]
	 */
	this.setActiveScene = function( name, entity )
	{
		if ( entity !== null ) {
			_.addScene( name, entity );
		}

		if ( scenes.hasOwnProperty( name ) ) {
			active_scene = name;
			screen.game.clear();

			if ( !running ) {
				_.resume();
			}
		}

		return _;
	};

	/**
	 * Pause the update loop
	 */
	this.pause = function()
	{
		running = false;
		cancelAnimationFrame( frame );
		return _;
	};

	/**
	 * Resume the update loop
	 */
	this.resume = function()
	{
		if ( running || !scenes.hasOwnProperty( active_scene ) ) {
			return;
		}

		time = Date.now();
		running = true;

		loop();
		return _;
	};
}