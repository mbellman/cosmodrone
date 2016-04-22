function GameInstance() {
	// Private:
	var _ = this;
	var frametime = 1000 / 60;
	var time;
	var active = false;
	var running = true;
	var level = 1;
	var map;
	var tilesize = 3;
	var prerender;
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

	function red(elevation) {
		if (elevation > 40) {
			if (elevation > 80) {
				return 155 + elevation;
			} else
			if (elevation > 46) {
				return 80 - elevation;
			} else {
				return 220 - elevation;
			}
		}
		return 0;
	}

	function green(elevation) {
		if (elevation > 40) {
			if (elevation > 80) {
				return 100 + elevation;
			} else
			if (elevation > 46) {
				return 25 + Math.round(2.5*elevation);
			} else {
				return 215 - elevation;
			}
		}
		return elevation;
	}

	function blue(elevation) {
		if (elevation > 40) {
			if (elevation > 80) {
				return 155 + elevation;
			} else
			if (elevation > 46) {
				return Math.round(elevation * 0.6);
			} else {
				return 120 - elevation;
			}
		}
		return 135 + 3*elevation;
	}

	function tilecolor(elevation) {
		return {
			r: red(elevation),
			g: green(elevation),
			b: blue(elevation)
		};
	}

	function rgb(r, g, b) {
		return 'rgb('+r+','+g+','+b+')';
	}

	function drawtile(x, y, size, color) {
		screen.draw.rectangle(x, y, size, size).fill(rgb(color.r, color.g, color.b));
	}

	function renderBG() {
		var mapsize = map.size();
		var bgtx = mod(Math.floor(bgcamera.position().x / tilesize), mapsize);
		var bgty = mod(Math.floor(bgcamera.position().y / tilesize), mapsize);
		var tile = {x: 0, y: 0};
		var tilestodraw = {x: Math.ceil(viewport.width/tilesize) + 2, y: Math.ceil(viewport.height/tilesize) + 2};
		var offset = {x: tilesize - mod(bgcamera.position().x, tilesize), y: tilesize - mod(bgcamera.position().y, tilesize)};

		var renders = 0;

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

			screen.draw.image(prerender.element(), clip.x, clip.y, clip.width, clip.height, draw.x, draw.y, clip.width, clip.height);

			tile.x += clip.width/tilesize;
			if (tile.x >= tilestodraw.x) {
				tile.y += clip.height/tilesize;
				if (tile.y < tilestodraw.y){
					tile.x = 0;
				}
			}

			renders++;
		}

		Debug.print('Renders: ', renders);
	}

	function prerenderMap() {
		prerender = new Canvas(document.getElementById('prerender')).setSize(tilesize*map.size(), tilesize*map.size());
		map.scan(function(y, x, elevation){
			if (map.justabove(y, x, 40)) {
				var color = {r: 250, g: 220, b: 120};
			} else
			if (map.justbelow(y, x, 40)) {
				var color = {r: 75, g: 180, b: 230};
			} else {
				var color = tilecolor(elevation);
			}
			prerender.draw.rectangle(tilesize*x, tilesize*y, tilesize, tilesize).fill(rgb(color.r, color.g, color.b));
		});
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
		map = new HeightMap();
		map.generate({
			iterations: 9,
			elevation: 100,
			smoothness: 6,
			concentration: 50,
			repeat: true
		});

		prerenderMap();

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