/**
 * -----------------------
 * Component: HardwareMenu
 * -----------------------
 *
 * (INTERNAL) A scrollable list of the station's hardware parts
 */
function HardwareMenu()
{
	Component.call( this );

	// -- Private: --
	var _ = this;
	var stage = new Entity();                        // Container for all menu elements

	// Menu sound effects
	var sounds = {
		cursor: null,
		select: null,
		invalid: null
	};

	// Menu list data
	var List = {
		// HardwarePart component instances
		parts: [],
		// Menu item entities
		items: [],
		// Selection highlight indicator
		highlight: null,
		// Number of menu items visible at a time
		height: 10,
		// Pixel width of menu area
		width: 200,
		// Menu item vertical spacing in pixels
		spacing: 30,
		// Index of topmost visible menu item for current view
		scroll: 0,
		// Current selected menu item
		selection: 0
	};

	/**
	 * Check to see whether an [index] item
	 * is within the current visible area
	 */
	function is_in_view( index )
	{
		return ( index >= List.scroll && index < ( List.scroll + List.height ) );
	}

	/**
	 * Play a [sound] effect
	 */
	function play_sound( sound )
	{
		if ( sounds[sound] !== null ) {
			sounds[sound].play();
		}
	}

	/**
	 * Create the highlighted selection indicator
	 */
	function create_highlight()
	{
		List.highlight = new Entity()
			.add(
				new FillSprite( '#fff', List.width, List.spacing )
			)
			.add(
				new Flicker()
					.setAlphaRange( 0.25, 0.5 )
					.oscillate( 8 )
			);

		stage.addChild( List.highlight );
	}

	/**
	 * Re-render the menu based on [List] state
	 */
	function update_view()
	{
		var item, offset;

		for ( var i = 0 ; i < List.items.length ; i++ ) {
			item = List.items[i].get( Sprite );

			if ( !is_in_view( i ) ) {
				item.setAlpha( 0 );
			} else {
				offset = ( i - List.scroll );

				item
					.setAlpha( 1 )
					.setXY( 0, offset * List.spacing );

				if ( i === List.selection ) {
					List.highlight.get( Sprite )
						.setXY( 0, offset * List.spacing );
				}
			}
		}
	}

	/**
	 * Update the current menu [selection] index, also adjusting
	 * scroll position to ensure the selected item is in view
	 */
	function set_selection( selection )
	{
		if ( selection < 0 || selection >= List.items.length ) {
			play_sound( 'invalid' );
			return;
		}

		List.selection = selection;

		if ( List.selection < List.scroll ) {
			List.scroll = List.selection;
		}

		if ( List.selection >= ( List.scroll + List.height ) ) {
			List.scroll = 1 + List.selection - List.height;
		}

		update_view();
	}

	/**
	 * Queue a hardware [part] component into the menu list
	 */
	function load_hardware( part )
	{
		var name = part.getSpecs().listName;

		var item = new Entity()
			.add(
				new Sprite()
			)
			.addChild(
				new Entity( 'icon' ),
				new Entity( 'name' )
					.add(
						new Sprite().setXY( 20, 0 )
					)
					.add(
						new TextString( 'MonitorMini' )
							.setStyle(
								{
									spaceSize: 6
								}
							)
							.setString( name )
					)
			);

		List.parts.push( part );
		List.items.push( item );

		stage.addChild( item );
	}

	// -- Public: --
	this.onAdded = function()
	{
		_.owner.addChild( stage );
	};

	/**
	 * Receives a [station] entity and extracts hardware part
	 * components to be represented in the hardware menu list
	 */
	this.loadFromStation = function( station )
	{
		create_highlight();

		if ( station !== null ) {
			station.forAllComponentsOfType( HardwarePart, function( part ) {
				load_hardware( part );
			} );

			update_view();
		}

		return _;
	};

	/**
	 * Navigate up
	 */
	this.up = function()
	{
		set_selection( List.selection - 1 );
	};

	/**
	 * Navigate down
	 */
	this.down = function()
	{
		set_selection( List.selection + 1 );
	};

	/**
	 * Pick the current selection
	 */
	this.select = function()
	{
		// ...
	};
}