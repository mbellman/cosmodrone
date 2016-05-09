// Script imports
include(
	[
		'js/dependencies/jquery-2.2.3.js',
		'js/assets/manifest.js',
		'js/assets/manager.js',
		'js/graphics/canvas.js',
		'js/system/tools.js',
		'js/system/vector.js',
		'js/system/input.js',
		'js/system/rng.js',
		'js/system/map.js',
		'js/system/terrain.js',
		'js/core/entity.js',
		'js/core/components.js',
		'js/core/background.js',
		'js/core/game.js'
	]
).then(main);

// Global variables
var viewport = {};
var screen = {};
var game;
var DEBUG;
// For passing any in-game handlers to
// the primary window.resize() event
var resize_event_queue = [];

/**
 * Initialization
 */
function main()
{
	DEBUG = document.getElementById('debug');

	createScreens();
	loadGame();

	$(window).on('resize', onResize).resize();
}

/**
 * Set up screen structure
 */
function createScreens()
{
	// Backgrounds (for planet surface, starfield, etc.)
	screen.bg0 = fullSizeScreen();
	screen.bg1 = fullSizeScreen();
	screen.clouds = fullSizeScreen();
	screen.clouds.element().style.zIndex = '3';

	// Add background canvases to the document
	$('#game #bg')
		.append(screen.bg0.element())
		.append(screen.bg1.element())
		.append(screen.clouds.element());

	// Primary game screen
	screen.game = fullSizeScreen();
	screen.game.element().style.zIndex = '2';

	$('#game')
		.append(screen.game.element());

	// Apply CSS to various screens
	$('#game')
		.find('canvas')
		.addClass('fill');
}

/**
 * Start up the game
 */
function loadGame()
{
	new AssetLoader()
	.root('assets')
	.load(AssetManifest)
	.progress(function(percent)
	{
		console.log('Loading...' + percent + '%');
	})
	.then(function(pack)
	{
		game = new GameInstance(pack);
		game.debug(true).init().start();
	});
}

/**
 * Browser resize handler
 */
function onResize()
{
	viewport.width = $(window).width();
	viewport.height = $(window).height();

	// Update screen dimensions
	for (var s in screen)
	{
		if (screen.hasOwnProperty(s))
		{
			screen[s].setSize(viewport.width, viewport.height);
		}
	}

	// Fire any external resize events
	for (var e = 0 ; e < resize_event_queue.length ; e++)
	{
		resize_event_queue[e]();
	}
}

/**
 * Shorthand for obtaining a screen-sized Canvas instance
 */
function fullSizeScreen()
{
	return new Canvas(new Element('canvas')).setSize(viewport.width, viewport.height);
}