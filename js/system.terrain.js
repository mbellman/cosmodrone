/**
 * Generates and prerenders terrain for the game's graphics
 */
function Terrain() {
	// Private:
	var _ = this;
	var tilesize;
	var map;
	var canvas;
	var color = {
		presets: {
			beach: {r: 250, g: 220, b: 120},
			reef: {r: 75, g: 180, b: 230}
		},
		elevation: {
			red: function(v) {
				if (v < 40) return 0;
				if (v <= 46) return 220-v;
				if (v <= 80) return 80-v;
				return 155+v;
			},
			green: function(v) {
				if (v < 40) return v;
				if (v <= 46) return 215-v;
				if (v <= 80) return 25 + Math.round(2.5*v);
				return 100+v;
			},
			blue: function(v) {
				if (v < 40) return 135 + 3*v;
				if (v <= 46) return 120-v;
				if (v <= 80) return Math.round(v*0.6);
				return 155+v;
			}
		}
	};

	function tilecolor(elevation) {
		return {
			r: color.elevation.red(elevation),
			g: color.elevation.green(elevation),
			b: color.elevation.blue(elevation)
		};
	}

	function rgb(r, g, b) {
		return 'rgb('+r+','+g+','+b+')';
	}

	function render() {
		map.scan(function(y, x, elevation){
			var hue = tilecolor(elevation);

			if (map.justAbove(y, x, 40)) {
				hue = color.presets.beach;
			} else
			if (map.justBelow(y, x, 40)) {
				hue = color.presets.reef;
			}

			canvas.draw.rectangle(x*tilesize, y*tilesize, tilesize, tilesize).fill(rgb(hue.r, hue.g, hue.b));
		});
	}

	// Public:
	this.prerender;

	this.setTileSize = function(size) {
		tilesize = size;
		canvas.setSize(tilesize*map.size(), tilesize*map.size());
		return _;
	}

	this.build = function(settings) {
		map = new HeightMap();
		map.generate(settings);
		canvas = new Canvas(document.createElement('canvas'));
		_.prerender = canvas.element();
		return _;
	}

	this.render = function() {
		render();
		return _;
	}

	this.size = function() {
		return map.size();
	}

	this.tileSize = function() {
		return tilesize;
	}
}