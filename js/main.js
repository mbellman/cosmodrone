// Script imports
include([
	'js/jquery-2.2.3.js',
	'js/assets.manifest.js',
	'js/assets.manager.js',
	'js/graphics.canvas.js',
	'js/system.vector.js',
	'js/system.map.js',
	'js/system.terrain.js',
	'js/core.game.js'
]).then(main);

// Global variables
var viewport;
var screen = {
	bg1: null,
	bg2: null
};

// Initialization
function main() {
	viewport = {
		width: $(window).width(),
		height: $(window).height()
	};

	createScreens();

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

function createScreens() {
	// Backgrounds (for planet surface, starfield, etc.)
	screen.bg0 = new Canvas(document.createElement('canvas')).setSize(viewport.width, viewport.height);
	screen.bg1 = new Canvas(document.createElement('canvas')).setSize(viewport.width, viewport.height);

	$('#game #bg')
	.append(screen.bg0.element())
	.append(screen.bg1.element())
	.find('canvas')
	.addClass('fill');
}