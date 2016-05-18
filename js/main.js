// Script imports
include(
	[
		'js/dependencies/jquery-2.2.3.js',
		'js/assets/manager.js',
		'js/assets/manifest.js',
		'js/graphics/canvas.js',
		'js/system/tools.js',
		'js/system/vector.js',
		'js/system/input.js',
		'js/system/rng.js',
		'js/system/map.js',
		'js/system/terrain.js',
		'js/core/entity.js',
		'js/core/components.js',
		'js/core/scene.js',
		'js/core/controller.js',
		'js/core/background.js',
		'js/core/station.js',
		'js/core/levels.js',
		'js/core/HUD.js',
		'js/core/title.js',
		'js/core/game.js'
	]
).then(main);

// Global variables
var viewport =
{
	width: 1200,
	height: 650
};
var screen = {};
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
 * Set up Canvas element structure
 */
function createScreens()
{
	// Backgrounds (for planet surface, starfield, etc.)
	screen.bg0 = new Screen();
	screen.bg1 = new Screen();
	screen.clouds = new Screen();
	screen.clouds.element().style.zIndex = '3';

	// Add background canvases to the document
	$('#game #bg')
		.append(screen.bg0.element())
		.append(screen.bg1.element())
		.append(screen.clouds.element());

	// Primary game screen
	screen.game = new Screen();
	screen.game.element().style.zIndex = '2';

	// UI screen overlaying everything else
	screen.HUD = new Screen();
	screen.HUD.element().style.zIndex = '3';

	$('#game')
		.append(screen.game.element())
		.append(screen.HUD.element());

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
	.then(function(assets)
	{
		var controller = new Controller(assets);
		controller.showTitle();
	});
}

/**
 * Shorthand for getting a game screen-sized Canvas instance
 */
function Screen()
{
	return new Canvas(new Element('canvas')).setSize(viewport.width, viewport.height);
}