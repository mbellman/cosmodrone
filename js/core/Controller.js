/**
 * Game screen state controller
 */
function Controller( assets )
{
	// -- Private: --
	var _ = this;
	var level = 1;

	// -- Public: --
	this.scenes = new SceneManager();

	this.showTitle = function()
	{
		var title = new TitleScene( _, assets );
		_.scenes.setActiveScene( 'title', new Entity().add( title ) );
	}

	this.showGame = function()
	{
		if ( _.scenes.hasScene( 'game' ) )
		{
			// Halt active game process (if
			// any) and dereference all data
			_.scenes.getScene( 'game' ).get( GameInstance ).unload();
		}

		var game = new GameInstance( _, assets ).setLevel( level );

		_.scenes.setActiveScene( 'game', new Entity().add( game ) );

		// Start level generation after adding the GameInstance
		// component to the scene manager. In the event that
		// resource-heavy level generation occurs, we need to
		// retroactively pause the scene manager's update loop.
		// Once level generation completes inside GameInstance,
		// the scene cycle resumes (see: GameInstance.start())
		game.debug( true ).init().start();
	}
}