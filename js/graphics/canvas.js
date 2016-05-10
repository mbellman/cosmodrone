/**
 * A simple vector graphics toolset for the HTML5 Canvas.
 * Instantiate with a target canvas element as the argument.
 */
function Canvas(element) {
	// Private:
	var _ = this;
	var ctx = element.getContext('2d');

	/**
	 * Provides chainable fill() and stroke()
	 * methods to certain Canvas.draw operations
	 */
	function Shape()
	{
		var __ = this;

		this.fill = function(color)
		{
			if (color !== null) ctx.fillStyle = color;
			ctx.fill();
			return __;
		}

		this.stroke = function(color, thickness)
		{
			if (thickness !== null) ctx.lineWidth = (isNaN(thickness) ? 1 : thickness);
			if (color !== null) ctx.strokeStyle = color;
			ctx.stroke();
			return __;
		}
	}

	// Public:
	this.draw =
	{
		circle: function(x, y, radius)
		{
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2*Math.PI);
			return new Shape();
		},
		rectangle: function(x, y, width, height)
		{
			ctx.beginPath();
			ctx.rect(x, y, width, height);
			return new Shape();
		},
		image: function(source, x1, y1, width1, height1, x2, y2, width2, height2)
		{
			if (arguments.length === 1)
			{
				ctx.drawImage(source, 0, 0);
			}
			else
			if (arguments.length === 3)
			{
				ctx.drawImage(source, x1, y1);
			}
			else
			if (arguments.length === 5)
			{
				ctx.drawImage(source, x1, y1, width1, height1);
			}
			else
			if (arguments.length === 9)
			{
				ctx.drawImage(source, x1, y1, width1, height1, x2, y2, width2, height2);
			}
		}
	};

	this.data =
	{
		create: function(width, height)
		{
			width = width || element.width;
			height = height || element.height;
			return ctx.createImageData(width, height);
		},
		get: function(x, y, width, height)
		{
			x = x || 0;
			y = y || 0;
			width = width || element.width;
			height = height || element.height;
			return ctx.getImageData(x, y, width, height);
		},
		put: function(data, x, y)
		{
			x = x || 0;
			y = y || 0;
			ctx.putImageData(data, x, y);
		}
	};
	
	this.clear = function(x, y, width, height)
	{
		x = x || 0;
		y = y || 0;
		width = width || element.width;
		height = height || element.height;
		ctx.clearRect(x, y, width, height);
		return _;
	}

	this.scale = function(multiple)
	{
		multiple = Math.round(multiple);

		if (multiple < 2)
		{
			// Return self if not scaling at all
			return _;
		}

		// Create a new canvas with this instance's image data
		var image_w = element.width;
		var image_h = element.height;
		var clone_canvas = new Canvas(document.createElement('canvas')).setSize(image_w, image_h);
		clone_canvas.draw.image(element);
		var base_image = clone_canvas.data.get();

		// Prepare data for rewriting
		_.setSize(multiple*image_w, multiple*image_h);
		var scaled_image = _.data.get();

		// Iterate over original image data
		for (var y = 0 ; y < image_h ; y++)
		{
			for (var x = 0 ; x < image_w ; x++)
			{
				// Source pixel for this coordinate
				var pixel = 4 * (y*image_w + x);
				
				var color =
				{
					red: base_image.data[pixel],
					green: base_image.data[pixel+1],
					blue: base_image.data[pixel+2],
					alpha: base_image.data[pixel+3]
				};

				// Offset for equivalent scaled canvas pixel
				var scaled_pixel = 4 * (y*multiple*multiple*image_w + x*multiple);

				for (var py = 0 ; py < multiple ; py++)
				{
					for (var px = 0 ; px < multiple ; px++)
					{
						// Target pixel in scaled data array
						var _pixel = scaled_pixel + 4*px + 4*py*multiple*image_w;
						// Write color data
						scaled_image.data[_pixel] = color.red;
						scaled_image.data[_pixel+1] = color.green;
						scaled_image.data[_pixel+2] = color.blue;
						scaled_image.data[_pixel+3] = color.alpha;
					}
				}
			}
		}

		// Write scaled data back into self
		_.data.put(scaled_image);

		return _;
	}

	this.getSize = function()
	{
		return {
			width: element.width,
			height: element.height
		};
	}

	this.setSize = function(w, h)
	{
		element.width = w || element.width;
		element.height = h || element.height;
		return _;
	}

	this.translate = function(x, y)
	{
		ctx.translate(x, y);
		return _;
	}

	this.rotate = function(radians)
	{
		ctx.rotate(radians);
		return _;
	}

	this.composite = function(type)
	{
		ctx.globalCompositeOperation = type;
		return _;
	}

	this.alpha = function(alpha)
	{
		ctx.globalAlpha = alpha;
		return _;
	}

	this.save = function()
	{
		ctx.save();
		return _;
	}

	this.restore = function()
	{
		ctx.restore();
		return _;
	}

	this.element = function()
	{
		return element;
	}
}