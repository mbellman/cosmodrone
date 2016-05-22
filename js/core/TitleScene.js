/**
 * -----------------
 * Class: TitleScene
 * -----------------
 *
 * Component which sets up the game's title scene
 */
function TitleScene( controller, assets )
{
	// Private:
	var _ = this;
	var owner = null;
	var input = new InputHandler();
	var menu = 1;
	var stage = new Entity();
	var props = {};
	var slide = 1.5;

	var caret_position = 1;

	// --------------------------------------- //
	// ------------- SCENE SETUP ------------- //
	// --------------------------------------- //

	/**
	 * Adds a twinkling star entity to [props]
	 */
	function create_star( type, x, y )
	{
		return new Entity()
			.add(
				new Sprite( assets.getImage( 'title/star' + type + '.png' ) )
					.setXY( x, y )
			)
			.add(
				new Flicker()
					.setAlphaRange( 0.5, 1.0 )
					.setTimeRange( 0.2, 0.5 )
			);
	}

	/**
	 * Introduces the game title with an animation
	 */
	function create_title()
	{
		// Sprite coordinates
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

		// Set up a parent entity for the stars
		props.starlogo = new Entity().add( new Sprite().setXY( 90, 90 ) );

		// Lay out twinkling stars
		for ( var t = 0 ; t < stars.x.length ; t++ ) {
			props.starlogo.addChild(
				create_star( stars.type[t], stars.x[t], stars.y[t] )
			);
		}

		// Set up a parent entity for the logo
		props.logo = new Entity().add( new Sprite().setXY( 90, 120 ) );

		// Add individual letters to the logo Entity and fade them in
		for ( var c = 0 ; c < logo.characters.length ; c++ ) {
			var character = logo.characters[c];
			var entity = new Entity().add(
				new Sprite( assets.getImage( 'title/letters/' + character + '.png' ) )
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
	function create_title_menu()
	{
		var options = {
			text: ['NEW GAME', 'STATION BUILDER'],
			position: [{x: 522, y: 375}, {x: 474, y: 420}]
		};

		for ( var o = 0 ; o < options.text.length ; o++ ) {
			var text = options.text[o];
			var position = options.position[o];

			props[text] = new Entity().add(
				new Sprite().setXY( position.x, position.y ).setAlpha( 0 )
			)
			.add(
				new TextString( 'Monitor', BitmapFont.Monitor )
					.setString( text )
			);

			props[text].get( Sprite ).alpha.delay( 2.0 ).tweenTo( 1, 1.0, Ease.quad.in );
		}

		props.caret = new Entity().add(
			new Sprite( assets.getImage( 'ui/menu-caret.png' ) )
				.setXY( 490, 377 )
		);
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

		props.sky.get( Sprite ).y.tweenTo( -1200 + viewport.height, slide, Ease.quad.inOut );
		props.nova.get( Sprite ).y.tweenTo( -50, slide, Ease.quad.inOut );
		props.nova2.get( Sprite ).y.tweenTo( -50, slide, Ease.quad.inOut );
		props.stars.get( Sprite ).alpha.tweenTo( 0.2, slide, Ease.quad.out );
		props.ground.get( Sprite ).y.tweenTo( viewport.height - 208, slide, Ease.quad.inOut );

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

		props.sky.get( Sprite ).y.tweenTo( viewport.height - 100, slide, Ease.quad.inOut );
		props.nova.get( Sprite ).y.tweenTo( 0, slide, Ease.quad.inOut );
		props.nova2.get( Sprite ).y.tweenTo( 0, slide, Ease.quad.inOut );
		props.stars.get( Sprite ).alpha.tweenTo( 1, slide, Ease.quad.in );
		props.ground.get( Sprite ).y.tweenTo( viewport.height * 2, slide, Ease.quad.inOut );

		props.logo.get( Sprite ).alpha.tweenTo( 0, slide, Ease.quad.out );
		props.starlogo.get( Sprite ).alpha.tweenTo( 0, slide, Ease.quad.out );
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
		input.unlisten();
	}

	// ------------------------------------------ //
	// ------------- INPUT HANDLING ------------- //
	// ------------------------------------------ //

	function cycle_caret( shift )
	{
		switch ( menu ) {
			// Title screen
			case 1:
				var caret_coords = {
					1: {x: 490, y: 377},
					2: {x: 442, y: 422}
				};

				caret_position += shift;

				if ( caret_position > 2 ) {
					caret_position = 1;
				} else if ( caret_position < 1 ) {
					caret_position = 2;
				}

				props.caret.get( Sprite ).setXY(
					caret_coords[caret_position].x,
					caret_coords[caret_position].y
				);

				assets.getAudio( 'text/blip2.wav' ).play();

				break;
			case 2:
				break;
			case 3:
				break;
		}
	}

	function input_UP()
	{
		switch ( menu ) {
			// Main title scene
			case 1:
				cycle_caret( -1 );
				break;
			// Level select scene
			case 2:
				break;
			// Station creator menu scene
			case 3:
				break;
		}
	}

	function input_DOWN()
	{
		switch ( menu ) {
			// Main title scene
			case 1:
				cycle_caret( 1 );
				break;
			// Level select scene
			case 2:
				break;
			// Station creator menu scene
			case 3:
				break;
		}
	}

	function input_ENTER()
	{
		if ( menu === 1 && caret_position === 1 ) {
			view_level_select();
		}
	}

	/**
	 * Sets up key input events
	 */
	function bind_input_handlers()
	{
		input.on( 'UP', input_UP );
		input.on( 'DOWN', input_DOWN );
		input.on( 'ENTER', input_ENTER );
	}

	// Public:
	this.update = function( dt ) {}

	this.onAdded = function( entity )
	{
		owner = entity;

		input.listen();
		bind_input_handlers();

		// Solid black background fill
		stage.add( new Entity().add( new FillSprite( '#000', viewport.width, viewport.height ) ) );

		// Background layers
		props.nova = new Entity().add(
			new Sprite( assets.getImage( 'title/nova1.png' ) ).setXY( 0, -50 )
		);
		props.nova2 = new Entity().add(
			new Sprite( assets.getImage( 'title/nova2.png' ) ).setXY( 0, -50 )
		);
		props.sky = new Entity().add(
			new Sprite( assets.getImage( 'title/sky.png' ) ).setXY( 0, -1200 + viewport.height )
		);
		props.stars = new Entity().add(
			new Sprite( assets.getImage( 'title/starfield.png' ) ).setAlpha( 0.2 )
		);

		// Set up title introduction animation
		create_title();

		// Foreground layer
		props.ground = new Entity().add(
			new Sprite( assets.getImage( 'title/ground.png' ) ).setXY( 0, viewport.height - 208 )
		);

		// Title menu
		create_title_menu();

		// Add all props to [stage]
		for ( var p in props ) {
			if ( props.hasOwnProperty(p) ) {
				stage.addChild( props[p] );
			}
		}

		owner.addChild( stage );
	}
}