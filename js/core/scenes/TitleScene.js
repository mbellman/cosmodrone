/**
 * ---------------------
 * Component: TitleScene
 * ---------------------
 *
 * Sets up the game's title scene
 */
function TitleScene( controller )
{
	Component.call( this );

	// Private:
	var _ = this;

	/**
	 * Core variables
	 */
	var menu = 1;
	var stage = new Entity();
	var props = {};
	var slide = 1.5;

	/**
	 * Level select menu
	 */

	// Current zone
	var mission_zone = 'earth';

	// Panning offsets for each zone
	var zone_offsets = {
		earth: 0,
		moon: 1500,
		DEEP_SPACE_1: 2500,
		mars: 5000
	};

	// Planet locations/sizes
	var planets = {
		earth: {x: 740, y: 325, radius: 230},
		moon: {x: 2240, y: 325, radius: 100},
		mars: {x: 5740, y: 325, radius: 180}
	};

	// Orbital paths taken by each station (static positions
	// denoted by [x, y] coordinates in lieu of orbital parameters)
	var station_orbits = {
		1: {zone: 'earth', width: 600, height: 100, period: 12, inclination: 23},
		2: {zone: 'earth', width: 700, height: 150, period: 14, inclination: -37},
		3: {zone: 'earth', width: 550, height: 300, period: 11, inclination: 48},
		4: {zone: 'earth', width: 525, height: 200, period: 10, inclination: -17},
		5: {zone: 'moon', width: 235, height: 125, period: 5, inclination: 30},
		6: {zone: 'DEEP_SPACE_1', x: 3050, y: 150},
		7: {zone: 'DEEP_SPACE_1', x: 3400, y: 500},
		8: {zone: 'mars', width: 420, height: 250, period: 8, inclination: -29}
	};

	// Level preview summaries
	var level_text = {
		1: 'Level One...that\'s which level this is!',
		2: 'Level Two...that\'s which level this is!',
		3: 'Level Three...that\'s which level this is!',
		4: 'Level Four...that\'s which level this is!',
		5: 'Level Five...that\'s which le...v...[br]s-sorry...',
		6: 'Where the heck is this?!!??!',
		7: 'Whoa...there\'s nothing out here!!!![br]OOoooOOOoooOhhh noOOOoooOOo!!!!',
		8: 'Next stop...Mars!',
	};

	/**
	 * List of props and properties to be
	 * tweened when navigating between menus
	 *
	 * TODO: Organize this more nicely!
	 */
	var transitions = {
		// To title screen
		1: {
			sky: {tween: 'y', to: ( -1200 + Viewport.height ), time: slide, ease: Ease.quad.inOut},
			nova: {tween: 'y', to: -50, time: slide, ease: Ease.quad.inOut},
			nova2: {tween: 'y', to: -50, time: slide, ease: Ease.quad.inOut},
			stars: {tween: 'alpha', to: 0.2, time: slide, ease: Ease.quad.out},
			ground: {tween: 'y', to: ( Viewport.height - 208 ), time: slide, ease: Ease.quad.inOut},
			logo: {tween: 'alpha', to: 1, time: slide, ease: Ease.quad.in},
			starlogo: {tween: 'alpha', to: 1, time: slide, ease: Ease.quad.in},
			TITLE_MENU: {tween: 'alpha', to: 1, time: slide, ease: Ease.quad.out},
			LEVEL_MENU: {tween: 'y', to: -Viewport.height, time: slide, ease: Ease.quad.inOut }
		},
		// To level select
		2: {
			sky: {tween: 'y', to: ( Viewport.height - 100 ), time: slide, ease: Ease.quad.inOut},
			nova: {tween: 'y', to: 0, time: slide, ease: Ease.quad.inOut},
			nova2: {tween: 'y', to: 0, time: slide, ease: Ease.quad.inOut},
			stars: {tween: 'alpha', to: 1, time: slide, ease: Ease.quad.out},
			ground: {tween: 'y', to: 2 * Viewport.height, time: slide, ease: Ease.quad.inOut},
			logo: {tween: 'alpha', to: 0, time: slide, ease: Ease.quad.out},
			starlogo: {tween: 'alpha', to: 0, time: slide, ease: Ease.quad.in},
			TITLE_MENU: {tween: 'alpha', to: 0, time: ( slide / 2 ), ease: Ease.quad.out},
			LEVEL_MENU: {tween: 'y', to: 0, time: slide, ease: Ease.quad.inOut, callback: resume_sphere_rotation }
		}
	};

	// --------------------------------------- //
	// ------------- SCENE SETUP ------------- //
	// --------------------------------------- //

	/**
	 * Creates and returns a twinkling star entity
	 */
	function create_twinkling_star( type, x, y )
	{
		return new Entity()
			.add(
				new Sprite( Assets.getImage( 'title/star' + type + '.png' ) )
					.setXY( x, y )
			)
			.add(
				new Flicker()
					.setAlphaRange( 0.5, 1.0 )
					.setTimeRange( 0.2, 0.5 )
			);
	}

	/**
	 * Set up background + foreground layers
	 */
	function add_backdrop()
	{
		stage.addChild(
			new Entity().add(
				new FillSprite( '#000', Viewport.width, Viewport.height )
			)
		);

		props.nova = new Entity().add(
			new Sprite( Assets.getImage( 'title/nova1.png' ) ).setXY( 0, -50 )
		);
		props.nova2 = new Entity().add(
			new Sprite( Assets.getImage( 'title/nova2.png' ) ).setXY( 0, -50 )
		);
		props.sky = new Entity().add(
			new Sprite( Assets.getImage( 'title/sky.png' ) ).setXY( 0, -1200 + Viewport.height )
		);
		props.stars = new Entity().add(
			new Sprite( Assets.getImage( 'title/starfield.png' ) ).setAlpha( 0.2 )
		);
		props.ground = new Entity().add(
			new Sprite( Assets.getImage( 'title/ground.png' ) ).setXY( 0, Viewport.height - 208 )
		);
	}

	/**
	 * Introduces the game title with an animation
	 */
	function add_title()
	{
		var stars = {
			x: [55, 145, 205, 335, 410, 485, 555, 660, 740, 830, 910],
			y: [30, 150, 80, 120, 135, 80, 80, 70, 80, 130, 20],
			type: ['1', '3', '2', '1', '2', '3', '2', '3', '1', '2', '1']
		};

		var logo = {
			x: [10, 182, 276, 354, 455, 548, 632, 724, 816, 900],
			y: [0, 35, 35, 36, 35, 35, 37, 35, 37, 35],
			characters: ['c', 'o', 's', 'm', 'o2', 'd', 'r', 'o3', 'n', 'e']
		}

		// ----------------------------

		props.starlogo = new Entity().add(
			new Sprite().setXY( 90, 90 )
		);

		for ( var t = 0 ; t < stars.x.length ; t++ ) {
			props.starlogo.addChild(
				create_twinkling_star( stars.type[t], stars.x[t], stars.y[t] )
			);
		}

		// ----------------------------

		props.logo = new Entity().add(
			new Sprite().setXY( 90, 120 )
		);

		for ( var c = 0 ; c < logo.characters.length ; c++ ) {
			var character = logo.characters[c];
			var entity = new Entity()
				.add(
					new Sprite( Assets.getImage( 'title/letters/' + character + '.png' ) )
						.setXY( logo.x[c], logo.y[c] )
						.setAlpha( 0 )
				);

			entity.get( Sprite ).alpha
				.delay( 0.75 + ( c * 0.1 ) )
				.tweenTo( 1, 1.5, Ease.quad.in );

			props.logo.addChild( entity );
		}
	}

	/**
	 * Add all [props] entities to [stage]
	 */
	function stage_all_props()
	{
		for ( var p in props ) {
			if ( props.hasOwnProperty( p ) ) {
				stage.addChild( props[p] );
			}
		}
	}

	// -------------------------------------- //
	// ------------- MENU SETUP ------------- //
	// -------------------------------------- //

	/**
	 * Set up the title screen options
	 */
	function add_title_menu()
	{
		props.TITLE_MENU = new Entity()
			.add(
				new Sprite().setXY( 465, 375 ).setAlpha( 0 )
			)
			.add(
				new Menu( 'list' )
					.configure(
						{
							font: 'Monitor',
							options: {
								'STATION SELECT': view_level_select,
								'STATION BUILDER': null,
								'CREDITS': null
							},
							sounds: {
								cursor: Assets.getAudio( 'ui/chime1.wav' ),
								select: Assets.getAudio( 'ui/select1.wav' ),
								invalid: Assets.getAudio( 'ui/error1.wav' )
							},
							cursor: Assets.getImage( 'ui/drone-cursor.png' ),
							cursorOffset: {
								x: -40,
								y: 2
							},
							align: 'center',
							lineHeight: 40
						}
					)
			);

		props.TITLE_MENU.get( Sprite ).alpha
			.delay( 2.5 )
			.tweenTo( 1, 1.0, Ease.quad.in );
	}

	/**
	 * Set up the level selection menu
	 */
	function add_level_menu()
	{
		var STATION_ICON = Assets.getImage( 'title/level-select/station-icon.png' );
		var STATION_ICON_SELECTED = Assets.getImage( 'title/level-select/station-icon-selected.png' );
		var EARTH_TEXTURE = Assets.getImage( 'title/level-select/earth.png' );
		var MOON_TEXTURE = Assets.getImage( 'title/level-select/moon.png' );
		var MARS_TEXTURE = Assets.getImage( 'title/level-select/mars.png' );

		/**
		 * Creates a pair of foreground/background
		 * ellipse assets for orbital path rendering
		 */
		function INTERNAL_build_orbit_path( width, height )
		{
			var orbit = new VectorSprite();
			var orbit_BG, orbit_FG;
			var w2 = ( width / 2) , h2 = ( height / 2 );
			var glow = 6;

			orbit.sprite.setSize( width + 2 * glow, height + 2 * glow );
			orbit.sprite.setShadow( '#0ff', glow );
			orbit.sprite.draw
				.ellipse( w2 + glow, h2 + glow, width, height )
				.stroke( '#0ff', 2 );

			orbit_BG = new Canvas().setSize( orbit.getWidth(), orbit.getHeight() / 2);
			orbit_FG = new Canvas().setSize( orbit.getWidth(), orbit.getHeight() / 2);

			orbit_BG.draw.image( orbit.sprite.element );
			orbit_FG.draw.image( orbit.sprite.element, 0, -orbit.getHeight() / 2 );

			return {
				bg: orbit_BG.element,
				fg: orbit_FG.element
			};
		}

		/**
		 * Change the [alpha] of an orbital line path specified by its orbit [index]
		 */
		function INTERNAL_set_orbit_alpha( index, alpha )
		{
			var orbit_BG = orbits_BG.child( index );
			var orbit_FG = orbits_FG.child( index );

			if (
				( orbit_BG !== null && orbit_BG.get( Sprite ) !== null ) &&
				( orbit_FG !== null && orbit_FG.get( Sprite ) !== null )
			) {
				orbit_BG.get( Sprite ).alpha.tweenTo( alpha, 0.5, Ease.quad.out );
				orbit_FG.get( Sprite ).alpha.tweenTo( alpha, 0.5, Ease.quad.out );
			}
		}

		/**
		 * Set stations around their orbits or simply put them into static position
		 */
		function INTERNAL_set_station( station )
		{
			var orbit = station_orbits[station];
			var zone = orbit.zone;
			var planet = planets[zone];

			if ( orbit.width && orbit.height ) {
				// Station has an orbital path
				var ellipse = INTERNAL_build_orbit_path( orbit.width, orbit.height );

				orbits_BG.addChild( new Entity()
					.add(
						new Sprite( ellipse.bg )
							.setXY( planet.x, planet.y )
							.setOrigin( ellipse.bg.width / 2, ellipse.bg.height )
							.setRotation( orbit.inclination )
							.setAlpha( 0.2 )
					)
				);

				orbits_FG.addChild( new Entity()
					.add(
						new Sprite( ellipse.fg )
							.setXY( planet.x, planet.y )
							.setOrigin( ellipse.fg.width / 2, 0 )
							.setRotation( orbit.inclination )
							.setAlpha( 0.2 )
					)
				);

				space_stations.child( station - 1 )
					.add(
						new Oscillation( orbit.width, orbit.height, true )
							.setAnchor( planet.x, planet.y )
							.setPeriod( orbit.period )
							.setRotation( orbit.inclination )
							.setStart( Math.random() * 2 * Math.PI )
							.whileMoving( function( sprite, angle ) {
								if ( angle > Math.PI ) {
									var is_hidden = ( Vec2.distance( sprite.x._, sprite.y._, planet.x, planet.y ) < planet.radius );

									if ( !sprite.alpha.isTweening() ) {
										sprite.alpha.tweenTo( ( is_hidden ? 0.2 : 1 ), 0.25, Ease.quad.out );
									}
								}
							} )
					);
			} else
			if ( orbit.x && orbit.y ) {
				// Station is...stationary!
				space_stations.child( station - 1 ).get( Sprite ).setXY( orbit.x, orbit. y );

				// Continue to fill orbit path container entities to prevent index gaps
				orbits_BG.addChild( new Entity() );
				orbits_FG.addChild( new Entity() );
			}
		}

		// Orbital paths and space stations
		var orbits_BG = new Entity();
		var orbits_FG = new Entity();
		var space_stations = new Entity();
		var station_total = 0;

		for ( var station in station_orbits ) {
			if ( station_orbits.hasOwnProperty( station ) ) {
				station_total++;

				space_stations.addChild(
					new Entity()
						.add(
							new Sprite( STATION_ICON ).centerOrigin()
						)
				);

				INTERNAL_set_station( station );
			}
		}

		// Container for planets/moons, orbital paths, and station icons
		var space = new Entity()
			.add( new Sprite() )
			.addChild( orbits_BG )
			.addChild(
				new Entity()
					.add(
						new Sphere()
							.setRadius( planets.earth.radius )
							.setTexture( EARTH_TEXTURE )
							.setAmbientLight( 0.4 )
							.setRotationSpeed( -8 )
							.setResolution( 2 )
							.setXY( planets.earth.x, planets.earth.y )
							.render()
					),
				new Entity()
					.add(
						new Sphere()
							.setRadius( planets.moon.radius )
							.setTexture( MOON_TEXTURE )
							.setAmbientLight( 0.1 )
							.setLightDiffusion( 0.1 )
							.setRotationSpeed( -2 )
							.setResolution( 2 )
							.setXY( planets.moon.x, planets.moon.y )
							.render()
					),
				new Entity()
					.add(
						new Sphere()
							.setRadius( planets.mars.radius )
							.setTexture( MARS_TEXTURE )
							.setAmbientLight( 0.6 )
							.setLightDiffusion( 0.5 )
							.setRotationSpeed( -8 )
							.setResolution( 2 )
							.setXY( planets.mars.x, planets.mars.y )
							.render()
					)
			)
			.addChild( orbits_FG )
			.addChild( space_stations );

		// Level information pane
		var pane = new Entity( 'pane' )
			.add(
				new Sprite().setXY( -300, 110 )
			)
			.addChild(
				new Entity()
					.add(
						new Sprite( Assets.getImage( 'title/level-select/pane-glow.png' ) )
					)
					.add(
						new Flicker()
							.setAlphaRange( 0.1, 0.25 )
							.setTimeRange( 0.2, 0.5 )
					)
			)
			.addChild(
				new Entity().add(
					new Sprite( Assets.getImage( 'title/level-select/pane.png' ) )
				)
			);

		// Level description text
		var text = new Entity()
			.add(
				new Sprite().setXY( 25, 50 )
			)
			.add(
				new TextPrinter( 'Monitor' )
					.setSound( Assets.getAudio( 'ui/blip1.wav' ), Assets.getAudio( 'ui/blip2.wav' ) )
					.setInterval( 25 )
			)
			.addToParent( pane );

		// Off-screen Menu component for navigation
		var menu = new Entity()
			.add(
				new Menu( 'grid' )
					.configure(
						{
							items: station_total,
							options: function( i ) {
								return new Entity().add(
									new Sprite().setXY( 20 * i, 0 )
								);
							},
							onFocus: function( entity, i ) {
								space_stations.child( i ).get( Sprite )
									.setSource( STATION_ICON_SELECTED )
									.centerOrigin();

								INTERNAL_set_orbit_alpha( i, 1 );
								text.find( TextPrinter ).print( level_text[++i] );

								if ( station_orbits[i].zone !== mission_zone ) {
									mission_zone = station_orbits[i].zone;

									pause_sphere_rotation();
									space.get( Sprite ).x.tweenTo(
										-1 * zone_offsets[mission_zone],
										1.5,
										Ease.quad.inOut,
										resume_sphere_rotation
									);
								}
							},
							onUnFocus: function( entity, i ) {
								space_stations.child( i ).get( Sprite ).setSource( STATION_ICON ).centerOrigin();
								INTERNAL_set_orbit_alpha( i, 0.2 );
							},
							onSelect: function( entity, i ) {
								if ( i < 1 ) {
									return true;
								}

								return false;
							},
							sounds: {
								cursor: Assets.getAudio( 'ui/chime1.wav' ),
								select: Assets.getAudio( 'ui/select1.wav' ),
								invalid: Assets.getAudio( 'ui/error1.wav' )
							}
						}
					)
			);

		props.LEVEL_MENU = new Entity()
			.add( new Sprite().setXY( 0, -Viewport.height ) )
			.addChild( space, pane, menu );
	}

	/**
	 * Temporarily stop sphere rotation during panning
	 */
	function pause_sphere_rotation()
	{
		props.LEVEL_MENU.forAllComponentsOfType( Sphere, function( sphere ) {
			sphere.pause();
		} );
	}

	/**
	 * Resume sphere rotation after panning completes
	 */
	function resume_sphere_rotation()
	{
		props.LEVEL_MENU.forAllComponentsOfType( Sphere, function( sphere ) {
			sphere.resume();
		} );
	}

	// -------------------------------------------- //
	// ------------- MENU TRANSITIONS ------------- //
	// -------------------------------------------- //

	/**
	 * Runs all menu transition tweens
	 */
	function run_transition_tweens()
	{
		var tweens = transitions[menu];

		for ( var t in tweens ) {
			if ( tweens.hasOwnProperty( t ) ) {
				props[t].get( Sprite )[tweens[t].tween].tweenTo(
					tweens[t].to,
					tweens[t].time,
					tweens[t].ease,
					tweens[t].callback || null
				);
			}
		}
	}

	/**
	 * Slide to the main title view
	 */
	function view_title_select()
	{
		menu = 1;

		props.nova.remove( Flicker );
		props.nova2.remove( Flicker );

		props.TITLE_MENU.get( Menu ).enable();

		props.LEVEL_MENU.find( Menu ).disable();
		props.LEVEL_MENU.find( TextPrinter ).mute();
		props.LEVEL_MENU.$( 'pane' ).get( Sprite ).x.tweenTo( -300, slide, Ease.quad.inOut );

		run_transition_tweens();
	}

	/**
	 * Slide to the level selection view
	 */
	function view_level_select()
	{
		menu = 2;

		props.nova.add( new Flicker().setAlphaRange( 0.7, 1.0 ) );
		props.nova2.add( new Flicker().setAlphaRange( 0.7, 1.0 ) );

		props.TITLE_MENU.get( Menu ).disable();

		props.LEVEL_MENU.find( Menu ).enable();
		props.LEVEL_MENU.find( TextPrinter ).unmute();
		props.LEVEL_MENU.$( 'pane' ).get( Sprite ).x.delay( 0.25 ).tweenTo( 0, slide, Ease.quad.inOut );

		pause_sphere_rotation();
		run_transition_tweens();
	}

	/**
	 * Slide to the station creator menu view
	 */
	function view_creator_select()
	{
		menu = 3;
	}

	/**
	 * Leave the title scene
	 */
	function exit_scene()
	{

	}

	// -- Public: --
	this.onAdded = function()
	{
		add_backdrop();
		add_title();

		add_title_menu();
		add_level_menu();

		stage_all_props();

		props.LEVEL_MENU.find( Menu ).disable();
		props.LEVEL_MENU.find( TextPrinter ).mute();

		_.owner.addChild( stage );
	};
}