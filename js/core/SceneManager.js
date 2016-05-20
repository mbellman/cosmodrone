/**
 * Manager for the various game scenes
 */
function SceneManager()
{
	// Private:
	var _ = this;
	var time;
	var max_dt = Math.round(1000/60) / 1000;
	var scenes = {};
	var active_scene = null;
	var running = false;

	/**
	 * Iterate over all Sprites in the active scene and
	 * clear the screen at their drawn coordinates
	 */
	function clear_sprites()
	{
		var position, width, height, buffer, box = {};
		var cleared = false;

		scenes[active_scene].forAllComponentsOfType(Sprite, function(sprite)
		{
			if (cleared)
			{
				// Whole screen area already cleared;
				// skip the remaining clear operations
				return;
			}

			// Get rendering information about the Sprite
			position = sprite.getScreenCoordinates();
			width = sprite.scale._ * sprite.getWidth();
			height = sprite.scale._ * sprite.getHeight();

			// Only clear screen around visible Sprites
			if (
				(position.x < viewport.width && position.x + width > 0) &&
				(position.y < viewport.height && position.y + height > 0)
			)
			{
				if (sprite.rotation._ > 0)
				{
					// Clear more space surrounding the sprite
					// if it is rotated to ensure proper erasure
					buffer = Math.max(width, height);
				}
				else
				{
					if (sprite.snap) buffer = 0;
					else buffer = 1;
				}

				// Constrain the clear rectangle to the screen's boundaries
				box.x = Math.max(position.x - buffer, 0);
				box.y = Math.max(position.y - buffer, 0);
				box.width = Math.min(width + 2*buffer, viewport.width);
				box.height = Math.min(height + 2*buffer, viewport.height);

				screen.game.clear(box.x, box.y, box.width, box.height);

				if (box.x === 0 && box.y === 0 && box.width === viewport.width && box.height === viewport.height)
				{
					// Last clear region took up whole screen
					// area, so no need to clear any more sprites
					cleared = true;
				}
			}
		});
	}

	/**
	 * Update cycle
	 */
	function loop()
	{
		if (running)
		{
			var new_time = Date.now();
			var dt = Math.min((new_time - time) / 1000, max_dt);

			time = Date.now();

			clear_sprites();
			scenes[active_scene].update(dt);

			requestAnimationFrame(loop);
		}
	}

	// Public:
	this.addScene = function(name, entity)
	{
		scenes[name] = entity;
		return _;
	}

	this.hasScene = function(name)
	{
		return (scenes.hasOwnProperty(name));
	}

	this.getScene = function(name)
	{
		return scenes[name];
	}

	this.removeScene = function(name)
	{
		delete scenes[name];
		return _;
	}

	this.setActiveScene = function(name, entity)
	{
		if (entity !== null)
		{
			_.addScene(name, entity);
		}

		if (scenes.hasOwnProperty(name))
		{
			active_scene = name;
			screen.game.clear();

			if (!running)
			{
				// Start update cycle for the first time
				_.resume();
			}
		}

		return _;
	}

	this.pause = function()
	{
		running = false;
		return _;
	}

	this.resume = function()
	{
		if (running || !scenes.hasOwnProperty(active_scene))
		{
			// Already running *or* no active scene to resume
			return;
		}

		time = Date.now();
		running = true;

		loop();
		return _;
	}
}