/**
 * Game screen state controller
 */
function Controller()
{
	// -- Private: --
	var _ = this;
	var level = 1;

	// -- Public: --
	this.scenes = new SceneManager();

	this.showTitle = function()
	{
		var title = new TitleScene( _ );
		_.scenes.setActiveScene( 'title', new Entity().add( title ) );
	}

	this.showGame = function()
	{
		if ( _.scenes.hasScene( 'game' ) ) {
			// Halt active game process (if any) and dereference all data
			_.scenes.getScene( 'game' ).get( GameScene ).unload();
		}

		var game = new GameScene( _ ).setLevel( level );

		_.scenes.setActiveScene( 'game', new Entity().add( game ) );

		game.debug( true ).init().start();
	}
}