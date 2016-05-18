/**
 * Sets up the game's title scene
 */
function TitleScene(controller, assets)
{
	// Private:
	var _ = this;
	var stage = new Entity();
	var stars;
	var sky;
	var ground;

	/**
	 * Slide to the main title view
	 */
	function view_title_select()
	{

	}

	/**
	 * Slide to the level selection view
	 */
	function view_level_select()
	{

	}

	/**
	 * Slide to the station creator menu view
	 */
	function view_creator_select()
	{

	}

	// Public:
	this.update = function(dt){}

	this.onAdded = function()
	{
		stars = new Sprite(assets.getImage('title/starfield.png'));
		sky = new Sprite(assets.getImage('title/sky.png'));

		stage
			.addChild(new Entity().add(stars))
			.addChild(new Entity().add(sky));

		owner.addChild(stage);
	}
}