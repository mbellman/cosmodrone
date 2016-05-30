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
	var FRAME_LOCK = true;
	var MAX_DT = FRAME_TIME / 1000;
	var scenes = {};
	var active_scene = null;
	var running = false;
	var frame;

	/**
	 * Erase all Sprites in the active scene
	 */
	function clear_sprites()
	{
		var cleared = false;
		var bounds;

		scenes[active_scene].forAllComponentsOfType( Sprite, function( sprite ) {
			if ( cleared || sprite.getProperAlpha() === 0 || !sprite.isOnScreen() ) {
				return;
			}

			sprite.erase();
			bounds = sprite.getBoundingBox();

			if ( bounds.x === 0 && bounds.y === 0 && bounds.width === Viewport.width && bounds.height === Viewport.height ) {
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
			if ( !FRAME_LOCK ) {
				var now = Date.now();
				var dt = ( now - time );

				time = now - ( dt % FRAME_TIME );
				dt /= 1000;
				dt = Math.min( dt, MAX_DT );
			} else {
				var dt = FRAME_TIME / 1000;
			}

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