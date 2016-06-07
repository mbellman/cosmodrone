// Script imports
include(
	[
		'js/dependencies/jquery-2.2.3.js',
		'js/system/Tools.js',
		'js/system/Vector.js',
		'js/system/Input.js',
		'js/system/RNG.js',
		'js/system/HeightMap.js',
		'js/assets/AssetLoader.js',
		'js/assets/AssetManifest.js',
		'js/render/Canvas.js',
		'js/audio/WebAudio.js',
		'js/core/Entity.js',
		'js/core/Component.js',
		'js/core/SceneManager.js',
		'js/core/Controller.js',
		'js/core/Tweenable.js',
		'js/core/Sprite.js',
		'js/core/Mechanics.js',
		'js/core/Terrain.js',
		'js/core/Background.js',
		'js/core/LevelLoader.js',
		'js/core/Drone.js',
		'js/core/fx/Effects.js',
		'js/core/fx/Sphere.js',
		'js/core/ui/Fonts.js',
		'js/core/ui/Text.js',
		'js/core/ui/Menu.js',
		'js/core/ui/HUD.js',
		'js/core/station/Objects.js',
		'js/core/scenes/TitleScene.js',
		'js/core/scenes/GameScene.js'
	]
).then( main );

// Global variables
var Viewport = {
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
	DEBUG = document.getElementById( 'debug' );

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
	screen.background = createScreen();
	screen.clouds = createScreen();
	screen.clouds.element.style.zIndex = '3';

	// Add background canvases to the document
	$( '#game #bg' )
		.append( screen.background.element )
		.append( screen.clouds.element );

	// Primary game screen
	screen.game = createScreen();
	screen.game.element.style.zIndex = '2';

	// UI screen overlaying everything else
	screen.HUD = createScreen();
	screen.HUD.element.style.zIndex = '3';

	$( '#game' )
		.append( screen.game.element )
		.append( screen.HUD.element );

	// Apply CSS to various screens
	$( '#game' )
		.find( 'canvas' )
		.addClass( 'fill' );
}

/**
 * Make sure game area is in center of the window
 */
function centerGameStage()
{
	$( '#game' ).css(
		{
			'width': Viewport.width + 'px',
			'height': Viewport.height + 'px',
			'margin': ( -1 * Viewport.height / 2 ) + 'px 0 0 ' + ( -1 * Viewport.width / 2 ) + 'px'
		}
	);
}

/**
 * Start up the game
 */
function loadGame()
{
	new AssetLoader()
	.root( 'assets' )
	.load( AssetManifest )
	.progress( function( percent ) {
		console.log( 'Loading...' + percent + '%' );
	} )
	.then( function() {
		var controller = new Controller();
		controller.showGame();
	} );
}

/**
 * Shorthand for getting a game screen-sized Canvas instance
 */
function createScreen()
{
	return new Canvas().setSize( Viewport.width, Viewport.height );
}