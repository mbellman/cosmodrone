(function(scope){
	/**
	 * Bitmap font clipping/placement coordinates
	 */
	var Fonts =
	{
		Monitor:
		{
			// Capital letters
			'A': {x: 0, y: 0, width: 16, height: 22, top: 0},
			'B': {x: 20, y: 0, width: 16, height: 22, top: 0},
			'C': {x: 40, y: 0, width: 16, height: 22, top: 0},
			'D': {x: 60, y: 0, width: 16, height: 22, top: 0},
			'E': {x: 80, y: 0, width: 16, height: 22, top: 0},
			'F': {x: 100, y: 0, width: 16, height: 22, top: 0},
			'G': {x: 120, y: 0, width: 16, height: 22, top: 0},
			'H': {x: 140, y: 0, width: 16, height: 22, top: 0},
			'I': {x: 160, y: 0, width: 6, height: 22, top: 0},
			'J': {x: 170, y: 0, width: 16, height: 22, top: 0},
			'K': {x: 190, y: 0, width: 16, height: 22, top: 0},
			'L': {x: 210, y: 0, width: 16, height: 22, top: 0},
			'M': {x: 230, y: 0, width: 16, height: 22, top: 0},
			'N': {x: 250, y: 0, width: 16, height: 22, top: 0},
			'O': {x: 270, y: 0, width: 16, height: 22, top: 0},
			'P': {x: 290, y: 0, width: 16, height: 22, top: 0},
			'Q': {x: 310, y: 0, width: 16, height: 22, top: 0},
			'R': {x: 330, y: 0, width: 16, height: 22, top: 0},
			'S': {x: 350, y: 0, width: 16, height: 22, top: 0},
			'T': {x: 370, y: 0, width: 16, height: 22, top: 0},
			'U': {x: 390, y: 0, width: 16, height: 22, top: 0},
			'V': {x: 410, y: 0, width: 16, height: 22, top: 0},
			'W': {x: 430, y: 0, width: 16, height: 22, top: 0},
			'X': {x: 450, y: 0, width: 16, height: 22, top: 0},
			'Y': {x: 470, y: 0, width: 16, height: 22, top: 0},
			'Z': {x: 490, y: 0, width: 16, height: 22, top: 0},

			// Lowercase letters
			'a': {x: 0, y: 34, width: 16, height: 14, top: 8},
			'b': {x: 20, y: 26, width: 16, height: 22, top: 0},
			'c': {x: 40, y: 36, width: 16, height: 12, top: 10},
			'd': {x: 60, y: 26, width: 16, height: 22, top: 0},
			'e': {x: 80, y: 36, width: 16, height: 12, top: 10},
			'f': {x: 100, y: 26, width: 16, height: 22, top: 0},
			'g': {x: 120, y: 36, width: 16, height: 22, top: 10},
			'h': {x: 140, y: 26, width: 16, height: 22, top: 0},
			'i': {x: 160, y: 32, width: 6, height: 16, top: 6},
			'j': {x: 170, y: 32, width: 16, height: 26, top: 6},
			'k': {x: 190, y: 26, width: 16, height: 22, top: 0},
			'l': {x: 210, y: 26, width: 8, height: 22, top: 0},
			'm': {x: 222, y: 36, width: 16, height: 12, top: 10},
			'n': {x: 242, y: 36, width: 16, height: 12, top: 10},
			'o': {x: 262, y: 36, width: 16, height: 12, top: 10},
			'p': {x: 282, y: 36, width: 16, height: 22, top: 10},
			'q': {x: 302, y: 36, width: 16, height: 22, top: 10},
			'r': {x: 322, y: 36, width: 16, height: 12, top: 10},
			's': {x: 342, y: 36, width: 16, height: 12, top: 10},
			't': {x: 362, y: 26, width: 20, height: 22, top: 0},
			'u': {x: 386, y: 36, width: 16, height: 12, top: 10},
			'v': {x: 406, y: 36, width: 16, height: 12, top: 10},
			'w': {x: 426, y: 36, width: 16, height: 12, top: 10},
			'x': {x: 446, y: 36, width: 16, height: 12, top: 10},
			'y': {x: 466, y: 36, width: 16, height: 22, top: 10},
			'z': {x: 486, y: 36, width: 16, height: 12, top: 10},

			// Numbers
			'0': {x: 0, y: 62, width: 16, height: 22, top: 0},
			'1': {x: 20, y: 62, width: 8, height: 22, top: 0},
			'2': {x: 32, y: 62, width: 16, height: 22, top: 0},
			'3': {x: 52, y: 62, width: 16, height: 22, top: 0},
			'4': {x: 72, y: 62, width: 16, height: 22, top: 0},
			'5': {x: 92, y: 62, width: 16, height: 22, top: 0},
			'6': {x: 112, y: 62, width: 16, height: 22, top: 0},
			'7': {x: 132, y: 62, width: 16, height: 22, top: 0},
			'8': {x: 152, y: 62, width: 16, height: 22, top: 0},
			'9': {x: 172, y: 62, width: 16, height: 22, top: 0},

			// Punctuation and symbols
			'.': {x: 192, y: 80, width: 4, height: 4, top: 18},
			'!': {x: 200, y: 62, width: 6, height: 22, top: 0},
			'?': {x: 210, y: 62, width: 16, height: 22, top: 0},
			',': {x: 230, y: 80, width: 6, height: 8, top: 18},
			'-': {x: 240, y: 270, width: 8, height: 4, top: 8},
			'_': {x: 252, y: 280, width: 16, height: 2, top: 20},
			'(': {x: 272, y: 62, width: 6, height: 22, top: 0},
			')': {x: 282, y: 62, width: 6, height: 22, top: 0},
			'[': {x: 292, y: 62, width: 6, height: 22, top: 0},
			']': {x: 302, y: 62, width: 6, height: 22, top: 0},
			'"1': {x: 312, y: 62, width: 14, height: 8, top: 0},
			'"2': {x: 330, y: 62, width: 14, height: 8, top: 0},
			'\'': {x: 348, y: 62, width: 4, height: 8, top: 0},
			'+': {x: 356, y: 68, width: 12, height: 12, top: 6},
			'=': {x: 372, y: 68, width: 9, height: 10, top: 6},
			'|': {x: 386, y: 62, width: 2, height: 22, top: 0}
		}
	};

	/**
	 * Get the clipping region for a
	 * character from a specific font
	 */
	function get_character_clipping(font, character)
	{
		var clip = Fonts[font][character];

		if (typeof clip === 'undefined')
		{
			return null;
		}

		return Fonts[font][character];
	}

	/**
	 * Component which updates the owner's Sprite with
	 * a printed string of characters as a Canvas element
	 */
	function TextString(_font, _source)
	{
		// Private:
		var _ = this;
		var owner = null;
		var source = _source;
		var render = new Canvas();
		var font = _font;
		var string = '';
		var letter_spacing = 2;
		var space_size = 16;

		// Public:
		this.update = function(dt){}

		this.onAdded = function(entity)
		{
			owner = entity;

			if (owner.has(Sprite))
			{
				owner.get(Sprite).setSource(render.element);
			}
		}

		this.setFont = function(_font, _source)
		{
			font = _font;
			source = _source;
			_.setString(string);
			return _;
		}

		this.setString = function(_string)
		{
			string = _string;

			// Prepare to chunk string into
			// word arrays of character arrays
			var output = [];
			var words = string.split(' ');
			var offset =
			{
				x: 0,
				y: 0
			};

			var word, character, clip, width = 0, height = 0, char_height;

			for (var w = 0 ; w < words.length ; w++)
			{
				word = words[w];
				output[w] = [];

				for (var c = 0 ; c < word.length ; c++)
				{
					character = word.charAt(c);
					output[w][c] = character;
					clip = get_character_clipping(font, character);

					if (clip === null)
					{
						// (Invalid character)
						continue;
					}

					// Keep track of printable area size
					offset.x += (clip.width + letter_spacing);

					if (offset.x > width)
					{
						width = offset.x;
					}

					char_height = offset.y + clip.height + clip.top;

					if (char_height > height)
					{
						height = char_height;
					}
				}

				offset.x += space_size;
			}

			// Fit [render] Canvas dimensions to printable area
			render.setSize(width, height);

			// Print characters to [render] Canvas:
			// 1. Reset offset
			offset.x = 0;
			offset.y = 0;

			for (var w = 0 ; w < output.length ; w++)
			{
				word = output[w];

				for (var c = 0 ; c < word.length ; c++)
				{
					// 2. Get the next character and its clipping
					character = word[c];
					clip = get_character_clipping(font, character);

					if (clip === null)
					{
						// (Invalid character)
						continue;
					}

					render.draw.image(
						source,
						clip.x, clip.y, clip.width, clip.height,
						offset.x, offset.y + clip.top, clip.width, clip.height
					);

					// 3. Update offset and continue
					offset.x += (clip.width + letter_spacing);
				}

				offset.x += space_size;
			}

			if (owner !== null && owner.has(Sprite))
			{
				owner.get(Sprite).setSource(render.element);
			}

			return _;
		}
	}

	scope.TextString = TextString;
})(window);