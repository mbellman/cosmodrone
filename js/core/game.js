function GameInstance(assets)
{
	// Private:

	var _ = this;
	// Framerate/dt variables
	var frametime = 1000 / 60;
	var time;
	// Loop state variables
	var active = false;
	var running = true;
	var loaded = false;
	// Game variables
	var level = 1;
	// Core game objects
	var camera;
	var drone;
	// Entity list
	var entities = [];

	// --------------------------------------- //
	// ------------- Update loop ------------- //
	// --------------------------------------- //

	function update(dt)
	{
		for (var e = 0 ; e < entities.length ; e++)
		{
			entities[e].update(dt);
		}
	}

	function render()
	{
		for (var e = 0 ; e < entities.length ; e++)
		{
			if (entities[e].has(Sprite))
			{
				// TODO: Render the entity using its Sprite
				// coordinates offset by [camera]
			}
		}
	}

	function loop()
	{
		if (active)
		{
			if (running && loaded)
			{
				var new_time = Date.now();
				var dt = (new_time - time) / 1000;

				update(dt);
				render();

				time = new_time;
			}

			setTimeout(loop, frametime);
		}
	}

	// ------------------------------------------ //
	// ------------- Initialization ------------- //
	// ------------------------------------------ //

	/**
	 * Finish initialization and start game
	 */
	function start()
	{
		camera = new MovingPoint();
		drone = new Drone();

		entities.push(new Entity().add(camera));
		entities.push(new Entity().add(drone));

		loaded = true;
	}

	/**
	 * Sets up a scrolling planetary background
	 */
	function add_planet_background()
	{
		var t = Date.now();

		entities.push(new Entity().add(
			new Background(assets)
			.configure(
				{
					iterations: 11,
					elevation: 200,
					concentration: 35,
					smoothness: 8,
					repeat: true,
					cities: 200,
					maxCitySize: 30,
					tileSize: 2,
					lightAngle: 220,
					hours: [12, 19, 20, 0, 4, 6],
					cycleSpeed: 60000,
					scrollSpeed:
					{
						x: -10,
						y: -2
					},
					pixelSnapping: false
				}
			)
			.build(
				{
					progress: function(rendered, total)
					{
						console.log('Prerendering terrain...' + rendered + '/' + total + '...');
					},
					complete: function()
					{
						console.log('Total init time: ' + (Date.now() - t) + 'ms');
						start();
					}
				}
			)
		));
	}

	// Public:
	this.init = function()
	{
		add_planet_background();
		return _;
	}

	this.start = function()
	{
		if (!active)
		{
			active = true;
			time = Date.now();
			loop();
		}

		if (!running)
		{
			running = true;
		}

		return _;
	}

	this.stop = function()
	{
		active = false;
	}

	this.pause = function()
	{
		running = false;
	}
}