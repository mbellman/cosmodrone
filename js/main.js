// Script imports
include(
	[
		'js/jquery-2.2.3.js',
		'js/assets.manifest.js',
		'js/assets.manager.js',
		'js/graphics.canvas.js',
		'js/system.tools.js',
		'js/system.vector.js',
		'js/system.rng.js',
		'js/system.map.js',
		'js/system.terrain.js',
		'js/core.components.js',
		'js/core.game.js'
	]
).then(main);

// Global variables
var viewport = {};
var screen = {};
var game;

// Initialization
function main()
{
	createScreens();
	onResize();

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
		game.init().start();
	});

	$(window).on('resize', onResize);
}

function fullSizeScreen()
{
	return new Canvas(new Element('canvas')).setSize(viewport.width, viewport.height);
}

function createScreens()
{
	// Backgrounds (for planet surface, starfield, etc.)
	screen.bg0 = fullSizeScreen();
	screen.bg1 = fullSizeScreen();
	screen.clouds = fullSizeScreen();
	screen.clouds.element().style.zIndex = '3';

	$('#game #bg')
	.append(screen.bg0.element())
	.append(screen.bg1.element())
	.append(screen.clouds.element());

	// Primary game scene
	screen.game = fullSizeScreen();

	$('#game')
	.append(screen.game.element());

	// Apply CSS to various screens
	$('#game')
	.find('canvas')
	.addClass('fill');
}

function onResize()
{
	viewport.width = $(window).width();
	viewport.height = $(window).height();

	for (var s in screen)
	{
		if (screen.hasOwnProperty(s))
		{
			screen[s].setSize(viewport.width, viewport.height);
		}
	}
}