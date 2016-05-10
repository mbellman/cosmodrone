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
		'js/core/levels.js',
		'js/core/game.js'
	]
).then(main);

// Global variables
var viewport =
{
	width: 1200,
	height: 600
};

var screen = {};
var game;
var DEBUG;

/**
 * Initialization
 */
function main()
{
	DEBUG = document.getElementById('debug');

	createScreens();
	centerGameStage();
	loadGame();
}

/**
 * Set up screen structure
 */
function createScreens()
{
	// Backgrounds (for planet surface, starfield, etc.)
	screen.bg0 = gameScreen();
	screen.bg1 = gameScreen();
	screen.clouds = gameScreen();
	screen.clouds.element().style.zIndex = '3';

	// Add background canvases to the document
	$('#game #bg')
		.append(screen.bg0.element())
		.append(screen.bg1.element())
		.append(screen.clouds.element());

	// Primary game screen
	screen.game = gameScreen();
	screen.game.element().style.zIndex = '2';

	$('#game')
		.append(screen.game.element());

	// Apply CSS to various screens
	$('#game')
		.find('canvas')
		.addClass('fill');
}

/**
 * Make sure game area is in center of the window
 */
function centerGameStage()
{
	$('#game').css(
		{
			'width': viewport.width + 'px',
			'height': viewport.height + 'px',
			'margin': -1*viewport.height/2 + 'px 0 0 ' + -1*viewport.width/2 + 'px'
		}
	);
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
 * Shorthand for obtaining a game
 * screen-sized Canvas instance
 */
function gameScreen()
{
	return new Canvas(new Element('canvas')).setSize(viewport.width, viewport.height);
}