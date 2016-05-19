/**
 * Sets up the game's title scene
 */
function TitleScene(controller, assets)
{
	// Private:
	var _ = this;
	var owner = null;
	var input = new InputHandler();
	var menu = 1;
	var stage = new Entity();
	var props = {};
	var nova = {};
	var stars = 0;
	var slide = 1.5;

	// --------------------------------------- //
	// ------------- SCENE SETUP ------------- //
	// --------------------------------------- //

	/**
	 * Adds a twinkling star entity to [props]
	 */
	function create_star(type, x, y)
	{
		props['star' + (++stars)] = new Entity()
			.add(
				new Sprite(assets.getImage('title/star' + type + '.png'))
					.setXY(x, y)
			)
			.add(
				new Flicker()
					.setAlphaRange(0.5, 1.0)
					.setTimeRange(0.2, 0.5)
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

		props.nova.remove(Flicker);
		props.nova2.remove(Flicker);

		props.sky.get(Sprite).stopTweens().y.tweenTo(-1200 + viewport.height, slide, Ease.quad.inOut);
		props.nova.get(Sprite).stopTweens().y.tweenTo(-50, slide, Ease.quad.inOut);
		props.nova2.get(Sprite).stopTweens().y.tweenTo(-50, slide, Ease.quad.inOut);
		props.stars.get(Sprite).stopTweens().alpha.tweenTo(0.5, slide, Ease.quad.in);
		props.ground.get(Sprite).stopTweens().y.tweenTo(viewport.height - 208, slide, Ease.quad.inOut);
	}

	/**
	 * Slide to the level selection view
	 */
	function view_level_select()
	{
		menu = 2;

		props.nova.add(new Flicker().setAlphaRange(0.8, 1.0));
		props.nova2.add(new Flicker().setAlphaRange(0.8, 1.0));

		props.sky.get(Sprite).stopTweens().y.tweenTo(400, slide, Ease.quad.inOut);
		props.nova.get(Sprite).stopTweens().y.tweenTo(0, slide, Ease.quad.inOut);
		props.nova2.get(Sprite).stopTweens().y.tweenTo(0, slide, Ease.quad.inOut);
		props.stars.get(Sprite).stopTweens().alpha.tweenTo(1.0, slide, Ease.quad.in);
		props.ground.get(Sprite).stopTweens().y.tweenTo(viewport.height * 3, slide * 0.7, Ease.quad.inOut);
	}

	/**
	 * Slide to the station creator menu view
	 */
	function view_creator_select()
	{
		menu = 3;
	}

	// ------------------------------------------ //
	// ------------- INPUT HANDLING ------------- //
	// ------------------------------------------ //

	function input_UP()
	{
		switch (menu)
		{
			// Main title scene
			case 1:
				view_level_select();
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
		switch (menu)
		{
			// Main title scene
			case 1:
				break;
			// Level select scene
			case 2:
				view_title_select();
				break;
			// Station creator menu scene
			case 3:
				break;
		}
	}

	function input_ENTER()
	{

	}

	/**
	 * Sets up key input events
	 */
	function bind_input_handlers()
	{
		input.on('UP', input_UP);
		input.on('DOWN', input_DOWN);
		input.on('ENTER', input_ENTER);
	}

	// Public:
	this.update = function(dt){}

	this.onAdded = function(entity)
	{
		owner = entity;

		// Listen for menu navigation key commands
		input.listen();
		bind_input_handlers();

		// Solid black background fill
		stage.add(new Entity().add(new FillSprite('#000', viewport.width, viewport.height)));

		// Background layers
		props.nova = new Entity().add(
			new Sprite(assets.getImage('title/nova1.png'))
				.setXY(0, -50)
		);
		props.nova2 = new Entity().add(
			new Sprite(assets.getImage('title/nova2.png'))
				.setXY(0, -50)
		);
		props.sky = new Entity().add(
			new Sprite(assets.getImage('title/sky.png'))
				.setXY(0, -1200 + viewport.height)
		);
		props.stars = new Entity().add(
			new Sprite(assets.getImage('title/starfield.png'))
				.setAlpha(0.5)
		);

		// Twinkling stars
		create_star('1', 120, 245);
		create_star('2', 1000, 325);
		create_star('3', 675, 40);

		// Foreground layer
		props.ground = new Entity().add(
			new Sprite(assets.getImage('title/ground.png'))
				.setXY(0, viewport.height - 208)
		);

		// Add all props to [stage]
		for (var p in props)
		{
			if (props.hasOwnProperty(p))
			{
				stage.addChild(props[p]);
			}
		}

		// Add [stage] to the owner so all Sprites
		// exist within the primary entity hierarchy
		owner.addChild(stage);
	}
}