// Script imports
include([
	'js/jquery-2.2.3.js',
	'js/graphics.canvas.js',
	'js/assets.manifest.js',
	'js/assets.manager.js',
	'js/system.vector.js',
	'js/system.map.js',
	'js/core.game.js'
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
		var game = new GameInstance();
		game.init().start();
	});

	$(window).on('resize', onResize);
}

function onResize() {
	viewport.width = $(window).width();
	viewport.height = $(window).height();
	screen.setSize(viewport.width, viewport.height);
}