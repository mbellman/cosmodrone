( function( scope ) {
	/**
	 * -------------------
	 * Class: TextureCache
	 * -------------------
	 *
	 * A group of prerendered equal-sized contiguous
	 * texture chunks comprising a larger texture
	 */
	function TextureCache()
	{
		// -- Private: --
		var _ = this;
		var TEXTURE_W = 0;
		var TEXTURE_H = 0;
		var divisions = 1;
		var chunks = [];
		var CHUNK_W = TEXTURE_W / divisions;
		var CHUNK_H = TEXTURE_H / divisions;

		// Extra space to add to each chunk to mitigate sub-pixel gaps
		var buffer = 1;

		/**
		 * Set up texture [chunks] array
		 */
		function create_chunks()
		{
			chunks.length = 0;

			for ( var y = 0 ; y < divisions ; y++ ) {
				chunks[y] = [];
			}
		}

		// -- Public: --
		/**
		 * Divide a large source [texture] into a
		 * grid of [divisions] x [divisions] chunks
		 */
		this.divide = function( texture, _divisions )
		{
			divisions = _divisions;
			create_chunks();

			TEXTURE_W = texture.width;
			TEXTURE_H = texture.height;

			CHUNK_W = TEXTURE_W / divisions;
			CHUNK_H = TEXTURE_H / divisions;

			var clip, chunk;

			for ( var y = 0 ; y < divisions ; y++ ) {
				for ( var x = 0 ; x < divisions ; x++ ) {
					clip = {
						x: ( x * CHUNK_W ),
						y: ( y * CHUNK_H ),
						width: CHUNK_W + buffer,
						height: CHUNK_H + buffer
					};

					chunk = new Canvas().setSize( clip.width, clip.height );

					chunk.draw.image(
						texture,
						clip.x, clip.y, clip.width, clip.height,
						0, 0, clip.width, clip.height
					);

					chunks[y][x] = chunk.element;
				}
			}

			return _;
		}

		/**
		 * Draw the texture [chunks] onto a target [canvas],
		 * beginning at clip position [clip_X, clip_Y] and
		 * tiling over the region [x, y, region_W, region_H]
		 */
		this.tileOnto = function( canvas, clip_X, clip_Y, x, y, region_W, region_H )
		{
			clip_X = clip_X || 0;
			clip_Y = clip_Y || 0;
			x = x || 0;
			y = y || 0;
			region_W = region_W || canvas.getSize().width;
			region_H = region_H || canvas.getSize().height;

			var pixel = {
				x: 0,
				y: 0
			};

			var coords = {}, chunk = {}, draw = {}, clip = {};
			var loops = 0;

			// Steps:
			// -----
			// 1. Get the [pixel] coordinate in original texture space
			// 2. Get the chunk this coordinate falls within
			// 3. Determine where to start clipping on the smaller chunk texture
			// 4. Get drawing coordinates
			// 5. Get partial clipping area width/height
			// 6. Render the partial clipped texture
			// 7. Advance pixel offset and continue
			// -----
			while ( pixel.x < region_W || pixel.y < region_H ) {
				if ( ++loops > 5000 ) {
					// Failsafe against infinite looping (only
					// occurs in the case of unusual [divisions]
					// due to floating point modulo errors)
					break;
				}

				coords.x = mod( pixel.x + clip_X, TEXTURE_W );
				coords.y = mod( pixel.y + clip_Y, TEXTURE_H );

				chunk.x = Math.floor( coords.x / CHUNK_W );
				chunk.y = Math.floor( coords.y / CHUNK_H );
				chunk.texture = chunks[chunk.y][chunk.x];

				clip.x = coords.x % CHUNK_W;
				clip.y = coords.y % CHUNK_H;

				draw.x = x + pixel.x,
				draw.y = y + pixel.y;

				// Clip width/height should stop either at the edge
				// of the chunk or the edge of the draw region
				clip.width = Math.min( CHUNK_W + buffer - clip.x, region_W - draw.x );
				clip.height = Math.min( CHUNK_H + buffer - clip.y, region_H - draw.y );

				canvas.draw.image(
					chunk.texture,
					clip.x, clip.y, clip.width + buffer, clip.height + buffer,
					draw.x, draw.y, clip.width + buffer, clip.height + buffer
				);

				pixel.x += clip.width;

				if ( pixel.x >= region_W ) {
					pixel.y += clip.height;

					if ( pixel.y < region_H ) {
						pixel.x = 0;
					}
				}
			}
		}
	}

	/**
	 * ----------------
	 * Component: Cloud
	 * ----------------
	 *
	 * Clouds above the terrain layer
	 */
	function Cloud()
	{
		Component.call( this );

		/**
		 * Source asset
		 */
		this.image;

		/**
		 * Shadow asset
		 */
		this.shadow;

		/**
		 * Cloud type by name
		 */
		this.type;
	}

	/**
	 * ---------------------
	 * Component: Background
	 * ---------------------
	 *
	 * A drifting planetary background layer beneath the game scene
	 */
	function Background()
	{
		Component.call( this );

		// -- Private: --
		var _ = this;

		var loaded = false;                                // Whether or not prerendering has finished, enabling the background cycle to start
		var terrain;                                       // Landscape instance
		var renders = {
			// Prerendered time-of-day terrain variants
			terrain: [],
			// Prerendered cloud types, scaled based on [configuration.tileSize]
			clouds: [],
			// Prerendered cloud shadows, scaled based on [configuration.tileSize]
			shadows: []
		};
		var camera;                                        // Scrolling background camera instance
		var clouds = [];                                   // Active cloud objects on screen
		var BG_stage;                                      // Top background is drawn here before being composited onto [screen.background] (see: render_BG())
		var cloud_stage;                                   // Clouds are drawn here before being composited onto [screen.clouds]
		var shadow_offset = {};                            // Offset for cloud shadows; determined via [configuration.lightAngle]
		var time_tween = new Tweenable( 0 );               // Tween object controlling the transition between hours
		var hours = new Cycle();                           // Time cycle manager
		var light_level = 0;                               // A decimal value between 0-12 representing the instantaneous day/night light level
		var light_color = {};                              // Based on [light_level]; used for coloring the cloud layer
		var cloud_cooldown = 0;                            // Jumps to 2000 when a cyclone is generated; once it counts down to 0 normal cloud spawning can resume
		var is_transitioning = true;                       // Set to false if [configuration.hours] has only one time specified
		var build_steps = 0;                               // Determined in build() by various configuration parameters
		var build_steps_complete = 0;                      // For passing back into the progress handler
		var configuration = default_configuration();       // Store default settings
		var cloud_bank = [                                 // Bank of information on cloud assets + types
			{
				file: 'cumulus-1',
				type: 'cumulus'
			},
			{
				file: 'cumulus-2',
				type: 'cumulus'
			},
			{
				file: 'cumulus-3',
				type: 'cumulus'
			},
			{
				file: 'cumulus-4',
				type: 'cumulus'
			},
			{
				file: 'cyclone-1',
				type: 'cyclone'
			},
			{
				file: 'cyclone-2',
				type: 'cyclone'
			},
			{
				file: 'small-cyclone-1',
				type: 'small_cyclone'
			},
			{
				file: 'heavy-cumulus-1',
				type: 'heavy_cumulus'
			},
			{
				file: 'heavy-cumulus-2',
				type: 'heavy_cumulus'
			},
			{
				file: 'heavy-cumulus-3',
				type: 'heavy_cumulus'
			},
			{
				file: 'small-cumulus-1',
				type: 'small_cumulus'
			},
			{
				file: 'small-cumulus-2',
				type: 'small_cumulus'
			},
			{
				file: 'cirrus-1',
				type: 'cirrus'
			},
			{
				file: 'cirrus-2',
				type: 'cirrus'
			},
			{
				file: 'cirrus-3',
				type: 'cirrus'
			},
			{
				file: 'cirrus-4',
				type: 'cirrus'
			},
			{
				file: 'cirrus-5',
				type: 'cirrus'
			},
			{
				file: 'cirrus-6',
				type: 'cirrus'
			},
			{
				file: 'cirrus-7',
				type: 'cirrus'
			},
			{
				file: 'cirrus-8',
				type: 'cirrus'
			},
			{
				file: 'cirrus-9',
				type: 'cirrus'
			},
		];

		/**
		 * Default instance configuration
		 */
		function default_configuration()
		{
			return {
				// Number of subdivisions for the heightmap fractal
				iterations: 6,
				// Maximum elevation for the heightmap
				elevation: 50,
				// Average heightmap point elevation as a percentage of the maximum
				concentration: 50,
				// Smoothness of the landscape, as a value from 1 - 20
				smoothness: 4,
				// Iterations of erosive processes after the primary heightmap is formed
				erosion: 1,
				// Whether or not to wrap the edges of the heightmap
				repeat: true,
				// Angle of the terrain's light source
				lightAngle: 220,
				// Number of cities across the landscape
				cities: 5,
				// Maximum city size
				maxCitySize: 4,
				// Pixel size to draw each background tile at
				tileSize: 2,
				// List of hours to prerender terrain variants from
				hours: [12],
				// Time in seconds for terrain time-of-day transitions
				cycleSpeed: 20,
				// Velocity to scroll background scene at in pixels per second
				scrollSpeed: {
					x: 0,
					y: 0
				},
				// Whether or not to snap rendering to the nearest whole pixel value
				pixelSnapping: false
			};
		};

		/**
		 * Determine how much to displace shadows beneath clouds
		 */
		function set_shadow_offset()
		{
			shadow_offset = {
				x: configuration.tileSize * 8 * Math.cos( configuration.lightAngle * Math.PI_RAD ) * -1,
				y: configuration.tileSize * 8 * Math.sin( configuration.lightAngle * Math.PI_RAD )
			};
		}

		/**
		 * Returns a randomly picked cloud of type [type]
		 */
		function random_cloud_index( type )
		{
			var loops = 0;
			var index = 0;

			while ( 1 ) {
				if ( ++loops > 5000 ) {
					// Halt the loop if we've cycled too many times
					break;
				}

				var cloud_data = cloud_bank[index];

				if ( Math.random() < 0.1 && cloud_data.type === type ) {
					// Pick this cloud
					break;
				}

				index = mod( index + 1, cloud_bank.length );
			}

			return index;
		}

		// ------------------------------------------ //
		// ------------- INITIALIZATION ------------- //
		// ------------------------------------------ //

		function init_complete()
		{
			BG_stage = new Canvas().setSize( Viewport.width, Viewport.height );
			cloud_stage = new Canvas().setSize( Viewport.width, Viewport.height );

			camera = new Point()
				.setVelocity( -1 * configuration.scrollSpeed.x, -1 * configuration.scrollSpeed.y );

			set_shadow_offset();
			spawn_cloud_layer();
			advance_bg_cycle();

			loaded = true;
		}

		// ------------------------------------------------ //
		// ------------- TEXTURE PRERENDERING ------------- //
		// ------------------------------------------------ //

		/**
		 * Prerender terrain at a specific hour
		 */
		function prerender_terrain_variant( hour )
		{
			terrain.setTime( hour );
			renders.terrain.push( new TextureCache().divide( terrain.canvas, 18 ) );
		}

		/**
		 * Prerender cloud + shadow pair
		 * scaled to [configuration.tileSize]
		 */
		function prerender_cloud_variant( cloud )
		{
			var file = cloud_bank[cloud].file;
			var type = cloud_bank[cloud].type;

			var cloud_asset = Assets.getImage( 'game/clouds/' + file + '.png' );
			var cloud_canvas = new Canvas()
				.setSize(cloud_asset.width, cloud_asset.height);

			cloud_canvas.draw.image( cloud_asset );
			cloud_canvas.scale( configuration.tileSize );
			renders.clouds.push( cloud_canvas );

			if ( type !== 'cirrus' ) {
				// Store shadow for normal clouds
				var shadow_asset = Assets.getImage( 'game/shadows/' + file + '.png' );
				var shadow_canvas = new Canvas()
					.setSize( shadow_asset.width, shadow_asset.height );

				shadow_canvas.draw.image( shadow_asset );
				renders.shadows.push( shadow_canvas.scale( configuration.tileSize ) );
			} else {
				// Store a blank entry for cirrus cloud shadows
				renders.shadows.push( null );
			}
		}

		/**
		 * Used for prerendering a sequence of Canvas instances on a delay
		 */
		function prerender_group( items, index, total, handler, progress, complete )
		{
			if ( index < total ) {
				if ( items !== null ) {
					var item = items[index];
				} else {
					var item = index;
				}

				setTimeout( function() {
					handler( item );

					if ( ++index <= total ) {
						progress( ++build_steps_complete, build_steps );
					}

					prerender_group( items, index, total, handler, progress, complete );
				}, 100 );

				return;
			}

			complete();
		}

		/**
		 * Prerender variants of the terrain to
		 * reflect important hours of the day
		 */
		function prerender_terrain_variants( handlers )
		{
			handlers.progress = handlers.progress || function(){};
			handlers.complete = handlers.complete || function(){};

			renders.terrain.length = 0;

			prerender_group(
				configuration.hours,
				0,
				configuration.hours.length,
				prerender_terrain_variant,
				handlers.progress,
				handlers.complete
			);
		}

		/**
		 * Stores each cloud/shadow image asset for
		 * rendering at the appropriate tile size
		 */
		function prerender_cloud_variants( handlers )
		{
			handlers.progress = handlers.progress || function(){};
			handlers.complete = handlers.complete || function(){};

			var c = 0;

			renders.clouds.length = 0;
			renders.shadows.length = 0;

			prerender_group(
				null,
				0,
				cloud_bank.length,
				prerender_cloud_variant,
				handlers.progress,
				handlers.complete
			);
		}

		// -------------------------------------------- //
		// ------------- CLOUD POPULATION ------------- //
		// -------------------------------------------- //

		/**
		 * Spawns a cloud from [cloud_bank] as specified
		 * by [index] and positions it at coordinate [x, y]
		 */
		function spawn_cloud( index, x, y )
		{
			var type = cloud_bank[index].type;
			var is_cirrus = ( type === 'cirrus' );
			var cloud_IMG = renders.clouds[index].element;
			var shadow_IMG = ( is_cirrus ? null : renders.shadows[index].element );
			var cloud = new Cloud();

			cloud.image = cloud_IMG;
			cloud.shadow = shadow_IMG;
			cloud.type = type;

			clouds.push(
				new Entity()
					.add( new Point()
						.setVelocity( configuration.scrollSpeed.x, configuration.scrollSpeed.y )
						.setPosition( x, y )
					)
					.add( cloud )
			);
		}

		/**
		 * Spawns a cyclone with surrounding cloud patches
		 */
		function spawn_cyclone( size, x, y )
		{
			var is_large_cyclone = ( size === 'large' );
			var index = random_cloud_index( ( is_large_cyclone ? 'cyclone' : 'small_cyclone' ) );
			var cyclone_size = renders.clouds[index].getSize();

			// Position the cyclone eye at [x, y]
			var position = {
				x: x - Math.round( cyclone_size.width / 2 ),
				y: y - Math.round( cyclone_size.height / 2 )
			};

			spawn_cloud( index, position.x, position.y );

			// Set a starting offset angle
			var angle = Math.random() * 2 * Math.PI;
			var type, cloud_size, half_W, half_H, cloud_radius, magnitude, cloud_offset = {};

			// Draw surrounding clouds in two rings; loop around once for clouds
			// near the storm, and again for more distant smaller clouds
			for ( var i = 0 ; i < 2 ; i++ ) {
				var cloud_count = (
					i === 0 ?
						random( 7, 9 )
					:
						random( 13, 16 )
				);

				for ( var g = 0 ; g < cloud_count ; g++ ) {
					if ( is_large_cyclone ) {
						type = (
							( i === 0 ) ?
								pick_random( 'cumulus', 'heavy_cumulus' )
							:
								pick_random( 'cumulus', 'small_cumulus' )
						);
					} else {
						type = ( i === 0 ? 'cumulus' : 'small_cumulus' );
					}

					index = random_cloud_index( type );
					cloud_size = renders.clouds[index].getSize();

					half_W = cloud_size.width / 2;
					half_H = cloud_size.height / 2;

					// Use the cloud center-to-corner length
					// as a 'radius' to provide extra padding
					cloud_radius = Math.sqrt( half_W * half_W + half_H * half_H );

					// Cloud offset vector magnitude formula
					magnitude = ( i + 1 ) * ( is_large_cyclone ? 0.6 : 0.52 ) * ( cyclone_size.width / 2 + cloud_radius );

					cloud_offset.x = Math.round( magnitude * Math.cos( angle ) );
					cloud_offset.y = Math.round( magnitude * Math.sin( angle ) ) * -1;

					spawn_cloud( index, x - half_W + cloud_offset.x, y - half_H + cloud_offset.y );

					angle += ( ( 2 * Math.PI ) / cloud_count );
				}
			}
		}

		/**
		 * Spawns the initial cloud cover layer
		 */
		function spawn_cloud_layer()
		{
			var tile_size = terrain.getTileSize();
			var map_size = terrain.getSize();
			var type, index, position = {};

			for ( var c = 0 ; c < 30 ; c++ ) {
				type = pick_random( 'cumulus', 'heavy_cumulus', 'small_cumulus', 'cirrus', 'cirrus' );
				index = random_cloud_index( type );

				position.x = random( -600, Viewport.width + 600 );
				position.y = random( -600, Viewport.height + 600 );

				spawn_cloud( index, position.x, position.y );
			}
		}

		/**
		 * Repopulates clouds to where they can scroll into view
		 */
		function respawn_clouds()
		{
			var BG_velocity = camera.getVelocity();
			var BG_speed = camera.getAbsoluteVelocity();
			var screen_area = Viewport.width * Viewport.height;
			var screen_area_ratio = screen_area / 720000;
			var spawn_probability = screen_area_ratio * 0.00015 * BG_speed;

			// Don't generate a new cloud if...
			if (
				// ...[spawn_probability] limit isn't hit...
				Math.random() > spawn_probability ||
				// ...the background isn't scrolling...
				( BG_velocity.x === 0 && BG_velocity.y === 0 ) ||
				// ...or the spawn cooldown is still active
				cloud_cooldown > 0
			) {
				return;
			}

			var spawn = {
				x: 0,
				y: 0
			};

			var type, index, size, spawn_offset = {};

			if ( Math.random() > 0.02 ) {
				// 98% chance of generating a normal cloud
				// (higher chance of picking cirrus clouds)
				type = pick_random( 'cumulus', 'heavy_cumulus', 'small_cumulus', 'cirrus', 'cirrus', 'cirrus' );
				index = random_cloud_index( type );
				size = renders.clouds[index].getSize();

				spawn_offset.x = 0;
				spawn_offset.y = 0;
			} else {
				// 2% chance of generating a cyclone
				index = pick_random( 'large', 'small' );

				size = {
					width: 0,
					height: 0
				};

				spawn_offset.x = ( index === 'large' ? 1350 : 1200 );
				spawn_offset.y = ( index === 'large' ? 1350 : 1200 );

				cloud_cooldown = 2000;
			}

			// Determine where to place next cloud
			if ( Math.abs( BG_velocity.x ) > Math.abs( BG_velocity.y ) ) {
				// Background scrolling faster horizontally than vertically
				spawn.y = random( 0 - size.height, Viewport.height );
				// Scrolling right
				if ( BG_velocity.x > 0 ) spawn.x = Viewport.width + spawn_offset.x;
				// Scrolling left
				if ( BG_velocity.x < 0 ) spawn.x = 0 - size.width - spawn_offset.x;
			} else {
				// Background scrolling faster vertically than horizontally
				spawn.x = random( 0 - size.width, Viewport.width );
				// Scrolling down
				if ( BG_velocity.y > 0 ) spawn.y = Viewport.height + spawn_offset.y;
				// Scrolling up
				if ( BG_velocity.y < 0 ) spawn.y = 0 - size.height - spawn_offset.y;
			}

			if ( isNaN( index ) ) {
				// Cyclone
				spawn_cyclone( index, spawn.x, spawn.y );
			} else {
				// Normal cloud
				spawn_cloud( index, spawn.x, spawn.y );
			}
		}

		/**
		 * Determines whether a cloud has scrolled out of view
		 */
		function cloud_moved_offscreen( c )
		{
			var cloud = clouds[c];
			var point = cloud.get( Point );
			var position = point.getPosition();
			var velocity = point.getVelocity();
			var image = cloud.get( Cloud ).image;

			return (
				// Cloud scrolled off left edge
				( velocity.x < 0 && position.x + image.width < 0 ) ||
				// Cloud scrolled off right edge
				( velocity.x > 0 && position.x > Viewport.width ) ||
				// Cloud scrolled off top edge
				( velocity.y < 0 && position.y + image.height < 0 ) ||
				// Cloud scrolled off bottom edge
				( velocity.y > 0 && position.y > Viewport.height )
			);
		}

		// ---------------------------------------- //
		// ------------- RENDER CYCLE ------------- //
		// ---------------------------------------- //

		/**
		 * Updates [light_level] based on the time transition
		 */
		function update_light_level()
		{
			if ( !is_transitioning ) {
				light_level = Math.abs( 12 - configuration.hours[0] );
				return;
			}

			var last_hour = hours.previous();
			var next_hour = hours.current();

			var transition_gap = (
				next_hour >= last_hour ?
					( next_hour - last_hour )
				:
					( 24 - last_hour + next_hour )
			);
			var granular_time = ( last_hour + time_tween.progress() * transition_gap ) % 24;

			light_level = Math.abs( 12 - granular_time );
		}

		/**
		 * Updates [light_color] based on [light_level]
		 * (used for cloud layer color compositing)
		 */
		function update_light_color()
		{
			var light_ratio = light_level / 12;
			
			var red = Math.pow( light_ratio, 4 );
			var green = Math.sqrt( light_ratio );
			var blue = Math.pow( light_ratio, 1/3 );

			light_color.red = 200 - Math.round( red * 180 );
			light_color.green = 200 - Math.round( green * 160 );
			light_color.blue = 200 - Math.round( blue * 40 );
		}

		/**
		 * Sets the new time-of-day background in
		 * front with opacity 0 and fades it in
		 * (called at startup and self-invokes
		 * once the time transition completes)
		 */
		function advance_bg_cycle()
		{
			if ( !is_transitioning ) {
				update_light_level();
				update_light_color();
				return;
			}

			hours.advance( 1 );

			time_tween._ = 0;
			time_tween.tweenTo( 1, configuration.cycleSpeed, Ease.linear, advance_bg_cycle );
		}

		/**
		 * Tile the prerendered background terrain across the screen
		 */
		function render_BG()
		{
			var camera_X = camera.getPosition().x;
			var camera_Y = camera.getPosition().y;

			if ( !is_transitioning ) {
				renders.terrain[0].tileOnto( screen.background, camera_X, camera_Y );
				return;
			}

			var bottom_BG = renders.terrain[hours.previousStep()];
			var top_BG = renders.terrain[hours.step()];

			// The time transition effect involves drawing the lower
			// BG layer first, and the upper (transitioning) layer
			// on top of it with an alpha value. Since TextureCache's
			// tiling routine applies a little extra padding to each
			// chunk to avoid sub-pixel gaps, this would cause the
			// contiguous chunk edges to blend due to their partial
			// transparency, yielding brighter or darker lines. To
			// resolve this we draw the upper layer at full opacity
			// to a separate stage Canvas, and then draw that to
			// [screen.background] with the appropriate alpha value.
			top_BG.tileOnto( BG_stage, camera_X, camera_Y );

			bottom_BG.tileOnto( screen.background, camera_X, camera_Y );
			screen.background.setAlpha( time_tween.progress() );
			screen.background.draw.image( BG_stage.element );
			screen.background.setAlpha( 1 );
		}

		/**
		 * Render all clouds above the terrain scene
		 * (shadows are rendered to the BG screen to
		 * avoid cloud layer color-compositing errors)
		 */
		function render_clouds()
		{
			screen.clouds.clear();

			if ( is_transitioning) {
				update_light_color();
			}

			screen.clouds
				.setCompositing( 'source-over' )
				.setAlpha( 0.7 )
				.draw.rectangle( 0, 0, Viewport.width, Viewport.height )
				.fill( rgb( light_color.red, light_color.green, light_color.blue ) );

			// Cloud/shadow rendering
			var VIEWPORT_HALF_W = Viewport.width / 2;
			var VIEWPORT_HALF_H = Viewport.height / 2;
			var CIRRUS_PARALLAX = ( 40 / VIEWPORT_HALF_W );
			var NORMAL_PARALLAX = ( 15 / VIEWPORT_HALF_H );
			var cloud, position, image, shadow, parallax, offset = {}, draw = {};

			for ( var c = 0 ; c < clouds.length ; c++ ) {
				cloud = clouds[c];
				position = cloud.get( Point ).getPosition( configuration.pixelSnapping );
				cloud = cloud.get( Cloud );
				image = cloud.image;
				shadow = cloud.shadow;
				parallax = ( cloud.type === 'cirrus' ? CIRRUS_PARALLAX : NORMAL_PARALLAX );

				if ( shadow !== null ) {
					draw.x = position.x + shadow_offset.x;
					draw.y = position.y + shadow_offset.y;

					if ( Sprite.isOnScreen( draw.x, draw.y, shadow.width, shadow.height ) ) {
						screen.background.draw.image( shadow, draw.x, draw.y );
					}
				}

				offset.x = ( position.x + image.width / 2 - VIEWPORT_HALF_W ) * parallax;
				offset.y = ( position.y + image.height / 2 - VIEWPORT_HALF_H ) * parallax;

				draw.x = position.x + offset.x;
				draw.y = position.y + offset.y;

				if ( Sprite.isOnScreen( draw.x, draw.y, image.width, image.height ) ) {
					cloud_stage.draw.image( image, draw.x, draw.y );
				}
			}

			// Composite [cloud_stage] onto the primary cloud screen
			screen.clouds.setCompositing( 'destination-atop' ).setAlpha( 1 );
			screen.clouds.draw.image( cloud_stage.element );
			cloud_stage.clear();
		}

		/**
		 * Render all layers
		 */
		function render_all()
		{
			render_BG();
			render_clouds();
		}

		// -- Public: --
		this.update = function( dt )
		{
			if ( loaded ) {
				camera.update( dt );

				var c = 0;
				while ( c < clouds.length ) {
					if ( cloud_moved_offscreen( c ) ) {
						clouds.splice( c, 1 );
						continue;
					}
					
					clouds[c++].update( dt );
				}

				if ( is_transitioning ) {
					time_tween.update( dt );
					update_light_level();
				}

				render_all();
				respawn_clouds();

				// Lower cloud respawn cooldown so
				// clouds can continue generating
				cloud_cooldown -= camera.getAbsoluteVelocity() * dt;
			}
		};

		this.onRemoved = function()
		{
			time_tween.stop();
		};

		/**
		 * Set configuration options
		 */
		this.configure = function( _configuration )
		{
			configuration = _configuration;
			var defaults = default_configuration();

			for ( var key in defaults ) {
				if ( !configuration.hasOwnProperty( key ) ) {
					configuration[key] = defaults[key];
				}
			}

			return _;
		};

		/**
		 * Generate the Background with progress/completion [handlers]
		 */
		this.build = function( handlers )
		{
			handlers = handlers || {};
			handlers.progress = handlers.progress || function(){};
			handlers.complete = handlers.complete || function(){};

			hours.merge( configuration.hours );
			build_steps = cloud_bank.length + configuration.hours.length;
			is_transitioning = ( configuration.hours.length > 1 );

			terrain = new Terrain()
				.build(
					{
						iterations: configuration.iterations,
						elevation: configuration.elevation,
						concentration: configuration.concentration,
						smoothness: configuration.smoothness,
						repeat: configuration.repeat
					}
				)
				.setLightAngle( configuration.lightAngle )
				.setCityCount( configuration.cities )
				.setMaxCitySize( configuration.maxCitySize )
				.setTileSize( configuration.tileSize )
				.renderLandscape();

			// Scale all [cloud_bank] cloud/shadow assets proportionally with
			// [configuration.tileSize] and store them as Canvas instances
			prerender_cloud_variants(
				{
					progress: handlers.progress,
					complete: function() {
						// Prerender terrain at different times of day
						prerender_terrain_variants(
							{
								progress: handlers.progress,
								complete: function() {
									init_complete();
									handlers.complete();
								}
							}
						);
					}
				}
			);

			return _;
		};
	}

	scope.Background = Background;
} )( window );