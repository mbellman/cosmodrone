( function( scope ) {
	/**
	 * ------------
	 * Class: Shape
	 * ------------
	 *
	 * Provides chainable extension methods for Canvas draw operations
	 */
	function Shape( ctx )
	{
		this.ctx = ctx;
	}

	/**
	 * Set Canvas context fill color and perform fill
	 */
	Shape.prototype.fill = function( color )
	{
		if ( color !== null ) {
			this.ctx.fillStyle = color;
		}

		this.ctx.fill();
		return this;
	};

	/**
	 * Set Canvas context stroke color/
	 * line thickness and perform stroke
	 */
	Shape.prototype.stroke = function( color, thickness )
	{
		if ( color !== null ) {
			this.ctx.strokeStyle = color;
		}

		if ( !isNaN( thickness ) ) {
			this.ctx.lineWidth = thickness;
		}

		this.ctx.stroke();
		return this;
	};

	/**
	 * --------------------
	 * Class: DrawOperation
	 * --------------------
	 *
	 * Resource for Canvas vector graphics rendering
	 */
	function DrawOperation( ctx )
	{
		this.ctx = ctx;
		this.shape = new Shape( ctx );
	}

	/**
	 * Draw a circle to the Canvas context
	 */
	DrawOperation.prototype.circle = function( x, y, radius )
	{
		this.ctx.beginPath();
		this.ctx.arc( x, y, radius, 0, 2 * Math.PI );
		return this.shape;
	};

	/**
	 * Draw an ellipse to the Canvas context at [x, y]
	 * with horizontal radius [a] and vertical radius [b]
	 */
	DrawOperation.prototype.ellipse = function( x, y, a, b )
	{
		var control_Y = ( b / 0.75 ) / 2;
		var half_A = ( a / 2 );

		this.ctx.beginPath();
		this.ctx.moveTo( x - half_A, y );
		this.ctx.bezierCurveTo( x - half_A, y + control_Y, x + half_A, y + control_Y, x + half_A, y );
		this.ctx.bezierCurveTo( x + half_A, y - control_Y, x - half_A, y - control_Y, x - half_A, y );
		this.ctx.stroke();

		return this.shape;
	};

	/**
	 * Draw a rectangle to the Canvas context
	 */
	DrawOperation.prototype.rectangle = function( x, y, width, height )
	{
		this.ctx.beginPath();
		this.ctx.rect( x, y, width, height );
		return this.shape;
	};

	/**
	 * Draw an image to the Canvas context
	 */
	DrawOperation.prototype.image = function( source, x1, y1, width1, height1, x2, y2, width2, height2 )
	{
		if ( arguments.length === 1 ) {
			// Draw the source at the top left of the Canvas
			this.ctx.drawImage( source, 0, 0 );
		} else
		if ( arguments.length === 3 ) {
			// Draw the source at a specific [x, y] coordinate
			this.ctx.drawImage( source, x1, y1 );
		} else
		if ( arguments.length === 5 ) {
			// Draw the source at a specific [x,y] coordinate
			// scaled to custom dimensions per [width1] & [height1]
			this.ctx.drawImage( source, x1, y1, width1, height1 );
		} else {
			// Draw a clipping from the source:
			//
			// [x1]: clip X
			// [x2]: clip Y
			// [width1]: clip width
			// [height1]: clip height
			// [x2]: draw X
			// [y2]: draw Y
			// [width2]: draw width
			// [height2]: draw height
			this.ctx.drawImage( source, x1, y1, width1, height1, x2, y2, width2, height2 );
		}
	};

	/**
	 * -------------------------
	 * Class: PixelDataOperation
	 * -------------------------
	 *
	 * Resource for Canvas pixel data manipulation
	 */
	function PixelDataOperation( ctx, element )
	{
		this.ctx = ctx;
		this.element = element;
	}

	/**
	 * Create an empty pixel buffer from [ctx]
	 */
	PixelDataOperation.prototype.create = function( width, height )
	{
		width = width || this.element.width;
		height = height || this.element.height;
		return this.ctx.createImageData( width, height );
	};

	/**
	 * Return the pixel buffer for this [ctx]
	 */
	PixelDataOperation.prototype.get = function( x, y, width, height )
	{
		x = x || 0;
		y = y || 0;
		width = width || this.element.width;
		height = height || this.element.height;
		return this.ctx.getImageData( x, y, width, height );
	};

	/**
	 * Place data back into the pixel buffer
	 */
	PixelDataOperation.prototype.put = function( data, x, y )
	{
		x = x || 0;
		y = y || 0;
		this.ctx.putImageData( data, x, y );
	};

	/**
	 * -------------
	 * Class: Canvas
	 * -------------
	 *
	 * A simple vector/raster graphics toolset for HTML5
	 * Canvas. Preexisting DOM canvas argument optional.
	 */
	function Canvas( element )
	{
		/**
		 * Canvas' DOM element
		 */
		this.element = element || document.createElement( 'canvas' );

		/**
		 * Canvas rendering context
		 */
		this.ctx = this.element.getContext( '2d' );

		/**
		 * Resource for drawing shapes/images/etc.
		 */
		this.draw = new DrawOperation( this.ctx );

		/**
		 * Resource for pixel data manipulation 
		 */
		this.data = new PixelDataOperation( this.ctx, this.element );
	}
	
	/**
	 * Pixel region clearing
	 */
	Canvas.prototype.clear = function( x, y, width, height )
	{
		x = x || 0;
		y = y || 0;
		width = width || this.element.width;
		height = height || this.element.height;

		this.ctx.clearRect( x, y, width, height );

		return this;
	};

	/**
	 * Scale up Canvas image data without interpolation
	 */
	Canvas.prototype.scale = function( scalar )
	{
		scalar = Math.round( scalar );

		if ( scalar < 2 ) {
			// No scaling to be done
			return this;
		}

		var width = this.element.width;
		var height = this.element.height;
		var clone = new Canvas().setSize( width, height );

		clone.draw.image( this.element );
		this.setSize( width * scalar, height * scalar );

		var copy = clone.data.get();
		var self = this.data.get();

		// Iterate over original copied image data
		for ( var y = 0 ; y < height ; y++ ) {
			for ( var x = 0 ; x < width ; x++ ) {
				var C_pixel = copy.getPixelIndex( x, y );
				var C_color = copy.read( C_pixel );
				var S_pixel = self.getPixelIndex( x * scalar, y * scalar );

				// Update each 'scaled pixel' with the original color
				for ( var sy = 0 ; sy < scalar ; sy++ ) {
					for ( var sx = 0 ; sx < scalar ; sx++ ) {
						var pixel = S_pixel + ( 4 * sx ) + ( 4 * sy * width * scalar );
						self.write( pixel, C_color );
					}
				}
			}
		}

		this.data.put( self );

		return this;
	};

	/**
	 * Replace all pixels of [color1] RGB
	 * value with that of [color2] value
	 */
	Canvas.prototype.replace = function( color1, color2 )
	{
		var self = this.data.get();
		var pixel, color;

		color2.alpha = color2.alpha || 255;

		for ( var y = 0 ; y < this.element.height ; y++ ) {
			for ( var x = 0 ; x < this.element.width ; x++ ) {
				pixel = self.getPixelIndex( x, y );
				color = self.read( pixel );

				if (
					color.red === color1.red &&
					color.blue === color1.blue &&
					color.green === color1.green
				) {
					self.write( pixel, color2 );
				}
			}
		}

		this.data.put( self );

		return this;
	};

	/**
	 * Return a copied instance of Canvas
	 */
	Canvas.prototype.copy = function()
	{
		var size = this.getSize();
		var copy = new Canvas().setSize( size.width, size.height );

		copy.draw.image( this.element );

		return copy;
	};

	/**
	 * Get Canvas dimensions
	 */
	Canvas.prototype.getSize = function()
	{
		return {
			width: this.element.width,
			height: this.element.height
		};
	};

	/**
	 * Change Canvas dimensions
	 */
	Canvas.prototype.setSize = function( width, height )
	{
		this.element.width = width;
		this.element.height = height;
		return this;
	};

	/**
	 * Set global Canvas compositing mode
	 */
	Canvas.prototype.setCompositing = function( type )
	{
		this.ctx.globalCompositeOperation = type;
		return this;
	};

	/**
	 * Set global Canvas rendering alpha
	 */
	Canvas.prototype.setAlpha = function( alpha )
	{
		this.ctx.globalAlpha = alpha;
		return this;
	};

	/**
	 * Set Canvas drop shadow [color] and [radius]
	 */
	Canvas.prototype.setShadow = function( color, radius )
	{
		this.ctx.shadowColor = color;
		this.ctx.shadowBlur = radius;
		return this;
	};

	/**
	 * Translate Canvas origin to [x, y]
	 */
	Canvas.prototype.translate = function( x, y )
	{
		this.ctx.translate( x, y );
		return this;
	};

	/**
	 * Set Canvas rendering rotation angle in [radians]
	 */
	Canvas.prototype.rotate = function( radians )
	{
		this.ctx.rotate( radians );
		return this;
	};

	/**
	 * Save the Canvas context state
	 */
	Canvas.prototype.save = function()
	{
		this.ctx.save();
		return this;
	};

	/**
	 * Restore the Canvas context state to
	 * that of the previously saved instance
	 */
	Canvas.prototype.restore = function()
	{
		this.ctx.restore();
		return this;
	};

	/**
	 * Static method for converting a [hex] string to a RGB value
	 */
	Canvas.hexToRGB = function( hex )
	{
		hex = hex.replace( /#/g, '' );
		var red = 0, green = 0, blue = 0;

		if ( hex.length === 3 ) {
			// 3-character hex color
			red = hex.charAt( 0 );
			green = hex.charAt( 1 );
			blue = hex.charAt( 2);

			red += red;
			green += green;
			blue += blue;
		} else {
			// 6-character hex color
			red = hex.substr( 0, 2 );
			green = hex.substr( 2, 2 );
			blue = hex.substr( 4, 2 );
		}

		return {
			red: parseInt( red, 16 ),
			green: parseInt( green, 16 ),
			blue: parseInt( blue, 16 )
		};
	};

	/**
	 * ----------------
	 * Class: ImageData
	 * ----------------
	 *
	 * Extensions to the default ImageData prototype
	 */

	/**
	 * Get the pixel data array index for an [x, y] coordinate
	 */
	ImageData.prototype.getPixelIndex = function( x, y )
	{
		return 4 * ( y * this.width + x );
	};

	/**
	 * Get the [x, y] coordinate for a pixel data array index
	 */
	ImageData.prototype.getPixelXY = function( pixel )
	{
		pixel = Math.floor( pixel / 4 );

		return {
			x: pixel % this.width,
			y: Math.floor( pixel / this.width )
		};
	};

	/**
	 * Get the RGBA at a specified [pixel] index
	 */
	ImageData.prototype.read = function( pixel )
	{
		return {
			red: this.data[pixel],
			green: this.data[pixel + 1],
			blue: this.data[pixel + 2],
			alpha: this.data[pixel + 3]
		};
	};

	/**
	 * Set the RGBA at a specified [pixel] index
	 */
	ImageData.prototype.write = function( pixel, color )
	{
		this.data[pixel] = color.red;
		this.data[pixel + 1] = color.green;
		this.data[pixel + 2] = color.blue;
		this.data[pixel + 3] = color.alpha;
	};

	scope.Canvas = Canvas;
} )( window );