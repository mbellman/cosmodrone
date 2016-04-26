function GameInstance() {
	// Private:

	var _ = this;
	// Framerate/dt variables
	var frametime = 1000 / 60;
	var time;
	// Loop state variables
	var active = false;
	var running = true;
	// Game variables
	var level = 1;
	// Core objects
	var terrain;
	var terrains = [];
	var bgcamera;
	var camera;
	var drone;
	// System state variables
	var evening = true;
	var frontbg = 0;
	var activeterrain = 0;

	// ------------- Handy routines -------------- //

	/**
	 * Negative-friendly modulus operation
	 */
	function mod(n, m) {
		return ((n%m)+m)%m;
	}

	/**
	 * Keep a value within a certain range
	 */
	function clamp(value, min, max) {
		return (value > max ? max : (value < min ? min : value));
	}

	/**
	 * Returns 0 if 1 and vice versa
	 */
	function bit_flip(bit) {
		return !bit ? 1 : 0;
	}

	/**
	 * Cycles a smaller-than-zero value back to max
	 */
	function cycle_forward(value, max) {
		return (value < 0 ? max : value);
	}

	/**
	 * Cycles a larger-than-max value back to 0
	 */
	function cycle_back(value, max) {
		return (value > max ? 0 : value);
	}

	var Debug = {
		print: function() {
			var string = '';
			for (var arg in arguments) {
				string += arguments[arg];
			}
			$('.debug').html(string);
		},
		log: function(text) {
			console.log(text);
		}
	};

	// ------------- Game-specific classes and objects -------------- //

	/**
	 * A controllable camera instance
	 */
	function Camera() {
		// Private:
		var _ = this;
		var position = new Vec2();
		var velocity = new Vec2();

		// Public:
		this.position = function() {
			return {
				x: position.x,
				y: position.y
			};
		}

		this.setVelocity = function(x, y) {
			velocity.x = x;
			velocity.y = y;
			return _;
		}

		this.update = function(dt) {
			position.add(velocity, dt);
		}
	}

	/**
	 * The player drone
	 */
	function Drone() {

	}

	// ------------- Environmental/ambient effects -------------- //

	/**
	 * Prerender variants of the terrain to reflect midday, sunset, early evening, and night
	 */
	function prerender_terrains() {
		var t = Date.now();
		[12, 19, 20, 0].forEach(function(h, i){
			terrain.setTime(h);
			terrains.push(new Canvas(document.createElement('canvas')).setSize(terrain.size(), terrain.size()));
			terrains[i].draw.image(terrain.canvas);
		});
		console.log((Date.now() - t) + 'ms prerender');
	}

	/**
	 * Places a new time-of-day background in
	 * front with opacity 0 and fades it in
	 */
	function fade_bg() {
		frontbg = bit_flip(frontbg);

		if (evening) {
			if (++activeterrain > terrains.length-1) {
				evening = false;
				activeterrain--;
			}
		} else {
			if (--activeterrain < 0) {
				evening = true;
				activeterrain++;
			}
		}

		var newbg = 'bg' + frontbg;
		var oldbg = 'bg' + bit_flip(frontbg);

		$(screen[oldbg].element()).css('z-index', '1');
		$(screen[newbg].element()).css({
			'opacity' : '0',
			'z-index' : '2'
		}).animate({opacity: 1}, {duration: 6000, easing: 'linear', complete: fade_bg});
	}

	// ------------- Graphics rendering -------------- //

	/**
	 * Draw prerendered terrain
	 */
	function render_bg() {
		var mapsize = terrain.size();
		var tilesize = terrain.tileSize();
		// Current tile the background camera is on
		var bgtile = {
			x: mod(Math.floor(bgcamera.position().x / tilesize), mapsize),
			y: mod(Math.floor(bgcamera.position().y / tilesize), mapsize)
		};
		// Current tile offset 'pointer'
		var tile = {
			x: 0,
			y: 0
		};
		// Tiles needed for screen coverage
		var tilestodraw = {
			x: Math.ceil(viewport.width/tilesize) + 2,
			y: Math.ceil(viewport.height/tilesize) + 2
		};
		// Sub-tile offset based on the background camera's pixel position
		var pixeloffset = {
			x: tilesize - mod(bgcamera.position().x, tilesize),
			y: tilesize - mod(bgcamera.position().y, tilesize)
		};
		// Information for time-of-day rendering sources/targets
		var newbg = 'bg' + frontbg;
		var oldbg = 'bg' + bit_flip(frontbg);
		var terrainbefore = clamp((evening ? activeterrain-1 : activeterrain+1), 0, terrains.length-1);
		var newterrain = terrains[activeterrain].element();
		var oldterrain = terrains[terrainbefore].element();

		while (tile.x < tilestodraw.x || tile.y < tilestodraw.y) {
			// Remaining tiles on the map from the tile.x/tile.y offset
			var maplimit = {
				x: mapsize - ((tile.x + bgtile.x) % mapsize),
				y: mapsize - ((tile.y + bgtile.y) % mapsize)
			};
			// Remaining tiles needed to fill the screen
			var screenlimit = {
				x: tilestodraw.x - tile.x,
				y: tilestodraw.y - tile.y
			};
			// Position to draw the next map chunk at
			var draw = {
				x: Math.floor(tile.x*tilesize + pixeloffset.x - tilesize),
				y: Math.floor(tile.y*tilesize + pixeloffset.y - tilesize)
			};
			// Clipping parameters for next map chunk
			var clip = {
				x: tilesize * ((tile.x + bgtile.x) % mapsize),
				y: tilesize * ((tile.y + bgtile.y) % mapsize),
				width: tilesize * Math.min(maplimit.x, screenlimit.x),
				height: tilesize * Math.min(maplimit.y, screenlimit.y)
			};

			// Draw the map chunk
			screen[newbg].draw.image(newterrain, clip.x, clip.y, clip.width, clip.height, draw.x, draw.y, clip.width, clip.height);
			screen[oldbg].draw.image(oldterrain, clip.x, clip.y, clip.width, clip.height, draw.x, draw.y, clip.width, clip.height);

			// Advance the tile 'pointer' to determine
			// what and where to draw on the next cycle
			tile.x += clip.width/tilesize;
			if (tile.x >= tilestodraw.x) {
				tile.y += clip.height/tilesize;
				if (tile.y < tilestodraw.y){
					tile.x = 0;
				}
			}
		}
	}

	// ------------- Update loop -------------- //

	function update(dt) {
		bgcamera.update(dt);
	}

	function render() {
		screen.bg1.clear();
		render_bg();
	}

	function loop() {
		if (active) {
			if (running) {
				var newtime = Date.now();
				var dt = (newtime - time) / 1000;

				update(dt);
				render();

				time = newtime;
			}

			setTimeout(loop, frametime);
		}
	}

	// Public:
	this.init = function() {
		// Base terrain
		terrain = new Terrain()
		.build({
			iterations: 11,
			elevation: 200,
			concentration: 35,
			smoothness: 6,
			repeat: true
		})
		.setLightSource('sw')
		.setTileSize(1)
		.render()
		.setTime(12);

		// Terrain lit at different times of day
		prerender_terrains();

		bgcamera = new Camera().setVelocity(20, 2);
		camera = new Camera();
		drone = new Drone();

		return _;
	}

	this.start = function() {
		if (!active) {
			active = true;
			time = Date.now();
			loop();
			fade_bg();
		}

		if (!running) {
			running = true;
		}

		return _;
	}

	this.stop = function() {
		active = false;
	}

	this.pause = function() {
		running = false;
	}
}