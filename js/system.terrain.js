/**
 * Generates and prerenders terrain for the game's graphics
 */
function Terrain() {
	// Private:
	var _ = this;
	var tilesize;
	var heightmap;
	var tempmap;
	var lightangle = 'sw';
	var color = {
		presets: {
			beach: {r: 230, g: 210, b: 100},
			reef: {r: 30, g: 170, b: 180}
		},
		elevation: {
			red: function(v) {
				if (v < 40) return 0;
				if (v <= 46) return 180 - 2*v;
				if (v <= 65) return 80-v;
				if (v <= 80) return 120-v;
				return 120+v;
			},
			green: function(v) {
				if (v < 40) return 80+v;
				if (v <= 46) return 180-v;
				if (v <= 65) return 10 + Math.round(2*v);
				if (v <= 80) return v;
				return 100+v;
			},
			blue: function(v) {
				if (v < 40) return 175+v;
				if (v <= 46) return 66-v;
				if (v <= 65) return Math.round(0.6*v);
				if (v <= 80) return Math.round(v/4);
				return 120+v;
			}
		},
		temperature: {
			red: function(v) {
				return -75 + Math.round(1.5*v);
			},
			green: function(v) {
				if (v > 30) return -10;
				return -75 + 2*v;
			},
			blue: function(v) {
				if (v > 30) return 5;
				return Math.round(v/10);
			}
		}
	};

	function sunlit(y, x) {
		var elevation = heightmap.tile(y, x);
		var direction = {
			n: {y: -1, x: 0},
			s: {y: 1, x: 0},
			e: {y: 0, x: 1},
			w: {y: 0, x: -1},
			nw: {y: -1, x: -1},
			ne: {y: -1, x: 1},
			sw: {y: 1, x: -1},
			se: {y: 1, x: 1}
		};
		var ydir = direction[lightangle].y;
		var xdir = direction[lightangle].x;
		for (var i = 0 ; i < 10 ; i++) {
			var tile = heightmap.tile(y + ydir*i, x + xdir*i);
			if (tile > elevation+i) {
				return false;
			}
		}
		return true;
	}

	function tilecolor(y, x) {
		var e = heightmap.tile(y, x);
		var t = tempmap.tile(y, x);
		var sun = (e > 40 && sunlit(y, x));
		return {
			r: color.elevation.red(e) + (e < 80 ? color.temperature.red(t) : 0) + (sun ? 0 : -60),
			g: color.elevation.green(e) + (e < 80 ? color.temperature.green(t) : 0) + (sun ? 0 : -80),
			b: color.elevation.blue(e) + (e < 80 ? color.temperature.blue(t) : 0) + (sun ? 0 : -20)
		};
	}

	function rgb(r, g, b) {
		return 'rgb('+r+','+g+','+b+')';
	}

	function render() {
		heightmap.scan(function(y, x, elevation){
			var hue = tilecolor(y, x);

			if (heightmap.justAbove(y, x, 40)) {
				hue = color.presets.beach;
			} else
			if (heightmap.justBelow(y, x, 40)) {
				hue = color.presets.reef;
			}

			canvas.draw.rectangle(x*tilesize, y*tilesize, tilesize, tilesize).fill(rgb(hue.r, hue.g, hue.b));
		});
	}

	// Public:
	this.prerender;

	this.setTileSize = function(size) {
		tilesize = size;
		canvas.setSize(tilesize*heightmap.size(), tilesize*heightmap.size());
		return _;
	}

	this.build = function(settings) {
		heightmap = new HeightMap();
		heightmap.generate(settings);
		tempmap = new HeightMap();
		tempmap.generate({
			iterations: settings.iterations,
			elevation: 100,
			smoothness: 6,
			repeat: true
		});
		canvas = new Canvas(document.createElement('canvas'));
		_.prerender = canvas.element();
		return _;
	}

	this.render = function() {
		render();
		return _;
	}

	this.size = function() {
		return heightmap.size();
	}

	this.tileSize = function() {
		return tilesize;
	}
}