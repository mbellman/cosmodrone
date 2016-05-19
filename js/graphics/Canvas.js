(function(scope){
	// ------------------------------------------ //
	// ------------- CHAINING TOOLS ------------- //
	// ------------------------------------------ //

	/**
	 * ------------
	 * Class: Shape
	 * ------------
	 *
	 * Provides chainable methods for
	 * Canvas shape drawing operations
	 */
	function Shape(ctx)
	{
		this.ctx = ctx;
	}

	/**
	 * Set Canvas context fill color and perform fill
	 */
	Shape.prototype.fill = function(color)
	{
		if (color !== null)
		{
			this.ctx.fillStyle = color;
		}

		this.ctx.fill();
		return this;
	}

	/**
	 * Set Canvas context stroke color/
	 * line thickness and perform stroke
	 */
	Shape.prototype.stroke = function(color, thickness)
	{
		if (color !== null)
		{
			this.ctx.strokeStyle = color;
		}

		if (!isNaN(thickness))
		{
			this.ctx.lineWidth = thickness;
		}

		this.ctx.stroke();
		return this;
	}

	/**
	 * --------------------
	 * Class: DrawOperation
	 * --------------------
	 *
	 * Instance which provides a subcategory
	 * of specific shape/image draw operations
	 */
	function DrawOperation(ctx)
	{
		this.ctx = ctx;
	}

	/**
	 * Draw a circle
	 */
	DrawOperation.prototype.circle = function(x, y, radius)
	{
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
		return new Shape(this.ctx);
	}

	/**
	 * Draw a rectangle
	 */
	DrawOperation.prototype.rectangle = function(x, y, width, height)
	{
		this.ctx.beginPath();
		this.ctx.rect(x, y, width, height);
		return new Shape(this.ctx);
	}

	/**
	 * Draw an image to the Canvas
	 */
	DrawOperation.prototype.image = function(source, x1, y1, width1, height1, x2, y2, width2, height2)
	{
		if (typeof x1 === 'undefined')
		{
			// Draw the source at the top left of the Canvas
			this.ctx.drawImage(source, 0, 0);
		}
		else
		if (typeof width1 === 'undefined')
		{
			// Draw the source at a specific [x, y] coordinate
			this.ctx.drawImage(source, x1, y1);
		}
		else
		if (typeof x2 === 'undefined')
		{
			// Draw the source at a specific [x,y] coordinate
			// scaled to custom dimensions per [width1] & [height1]
			this.ctx.drawImage(source, x1, y1, width1, height1);
		}
		else
		{
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
			this.ctx.drawImage(source, x1, y1, width1, height1, x2, y2, width2, height2);
		}
	}

	/**
	 * -------------------------
	 * Class: PixelDataOperation
	 * -------------------------
	 *
	 * Instance which provides a subcategory
	 * of pixel data manipulation operations
	 */
	function PixelDataOperation(ctx, element)
	{
		this.ctx = ctx;
		this.element = element;
	}

	/**
	 * Create an empty pixel buffer from [ctx]
	 */
	PixelDataOperation.prototype.create = function(width, height)
	{
		width = width || this.element.width;
		height = height || this.element.height;
		return this.ctx.createImageData(width, height);
	}

	/**
	 * Return the pixel buffer for this [ctx]
	 */
	PixelDataOperation.prototype.get = function(x, y, width, height)
	{
		x = x || 0;
		y = y || 0;
		width = width || this.element.width;
		height = height || this.element.height;
		return this.ctx.getImageData(x, y, width, height);
	}

	/**
	 * Place data back into the pixel buffer
	 */
	PixelDataOperation.prototype.put = function(data, x, y)
	{
		x = x || 0;
		y = y || 0;
		this.ctx.putImageData(data, x, y);
	}

	// ----------------------------------------------------- //
	// ------------- GLOBAL CANVAS CONSTRUCTOR ------------- //
	// ----------------------------------------------------- //

	/**
	 * A simple vector/raster graphics toolset for HTML5
	 * Canvas. Preexisting DOM canvas argument optional.
	 */
	function Canvas(element)
	{
		// Private:
		var _ = this;

		// Public:
		this.element = element || document.createElement('canvas');
		this.ctx = this.element.getContext('2d');

		/**
		 * Draw shapes/images/etc.
		 */
		this.draw =
		{
			circle: function(x, y, radius)
			{
				return new DrawOperation(_.ctx).circle(x, y, radius);
			},
			rectangle: function(x, y, width, height)
			{
				return new DrawOperation(_.ctx).rectangle(x, y, width, height);
			},
			image: function(source, x1, y1, width1, height1, x2, y2, width2, height2)
			{
				return new DrawOperation(_.ctx).image(source, x1, y1, width1, height1, x2, y2, width2, height2);
			}
		};

		/**
		 * Pixel data manipulation handlers
		 */
		this.data =
		{
			create: function(width, height)
			{
				return new PixelDataOperation(_.ctx, _.element).create(width, height);
			},
			get: function(x, y, width, height)
			{
				return new PixelDataOperation(_.ctx, _.element).get(x, y, width, height);
			},
			put: function(data, x, y)
			{
				return new PixelDataOperation(_.ctx, _.element).put(data, x, y);
			}
		};
	}
	
	/**
	 * Pixel region clearing
	 */
	Canvas.prototype.clear = function(x, y, width, height)
	{
		x = x || 0;
		y = y || 0;
		width = width || this.element.width;
		height = height || this.element.height;

		this.ctx.clearRect(x, y, width, height);

		return this;
	}

	/**
	 * Scale up Canvas image data without interpolation
	 */
	Canvas.prototype.scale = function(scalar)
	{
		// Only scale by whole number values
		scalar = Math.round(scalar);

		if (scalar < 2)
		{
			// Return self if not scaling at all
			return this;
		}

		// Clone self for copying a scaled
		// version back into pixel buffer
		var width = this.element.width;
		var height = this.element.height;
		var clone = new Canvas().setSize(width, height);
		clone.draw.image(this.element);
		var copy = clone.data.get();

		// Prepare data for rewriting
		this.setSize(scalar * width, scalar * height);
		var self = this.data.get();

		// Iterate over original image data
		for (var y = 0 ; y < height ; y++)
		{
			for (var x = 0 ; x < width ; x++)
			{
				// Source pixel for this coordinate
				var pixel = 4 * (y*width + x);
				
				var color =
				{
					red: copy.data[pixel],
					green: copy.data[pixel+1],
					blue: copy.data[pixel+2],
					alpha: copy.data[pixel+3]
				};

				// Offset for equivalent scaled canvas pixel
				var scaled_pixel = 4 * (y*scalar*scalar*width + x*scalar);

				for (var py = 0 ; py < scalar ; py++)
				{
					for (var px = 0 ; px < scalar ; px++)
					{
						// Target pixel in scaled data array
						var _pixel = scaled_pixel + 4*px + 4*py*scalar*width;
						// Write color data
						self.data[_pixel] = color.red;
						self.data[_pixel+1] = color.green;
						self.data[_pixel+2] = color.blue;
						self.data[_pixel+3] = color.alpha;
					}
				}
			}
		}

		// Write scaled data back into self
		this.data.put(self);

		return this;
	}

	/**
	 * Get Canvas dimensions
	 */
	Canvas.prototype.getSize = function()
	{
		return {
			width: this.element.width,
			height: this.element.height
		};
	}

	/**
	 * Change Canvas dimensions
	 */
	Canvas.prototype.setSize = function(width, height)
	{
		this.element.width = width;
		this.element.height = height;
		return this;
	}

	/**
	 * Set global Canvas compositing mode
	 */
	Canvas.prototype.setCompositing = function(type)
	{
		this.ctx.globalCompositeOperation = type;
		return this;
	}

	/**
	 * Set global Canvas rendering alpha
	 */
	Canvas.prototype.setAlpha = function(alpha)
	{
		this.ctx.globalAlpha = alpha;
		return this;
	}

	/**
	 * Translate Canvas origin to [x, y]
	 */
	Canvas.prototype.translate = function(x, y)
	{
		this.ctx.translate(x, y);
		return this;
	}

	/**
	 * Set Canvas rendering rotation angle in [radians]
	 */
	Canvas.prototype.rotate = function(radians)
	{
		this.ctx.rotate(radians);
		return this;
	}

	/**
	 * Save the Canvas context state
	 */
	Canvas.prototype.save = function()
	{
		this.ctx.save();
		return this;
	}

	/**
	 * Restore the Canvas context state to
	 * that of the previously saved instance
	 */
	Canvas.prototype.restore = function()
	{
		this.ctx.restore();
		return this;
	}

	scope.Canvas = Canvas;
})(window);