// Script imports
include(
	[
		'js/dependencies/jquery-2.2.3.js',
		'js/assets/AssetLoader.js',
		'js/assets/AssetManifest.js',
		'js/graphics/Canvas.js',
		'js/system/Tools.js',
		'js/system/Vector.js',
		'js/system/Input.js',
		'js/system/RNG.js',
		'js/system/HeightMap.js',
		'js/system/Terrain.js',
		'js/core/Entity.js',
		'js/core/Components.js',
		'js/core/SceneManager.js',
		'js/core/Controller.js',
		'js/core/Tweenable.js',
		'js/core/Text.js',
		'js/core/Background.js',
		'js/core/Station.js',
		'js/core/LevelLoader.js',
		'js/core/HUD.js',
		'js/core/TitleScene.js',
		'js/core/GameInstance.js'
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
	screen.bg0 = createScreen();
	screen.bg1 = createScreen();
	screen.clouds = createScreen();
	screen.clouds.element.style.zIndex = '3';

	// Add background canvases to the document
	$('#game #bg')
		.append(screen.bg0.element)
		.append(screen.bg1.element)
		.append(screen.clouds.element);

	// Primary game screen
	screen.game = createScreen();
	screen.game.element.style.zIndex = '2';

	// UI screen overlaying everything else
	screen.HUD = createScreen();
	screen.HUD.element.style.zIndex = '3';

	$('#game')
		.append(screen.game.element)
		.append(screen.HUD.element);

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
			'margin': -1 * viewport.height/2 + 'px 0 0 ' + -1 * viewport.width/2 + 'px'
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
function createScreen()
{
	return new Canvas().setSize(viewport.width, viewport.height);
}