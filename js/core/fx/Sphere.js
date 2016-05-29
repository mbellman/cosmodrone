/**
 * -----------------
 * Component: Sphere
 * -----------------
 *
 * A static or rotating textured spherical body
 */
function Sphere()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var render = new Canvas();
	var render_IMG;
	var texture = new Canvas();
	var TEXTURE_W = 0;
	var TEXTURE_H = 0;
	var light = new Vector( -100, 10, -100 ).normalize( 1 );
	var ambience = 0.75;
	var diffusion = 0.75;
	var radius = 0;
	var resolution = 1;
	var paused = false;
	var position = {
		x: 0,
		y: 0
	};
	var rotation = {
		angle: 0,
		speed: 0
	};
	var maps = {
		UV: [],
		color: [],
		shadow: []
	};

	/**
	 * Return front-facing sphere surface point coordinates
	 * from two screen coordinates (both offset by -[radius])
	 */
	function get_sphere_coordinates( x, y )
	{
		return new Vector(
			-x,
			y,
			Math.sqrt( radius * radius - x * x - y * y )
		);
	}

	/**
	 * Return texture coordinates from 3
	 * spherical surface point coordinates
	 */
	function get_UV_coordinates( x, y, z )
	{
		return {
			u: 0.5 + ( Math.atan2( z, x ) / ( 2 * Math.PI ) ),
			v: 0.5 - ( Math.asin( y ) / Math.PI )
		};
	}

	/**
	 * Cache the color values for each pixel of the texture
	 */
	function build_color_map()
	{
		maps.color.length = 0;
		var image = texture.data.get();

		for ( var y = 0 ; y < TEXTURE_H ; y++ ) {
			for ( var x = 0 ; x < TEXTURE_W ; x++ ) {
				maps.color.push( image.read( image.getPixelIndex( x, ( TEXTURE_H - y - 1 ) ) ) );
			}
		}
	}

	/**
	 * Generate a transformation map from screen
	 * coordinates to texture coordinates
	 */
	function build_UV_map()
	{
		maps.UV.length = 0;
		var surface, UV;

		for ( var y = -radius ; y < radius ; y += resolution ) {
			for ( var x = -radius ; x < radius ; x += resolution ) {
				if ( Math.sqrt( x * x + y * y ) < radius ) {
					surface = get_sphere_coordinates( x, y ).normalize( 1 );
					UV = get_UV_coordinates( surface.n[0], surface.n[1], surface.n[2] );
					UV.u = UV.u * TEXTURE_W;
					UV.v = Math.floor( UV.v * TEXTURE_H ) % TEXTURE_H;
					maps.UV.push( UV );
				}
			}
		}
	}

	/**
	 * Cache the shadow map based on the [light_source] vector
	 */
	function build_shadow_map()
	{
		maps.shadow.length = 0;
		var surface, intensity, exponent, shadow;

		for ( var y = -radius ; y < radius ; y += resolution ) {
			for ( var x = -radius ; x < radius ; x += resolution ) {
				if ( Math.sqrt( x * x + y * y ) < radius ) {
					surface = get_sphere_coordinates( x, y ).normalize( 1 );
					intensity = Vector.dotProduct( light, surface );
					intensity = ( intensity < 0 ? -intensity : 0 );
					exponent = Math.pow( intensity, diffusion ) + ambience;
					shadow = clamp( ( 1 - exponent ) * 255, 0, 255 );
					maps.shadow.push( Math.floor( shadow ) );
				}
			}
		}
	}

	// -- Public: --
	this.update = function( dt, force_render )
	{
		if ( paused ) return;

		rotation.angle += ( rotation.speed * dt );
		rotation.angle = mod( rotation.angle, 360 );

		if (
			!force_render &&
			(
				radius <= 0 ||
				!_.owner.get( Sprite ).isOnScreen() ||
				_.owner.get( Sprite ).getProperAlpha() === 0
			)
		) {
			return;
		}

		var rotation_ratio = ( rotation.angle / 360 );
		var rotation_shift = rotation_ratio * TEXTURE_W;
		var i, j, m = 0, UV, shadow, color = {}, C_index, hue = {}, pixel;

		for ( var y = 0 ; y < render.element.height ; y += resolution ) {
			j = Math.pow( y - radius, 2 );

			for ( var x = 0 ; x < render.element.width ; x += resolution ) {
				i = Math.pow( x - radius, 2 );

				if ( Math.sqrt( i + j ) < radius ) {
					UV = maps.UV[m];
					shadow = maps.shadow[m];

					color.x = Math.floor( UV.u + rotation_shift ) % TEXTURE_W;
					color.y = UV.v;

					C_index = ( color.x + color.y * TEXTURE_W );
					color.RGB = maps.color[C_index];

					hue.red = color.RGB.red - 2 * shadow;
					hue.green = color.RGB.green - 2 * shadow;
					hue.blue = color.RGB.blue - shadow;
					hue.alpha = color.RGB.alpha;

					for ( var py = 0 ; py < resolution ; py++ ) {
						for ( var px = 0 ; px < resolution ; px++ ) {
							pixel = render_IMG.getPixelIndex( x + px, y + py );
							render_IMG.write( pixel, hue );
						}
					}

					m++;
				}
			}
		}

		render.data.put( render_IMG );
	};

	this.onAdded = function()
	{
		if ( !_.owner.has( Sprite ) ) {
			_.owner.add(
				new Sprite( render.element )
					.setXY( position.x, position.y )
					.centerOrigin()
			);
		}
	};

	/**
	 * Set the sphere's radius
	 */
	this.setRadius = function( _radius )
	{
		radius = _radius;
		render.setSize( 2 * radius, 2 * radius );
		render_IMG = render.data.get();
		return _;
	};

	/**
	 * Set the sphere's texture
	 */
	this.setTexture = function( asset )
	{
		texture.setSize( asset.width, asset.height );
		texture.draw.image( asset );
		TEXTURE_W = texture.element.width;
		TEXTURE_H = texture.element.height;
		return _;
	};

	/**
	 * Set the light source cast onto the sphere as a 3-vector
	 * (instantiate a Vector with three coordinate arguments)
	 */
	this.setLightSource = function( vec3 )
	{
		light.copy( vec3 ).normalize( 1 );
		return _;
	};

	/**
	 * Set the ambient light level
	 */
	this.setAmbientLight = function( _ambience )
	{
		ambience = _ambience;
		return _;
	};

	/**
	 * Set the sharpness of the light/shadow gradient
	 */
	this.setLightDiffusion = function( _diffusion )
	{
		diffusion = _diffusion;
		return _;
	};

	/**
	 * Set the initial rotation of the sphere
	 */
	this.setRotation = function( angle )
	{
		rotation.angle = mod( angle, 360 );
		return _;
	};

	/**
	 * Set the persistent rotation speed
	 */
	this.setRotationSpeed = function( speed )
	{
		rotation.speed = speed;
		return _;
	};

	/**
	 * Set the rendering resolution in pixels
	 */
	this.setResolution = function( _resolution )
	{
		resolution = _resolution;
		return _;
	};

	/**
	 * Set the [x, y] of the sphere (in turn updating its Sprite)
	 */
	this.setXY = function( x, y )
	{
		position.x = x;
		position.y = y;

		if ( _.owner !== null && _.owner.has( Sprite ) ) {
			_.owner.get( Sprite ).setXY( x, y );
		}

		return _;
	};

	/**
	 * Rebuild render maps
	 */
	this.render = function()
	{
		build_color_map();
		build_UV_map();
		build_shadow_map();

		if ( _.owner !== null && _.owner.has( Sprite ) ) {
			_.owner.get( Sprite ).centerOrigin();
		}

		return _;
	};

	/**
	 * Stop update cycle
	 */
	this.pause = function()
	{
		paused = false;
		// Force one render update to
		// ensure the sphere is shown
		_.update( 0.016, true );
		paused = true;
		return _;
	};

	/**
	 * Resume update cycle
	 */
	this.resume = function()
	{
		paused = false;
		return _;
	};
}