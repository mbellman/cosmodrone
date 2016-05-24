/**
 * -----------------------
 * Global Object: WebAudio
 * -----------------------
 *
 * Static WebAudio resource for the page
 */
var WebAudio = {
	ctx: new AudioContext()
};

/**
 * Asynchronous audio file loader
 * with optional callback [handlers]
 */
WebAudio.load = function( file, handlers )
{
	handlers.load = handlers.load || function(){};
	handlers.fail = handlers.fail || function(){};

	var ajax = new XMLHttpRequest();
	ajax.open( 'GET', file, true );
	ajax.responseType = 'arraybuffer';

	ajax.onload = function() {
		WebAudio.ctx.decodeAudioData( ajax.response, function( data ) {
			handlers.load( data );
		}, handlers.fail );
	}

	ajax.send();
}

/**
 * Create an [audio] buffer source node
 * from buffer data, play it, and return
 * the node for further manipulation
 */
WebAudio.play = function( audio )
{
	var node = this.ctx.createBufferSource();
	node.buffer = audio;

	node.connect( this.ctx.destination );
	node.start( this.ctx.currentTime );

	return node;
}

/**
 * Stop an active audio buffer source [node]
 */
WebAudio.stop = function( node )
{
	node.stop( this.ctx.currentTime );
}