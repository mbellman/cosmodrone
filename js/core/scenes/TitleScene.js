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

	// Primary scene
	var menu = 1;
	var stage = new Entity();
	var props = {};
	var slide = 1.5;

	// Level select menu
	var level_zone = 1;
	var zone_offsets = {
		1: 0,         // Earth
		2: 1500,      // Moon
		3: 2500,      // Deep Space 1
		4: 5000       // Mars
	};
	var zones = {
		1: 1, 2: 1, 3: 1, 4: 1,
		5: 2,
		6: 3, 7: 3,
		8: 4, 9: 4, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4
	};
	var stations = [
		// Earth
		{x: 200, y: 200},
		{x: 250, y: 350},
		{x: 900, y: 400},
		{x: 950, y: 150},
		// Moon
		{x: 1800, y: 250},
		// Deep Space 1
		{x: 2900, y: 150},
		{x: 3250, y: 500},
		// Mars
		{x: 5250, y: 200},
		{x: 5350, y: 100},
		{x: 5450, y: 250},
		{x: 5550, y: 150},
		{x: 5650, y: 550},
		{x: 5650, y: 50},
		{x: 5750, y: 450},
		{x: 5850, y: 250},
		{x: 5950, y: 250}
	];
	var level_text = [
		'Level One...that\'s which level this is!',
		'Level Two...that\'s which level this is!',
		'Level Three...that\'s which level this is!',
		'Level Four...that\'s which level this is!',
		'Level Five...that\'s which le...v...[br]s-sorry...',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!',
		'Level One...that\'s which level this is!'
	];

	// List of props and properties to be
	// tweened when navigating between menus
	//
	// TODO: Organize this more nicely!
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
			LEVEL_MENU: {tween: 'alpha', to: 0, time: slide, ease: Ease.quad.out}
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
			LEVEL_MENU: {tween: 'alpha', to: 1, time: slide, ease: Ease.quad.in}
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
			var entity = new Entity().add(
				new Sprite( Assets.getImage( 'title/letters/' + character + '.png' ) )
					.setXY( logo.x[c], logo.y[c] )
					.setAlpha( 0 )
			);

			entity.get( Sprite ).alpha
				.delay( 0.75 + ( c * 0.15 ) )
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
								'LEVEL SELECT': view_level_select,
								'STATION BUILDER': null,
								'CREDITS': null
							},
							sounds: {
								cursor: Assets.getAudio( 'ui/blip2.wav' ),
								select: Assets.getAudio( 'ui/blip2.wav' ),
								invalid: Assets.getAudio( 'ui/blip1.wav' )
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

		// Planet entities
		var space = new Entity()
			.add( new Sprite() )
			.addChild(
				new Entity().add(
					new Sphere()
						.setRadius( 250 )
						.setTexture( EARTH_TEXTURE )
						.setAmbientLight( 0.6 )
						.setRotationSpeed( -20 )
						.setResolution( 2 )
						.setXY( 350, 80 )
						.render()
				),
				new Entity().add(
					new Sphere()
						.setRadius( 100 )
						.setTexture( MOON_TEXTURE )
						.setAmbientLight( 0.1 )
						.setLightDiffusion( 0.1 )
						.setRotationSpeed( -20 )
						.setResolution( 2 )
						.setXY( 2000, 200 )
						.render()
				),
				new Entity().add(
					new Sphere()
						.setRadius( 180 )
						.setTexture( MARS_TEXTURE )
						.setAmbientLight( 0.4 )
						.setLightDiffusion( 0.4 )
						.setRotationSpeed( -20 )
						.setResolution( 2 )
						.setXY( 5450, 150 )
						.render()
				)
			);

		// Space station icon entities
		var space_stations = new Entity().addToParent( space );

		for ( var s = 0 ; s < stations.length ; s++ ) {
			space_stations.addChild(
				new Entity().add(
					new Sprite( STATION_ICON ).setXY( stations[s].x, stations[s].y ).centerOrigin()
				)
			);
		}

		// Level description text entity
		var text = new Entity().add(
			new Sprite().setXY( 200, 550 )
		)
		.add(
			new TextPrinter( 'Monitor' )
				.setSound( Assets.getAudio( 'ui/blip1.wav' ) )
				.setInterval( 25 )
		);

		// Off-screen Menu component for navigation
		var menu = new Entity().add(
			new Menu( 'grid' )
				.configure(
					{
						items: 16,
						options: function( i ) {
							return new Entity().add(
								new Sprite().setXY( 20 * i, 0 )
							);
						},
						onFocus: function( entity, i ) {
							space_stations.child( i ).get( Sprite ).setSource( STATION_ICON_SELECTED ).centerOrigin();
							text.find( TextPrinter ).print( level_text[i] );

							if ( zones[++i] !== level_zone ) {
								level_zone = zones[i];
								space.get( Sprite ).x.tweenTo( -1 * zone_offsets[level_zone], 1.5, Ease.quad.inOut );
							}
						},
						onUnFocus: function( entity, i ) {
							space_stations.child( i ).get( Sprite ).setSource( STATION_ICON ).centerOrigin();
						},
						onSelect: function( entity, i ) {
							if ( i < 1 ) {
								return true;
							}

							return false;
						},
						sounds: {
							cursor: Assets.getAudio( 'ui/blip2.wav' ),
							select: Assets.getAudio( 'ui/blip2.wav' ),
							invalid: Assets.getAudio( 'ui/blip1.wav' )
						}
					}
				)
		);

		props.LEVEL_MENU = new Entity()
			.add( new Sprite().setAlpha( 0 ) )
			.addChild( space, text, menu );
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
				props[t].get( Sprite )[tweens[t].tween].tweenTo( tweens[t].to, tweens[t].time, tweens[t].ease );
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