// Script imports
include([
	'js/jquery-2.2.3.js',
	'js/graphics.canvas.js',
	'js/assets.manifest.js',
	'js/assets.manager.js',
	'js/system.map.js'
]).then(main);

// Global variables
var viewport, screen;

// Initialization
function main() {
	viewport = {
		width: $(window).width(),
		height: $(window).height()
	};

	screen = new Canvas($('#game')[0]).setSize(viewport.width, viewport.height);

	new AssetLoader()
	.root('assets')
	.load(AssetManifest)
	.progress(function(percent){
		console.log('Loading...' + percent + '%');
	})
	.then(function(pack){
		var map = new HeightMap();
		var its = 8;
		var size = Math.pow(2, its) + 1;
		var tile = Math.round(500 / size);
		var w = tile * size;

		var t = Date.now();

		map.generate({
			iterations: its,
			elevation: 100,
			smoothness: 6,
			repeat: true
		});

		console.log((Date.now() - t) + 'ms to generate');

		map.scan(function(y, x, elevation){
			var r = (elevation > 40 ? (elevation > 80 ? 155+elevation : 2*elevation) : 0);
			var g = (elevation > 40 ? (elevation > 80 ? 120+elevation : 4*elevation) : elevation);
			var b = (elevation > 40 ? (elevation > 80 ? 155+elevation : Math.round(elevation/2)) : 135 + 3*elevation);

			screen.draw.rectangle(10 + x*tile, 10 + y*tile, tile, tile).fill('rgb(' + r + ',' + g + ',' + b + ')');
			screen.draw.rectangle(w + 10 + x*tile, 10 + y*tile, tile, tile).fill('rgb(' + r + ',' + g + ',' + b + ')');
			screen.draw.rectangle(10 + x*tile, w + 10 + y*tile, tile, tile).fill('rgb(' + r + ',' + g + ',' + b + ')');
			screen.draw.rectangle(w + 10 + x*tile, w + 10 + y*tile, tile, tile).fill('rgb(' + r + ',' + g + ',' + b + ')');
		});
	});

	$(window).on('resize', onResize);
}

function onResize() {
	viewport.width = $(window).width();
	viewport.height = $(window).height();
	screen.setSize(viewport.width, viewport.height);
}