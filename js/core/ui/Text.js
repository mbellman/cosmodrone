
/**
 * ---------------------
 * Component: TextString
 * ---------------------
 *
 * A printed string of bitmap font characters
 */
function TextString( _font )
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var render = new Canvas();
	var font = _font;
	var bitmap = Assets.getImage( Fonts[font].file );
	var bitmaps = {};
	var color = '#fff';
	var string = '';
	var line_height = 30;
	var letter_spacing = 2;
	var space_size = 16;
	var buffer = 0;
	var offset = {x: 0, y: 0};
	var size = {width: 0, height: 0};
	var instructions = [' ', '[br]', '[rgb='];

	load_default_bitmap();

	/**
	 * Load first font bitmap (default #fff color)
	 */
	function load_default_bitmap()
	{
		bitmaps['#fff'] = new Canvas().setSize( bitmap.width, bitmap.height );
		bitmaps['#fff'].draw.image( bitmap );
	}

	/**
	 * Load a new font color by [hex] value
	 */
	function load_color_bitmap( hex )
	{
		bitmaps[hex] = bitmaps['#fff'].copy().recolor(
			{red: 255, green: 255, blue: 255},
			Canvas.hexToRGB( hex )
		);
	}

	/**
	 * Get the clipping region for a character
	 */
	function get_character_clipping( character )
	{
		var clip = Fonts[font][character];

		if ( typeof clip === 'undefined' ) {
			return null;
		}

		return clip;
	}

	/**
	 * Update Canvas [size] based on new [offset]
	 * as recalculated via a new character [clip]
	 */
	function update_canvas_size( clip )
	{
		var clip_bottom = offset.y + clip.height + clip.top;
		offset.x += ( clip.width + letter_spacing );

		if ( offset.x > size.width ) {
			size.width = offset.x;
		}

		if ( clip_bottom > size.height ) {
			size.height = clip_bottom;
		}
	}

	/**
	 * Checks the data inside the latest encountered special instruction
	 * block, advances the character output buffer, and returns the data
	 */
	function parse_special_instruction()
	{
		var start = string.indexOf( '=', buffer );
		var end = string.indexOf( ']', buffer );

		if ( start > -1 && end > -1 ) {
			buffer = end + 1;
			return string.substring( start + 1, end );
		} else {
			// Malformed block
			buffer++;
			return null;
		}
	}

	/**
	 * Executes text block instructions
	 */
	function process_instruction( instruction, is_printing )
	{
		switch ( instruction ) {
			// Space
			case ' ':
				offset.x += space_size;
				buffer++;
				break;
			// Line break
			case '[br]':
				offset.x = 0;
				offset.y += line_height;
				buffer += 4;
				break;
			// Color change
			case '[rgb=':
				var new_color = parse_special_instruction();

				if ( !bitmaps.hasOwnProperty( new_color ) ) {
					load_color_bitmap( new_color );
				}

				if ( is_printing ) {
					color = new_color;
				}

				break;
			default:
				break;
		}
	}

	/**
	 * Print clipped character to [render] Canvas at [offset]
	 */
	function print_character( clip )
	{
		render.draw.image(
			bitmaps[color].element,
			clip.x, clip.y, clip.width, clip.height,
			offset.x, offset.y + clip.top, clip.width, clip.height
		);

		offset.x += ( clip.width + letter_spacing );
	}

	/**
	 * Character stream operation
	 */
	function feed_character( is_printing )
	{
		// Instruction block check
		for ( var i = 0 ; i < instructions.length ; i++ ) {
			var instruction = instructions[i];

			if ( string.substr( buffer, instruction.length ) === instruction ) {
				process_instruction( instruction, is_printing );
				return;
			}
		}

		var clip = get_character_clipping( string.charAt( buffer++ ) );

		if ( clip === null ) {
			// Invalid character
			return;
		}

		if ( !is_printing ) {
			update_canvas_size( clip );
		} else {
			print_character( clip );
		}
	}

	/**
	 * Iterate over [string], either to ascertain the new
	 * [render] Canvas size or to print it to [render]
	 */
	function feed_string( is_printing )
	{
		color = '#fff';
		offset.x = 0;
		offset.y = 0;
		buffer = 0;

		while ( buffer < string.length ) {
			feed_character( is_printing );
		}
	}

	/**
	 * Recalculates [render] Canvas size
	 * based on printed string length
	 */
	function set_canvas_size()
	{
		size.width = 0;
		size.height = 0;

		feed_string( false );
		render.setSize( size.width, size.height );
	}

	// -- Public: --
	this.onAdded = function()
	{
		if ( !_.owner.has(Sprite) ) {
			_.owner.add( new Sprite() );
		}

		_.owner.get( Sprite ).setSource( render.element );
	};

	/**
	 * Get text area dimensions
	 */
	this.getSize = function()
	{
		return {
			width: size.width,
			height: size.height
		};
	};

	/**
	 * Get local text coordinates
	 */
	this.getPosition = function()
	{
		return {
			x: _.owner.get( Sprite ).x._,
			y: _.owner.get( Sprite ).y._,
		};
	};

	/**
	 * Set the text [font]
	 */
	this.setFont = function( _font )
	{
		font = _font;
		bitmap = Assets.getImage( Fonts[font].file );

		_.setString( string );

		return _;
	};

	/**
	 * Update the text [string]
	 */
	this.setString = function( _string )
	{
		string = _string || '';

		set_canvas_size();
		feed_string( true );

		return _;
	};

	/**
	 * Update the text position via the owner Sprite
	 */
	this.setXY = function( x, y )
	{
		_.owner.get( Sprite ).setXY( x, y );
		return _;
	};

	/**
	 * Change text style [properties]
	 */
	this.setStyle = function( properties )
	{
		line_height = properties.lineHeight || 30;
		letter_spacing = properties.letterSpacing || 2;
		space_size = properties.spaceSize || 10;
		return _;
	};

	/**
	 * Save different color variants of the original bitmap font
	 */
	this.loadColors = function()
	{
		for ( var a = 0 ; a < arguments.length ; a++ ) {
			var hex = arguments[a];

			if ( !bitmaps.hasOwnProperty( hex ) ) {
				load_color_bitmap( hex );
			}
		}

		return _;
	};
}

/**
 * ----------------------
 * Component: TextPrinter
 * ----------------------
 *
 * Displays a string with updating letter-by-letter output
 */
function TextPrinter( _font )
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var text = new TextString( _font );
	var string = '';
	var output = '';
	var buffer = 0;
	var sounds = [];
	var sound_queued = false;
	var muted = false;
	var instructions = [' ', '[br]', '[rgb='];
	var special = ['[rgb='];
	var delay = {
		interval: 50,
		counter: 0
	};

	/**
	 * Determine whether or not an instruction block
	 * is of a special type with variable data strings
	 */
	function is_special_instruction( instruction )
	{
		for ( var t = 0 ; t < special.length ; t++ ) {
			if ( instruction === special[t] ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Restarts text printing cycle
	 */
	function reset_output_buffer()
	{
		output = '';
		buffer = 0;
		delay.counter = 0;
	}

	/**
	 * Plays a random 'text printing' sound
	 */
	function play_sound()
	{
		if ( !muted && sounds.length > 0 ) {
			var sound = random( 0, sounds.length - 1 );
			sounds[sound].play();
		}

		sound_queued = false;
	}

	/**
	 * Advances the output buffer and prints the next character
	 */
	function print_next_character()
	{
		for ( var i = 0 ; i < instructions.length ; i++ ) {
			var instruction = instructions[i];

			if ( string.substr( buffer, instruction.length ) === instruction ) {
				// Print instruction blocks silently
				output += instruction;
				buffer += instruction.length;

				if ( is_special_instruction( instruction ) ) {
					var end = string.indexOf( ']', buffer );

					if ( ++end > 0 ) {
						output += string.substring( buffer, end );
						buffer = end;
					}
				}

				print_next_character();
				return;
			}
		}

		output += string.charAt( buffer++ );
		text.setString( output );

		// Queue sound to play on next update cycle
		// once Sprite has updated with new character
		sound_queued = true;
	}

	// -- Public: --
	this.update = function( dt )
	{
		if ( sound_queued ) {
			play_sound();
		}

		if ( buffer < string.length ) {
			if ( delay.counter < delay.interval ) {
				delay.counter += ( dt * 1000 );
				return;
			}

			delay.counter = 0;
			print_next_character();
		}
	};

	this.onAdded = function()
	{
		_.owner.add( text );
	};

	/**
	 * Configure the component to play one or
	 * one of multiple sound effects each time
	 * a new letter is printed to the screen
	 */
	this.setSound = function()
	{
		if ( arguments.length > 0 ) {
			sounds.length = 0;

			for ( var s = 0 ; s < arguments.length ; s++ ) {
				sounds.push( arguments[s] );
			}
		}

		return _;
	};

	/**
	 * Set the delay between printed
	 * characters in milliseconds
	 */
	this.setInterval = function( ms )
	{
		delay.interval = ms;
		return _;
	};

	/**
	 * Set the internal TextString [font]
	 */
	this.setFont = function( _font )
	{
		text.setFont( _font );
		return _;
	};

	/**
	 * Alias for TextString.setStyle()
	 */
	this.setStyle = function()
	{
		text.setStyle.apply( null, arguments );
		return _;
	};

	/**
	 * Alias for TextString.loadColors()
	 */
	this.loadColors = function()
	{
		text.loadColors.apply( null, arguments );
		return _;
	};

	/**
	 * Print a new [string]
	 */
	this.print = function( _string )
	{
		string = _string;
		reset_output_buffer();
		return _;
	};

	/**
	 * Disable text sound effects
	 */
	this.mute = function()
	{
		muted = true;
		return _;
	};

	/**
	 * Re-enable text sound effects
	 */
	this.unmute = function()
	{
		muted = false;
		return _;
	}
}