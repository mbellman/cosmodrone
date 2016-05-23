/**
 * ------------------
 * DEPENDENCIES:
 *
 * core/Entity.js
 * core/Sprite.js
 * core/Components.js
 * core/ui/Menu.js
 * ------------------
 */

/**
 * -----------------
 * Class: TitleScene
 * -----------------
 *
 * Component which sets up the game's title scene
 */
function TitleScene( controller )
{
	// Private:
	var _ = this;
	var owner = null;
	var menu = 1;
	var stage = new Entity();
	var props = {};
	var slide = 1.5;

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
		stage.add(
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
	 * Show the initial options on the title screen
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
								'NEW GAME': view_level_select,
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

	// -------------------------------------------- //
	// ------------- MENU TRANSITIONS ------------- //
	// -------------------------------------------- //

	/**
	 * Slide to the main title view
	 */
	function view_title_select()
	{
		menu = 1;

		props.nova.remove( Flicker );
		props.nova2.remove( Flicker );

		props.sky.get( Sprite ).y.tweenTo( -1200 + Viewport.height, slide, Ease.quad.inOut );
		props.nova.get( Sprite ).y.tweenTo( -50, slide, Ease.quad.inOut );
		props.nova2.get( Sprite ).y.tweenTo( -50, slide, Ease.quad.inOut );
		props.stars.get( Sprite ).alpha.tweenTo( 0.2, slide, Ease.quad.out );
		props.ground.get( Sprite ).y.tweenTo( Viewport.height - 208, slide, Ease.quad.inOut );

		props.logo.get( Sprite ).alpha.tweenTo( 1, slide, Ease.quad.in );
		props.starlogo.get( Sprite ).alpha.tweenTo( 1, slide, Ease.quad.in );
	}

	/**
	 * Slide to the level selection view
	 */
	function view_level_select()
	{
		menu = 2;

		props.nova.add( new Flicker().setAlphaRange( 0.8, 1.0 ) );
		props.nova2.add( new Flicker().setAlphaRange( 0.8, 1.0 ) );

		props.sky.get( Sprite ).y.tweenTo( Viewport.height - 100, slide, Ease.quad.inOut );
		props.nova.get( Sprite ).y.tweenTo( 0, slide, Ease.quad.inOut );
		props.nova2.get( Sprite ).y.tweenTo( 0, slide, Ease.quad.inOut );
		props.stars.get( Sprite ).alpha.tweenTo( 1, slide, Ease.quad.in );
		props.ground.get( Sprite ).y.tweenTo( Viewport.height * 2, slide, Ease.quad.inOut );

		props.logo.get( Sprite ).alpha.tweenTo( 0, slide, Ease.quad.out );
		props.starlogo.get( Sprite ).alpha.tweenTo( 0, slide, Ease.quad.out );

		props.TITLE_MENU.get( Menu ).disable();
		props.TITLE_MENU.get( Sprite ).alpha.tweenTo( 0, slide / 2, Ease.quad.out );
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

	// Public:
	this.update = function( dt ) {}

	this.onAdded = function( entity )
	{
		owner = entity;

		add_backdrop();
		add_title();
		add_title_menu();
		stage_all_props();

		owner.addChild( stage );
	}
}