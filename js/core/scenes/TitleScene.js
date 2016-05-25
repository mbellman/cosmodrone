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
	var menu = 1;
	var stage = new Entity();
	var props = {};
	var slide = 1.5;

	// List of props and properties to be
	// tweened when navigating between menus
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
			LEVEL_MENU: {tween: 'alpha', to: 0, time: ( slide / 2 ), ease: Ease.quad.out}
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
		/**
		 * Level option builder function
		 */
		function INTERNAL_option_builder( i )
		{
			var x = 200 * Math.floor( i / 4 );
			var y = 120 * ( i % 4 );

			var entity = new Entity().add(
				new Sprite().setXY( x, y )
			)
			.addChild(
				new Entity().add(
					new FillSprite( '#ffd52e', 175, 90 ).setAlpha( 0.2 )
				)
			);

			return entity;
		}

		/**
		 * Handler for navigating to a level option
		 */
		function INTERNAL_option_onFocus( entity, i )
		{
			entity.find( FillSprite ).alpha.tweenTo( 0.5, 0.25, Ease.quad.out );
		}

		/**
		 * Handler for navigating away from a level option
		 */
		function INTERNAL_option_onUnFocus( entity, i )
		{
			entity.find( FillSprite ).alpha.tweenTo( 0.2, 0.25, Ease.quad.out );
		}

		/**
		 * Handler for selecting a grid option
		 */
		function INTERNAL_option_onSelect( entity, i )
		{
			if ( i < 1 ) {
				return true;
			}

			return false;
		}

		props.LEVEL_MENU = new Entity().add(
			new Sprite().setXY( 200, 100 ).setAlpha( 0 )
		)
		.add(
			new Menu( 'grid' )
				.configure(
					{
						items: 16,
						options: INTERNAL_option_builder,
						focus: INTERNAL_option_onFocus,
						unfocus: INTERNAL_option_onUnFocus,
						select: INTERNAL_option_onSelect,
						sounds: {
							cursor: Assets.getAudio( 'ui/blip2.wav' ),
							select: Assets.getAudio( 'ui/blip2.wav' ),
							invalid: Assets.getAudio( 'ui/blip1.wav' )
						}
					}
				)
		);

		props.LEVEL_MENU.get( Sprite ).setAlpha( 0 );
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
		props.LEVEL_MENU.get( Menu ).disable();

		run_transition_tweens();
	}

	/**
	 * Slide to the level selection view
	 */
	function view_level_select()
	{
		menu = 2;

		props.nova.add( new Flicker().setAlphaRange( 0.8, 1.0 ) );
		props.nova2.add( new Flicker().setAlphaRange( 0.8, 1.0 ) );

		props.LEVEL_MENU.get( Menu ).enable();
		props.TITLE_MENU.get( Menu ).disable();

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

		props.LEVEL_MENU.get( Menu ).disable();
		_.owner.addChild( stage );
	};
}