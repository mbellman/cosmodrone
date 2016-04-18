// Script imports
include([
	'js/jquery-2.2.3.js',
	'js/graphics.canvas.js',
	'js/assets.manifest.js',
	'js/assets.manager.js'
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
		screen.draw.circle(100, 100, 50).fill('red').stroke('green', 2);
		screen.draw.rectangle(200, 200, 100, 50).fill('blue').stroke('purple', 5);
		screen.draw.image(pack.getImage('earth.png'), 300, 400);
		pack.getAudio('coin.mp3').play();
	});

	$(window).on('resize', onResize);
}

function onResize() {
	viewport.width = $(window).width();
	viewport.height = $(window).height();
	screen.setSize(viewport.width, viewport.height);
}