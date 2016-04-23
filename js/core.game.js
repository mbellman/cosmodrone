function GameInstance() {
	// Private:
	var _ = this;
	var frametime = 1000 / 60;
	var time;
	var active = false;
	var running = true;
	var level = 1;
	var terrain;
	var bgcamera;
	var camera;
	var drone;

	// ------------- Handy routines -------------- //

	function mod(n, m) {
		return ((n%m)+m)%m;
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

	// ------------- Graphics rendering -------------- //

	function renderBG() {
		var mapsize = terrain.size();
		var tilesize = terrain.tileSize();
		// Background camera coordinates in tile space
		var bgtx = mod(Math.floor(bgcamera.position().x / tilesize), mapsize);
		var bgty = mod(Math.floor(bgcamera.position().y / tilesize), mapsize);
		// Chunk 'pointer'
		var tile = {x: 0, y: 0};
		// Threshold for screen coverage
		var tilestodraw = {x: Math.ceil(viewport.width/tilesize) + 2, y: Math.ceil(viewport.height/tilesize) + 2};
		// Sub-tile offset based on the background camera's pixel position
		var offset = {x: tilesize - mod(bgcamera.position().x, tilesize), y: tilesize - mod(bgcamera.position().y, tilesize)};

		while (tile.x < tilestodraw.x || tile.y < tilestodraw.y) {
			// Remaining tiles on the map from tile.x/tile.y offset
			var remaining = {x: mapsize - ((tile.x + bgtx)%mapsize), y: mapsize - ((tile.y + bgty)%mapsize)};
			// Remaining tiles needed to fill the screen
			var empty = {x: tilestodraw.x - tile.x, y: tilestodraw.y - tile.y};
			// Position to draw the next image chunk at
			var draw = {x: Math.floor(tile.x*tilesize + offset.x - tilesize), y: Math.floor(tile.y*tilesize + offset.y - tilesize)};
			// Clipping parameters for next chunk
			var clip = {
				x: tilesize*mod(tile.x + bgtx, mapsize),
				y: tilesize*mod(tile.y + bgty, mapsize),
				width: tilesize*Math.min(remaining.x, empty.x),
				height: tilesize*Math.min(remaining.y, empty.y)
			};

			// Draw the chunk
			screen.draw.image(terrain.prerender, clip.x, clip.y, clip.width, clip.height, draw.x, draw.y, clip.width, clip.height);

			// Advance the chunk 'pointer' to determine what and where to draw on the next cycle
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
		screen.clear();
		renderBG();
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
		terrain = new Terrain().build({
			iterations: 9,
			elevation: 100,
			concentration: 30,
			smoothness: 2,
			repeat: true
		}).setTileSize(2).render();

		bgcamera = new Camera().setVelocity(30, 6);
		camera = new Camera();
		drone = new Drone();

		return _;
	}

	this.start = function() {
		if (!active) {
			active = true;
			time = Date.now();
			loop();
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