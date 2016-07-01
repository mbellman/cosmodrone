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
	var stage = new Entity();                                                      // Container for all menu elements
	var HARDWARE_ICONS = Assets.getImage( 'game/ui/hardware-icons.png' );          // Hardware icons spritesheet

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
		// Selection highlight entity
		highlight: null,
		// Scroll bar entity
		scrollbar: null,
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
	 * Return the menu height in pixels
	 */
	function menu_height()
	{
		return List.height * List.spacing;
	}

	/**
	 * Return the ratio between visible and total items
	 */
	function view_ratio()
	{
		return clamp( List.height / List.items.length, 0, 1 );
	}

	/**
	 * Return the maximum [List.scroll] position
	 */
	function max_scroll()
	{
		return List.items.length - List.height;
	}

	/**
	 * Check to see if the item at [index]
	 * is within the current visible area
	 */
	function is_in_view( index )
	{
		return (
			index >= List.scroll &&
			index < ( List.scroll + List.height )
		);
	}

	/**
	 * Play a [sound] effect
	 */
	function play_sound( sound )
	{
		if (
			typeof sounds[sound] !== 'undefined' &&
			sounds[sound] !== null
		) {
			sounds[sound].play();
		}
	}

	/**
	 * Create the highlighted selection indicator
	 */
	function create_highlight()
	{
		if ( List.highlight !== null ) {
			return;
		}

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
	 * Create the scroll bar element after
	 * hardware items have been loaded
	 */
	function create_scrollbar()
	{
		if ( List.scrollbar !== null ) {
			return;
		}

		List.scrollbar = new Entity()
			.add(
				new FillSprite( '#fff', 12, view_ratio() * menu_height() )
					.setAlpha( 0.75 )
					.setXY( List.width + 2, 0 )
			);

		stage.addChild( List.scrollbar );
	}

	/**
	 * Reposition the scroll bar based on the current scroll position
	 */
	function update_scrollbar()
	{
		if ( List.items.length < List.height ) {
			return;
		}

		var bar = List.scrollbar.get( Sprite );
		var gap = menu_height() - bar.height();
		var scroll_ratio = List.scroll / max_scroll();

		bar.y.tweenTo(
			Math.round( gap * scroll_ratio ),
			0.2,
			Ease.quad.out
		);
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

		update_scrollbar();
	}

	/**
	 * Recalculate [List.scroll] to ensure
	 * that the selected item is in view
	 */
	function update_scroll_position()
	{
		if ( List.selection < List.scroll ) {
			List.scroll = List.selection;
		}

		if ( List.selection >= ( List.scroll + List.height ) ) {
			List.scroll = 1 + List.selection - List.height;
		}
	}

	/**
	 * Update the current menu [selection] index
	 */
	function set_selection( selection )
	{
		if ( selection < 0 || selection >= List.items.length ) {
			play_sound( 'invalid' );
			return;
		}

		List.selection = selection;

		update_scroll_position();
		update_view();
		play_sound( 'cursor' );
	}

	/**
	 * Queue a hardware [part] component into the menu list
	 */
	function load_hardware( part )
	{
		var specs = part.getSpecs();

		var item = new Entity()
			.add(
				new Sprite()
			)
			.addChild(
				// Hardware icon
				new Entity( 'icon' )
					.add(
						new SpriteSequence( HARDWARE_ICONS )
							.setOptions(
								{
									frameWidth: 18,
									frameHeight: 18,
									frames: 4,
									vertical: true
								}
							)
							.pause()
							.setFrame( specs.list.icon - 1 )
					),
				// Hardware name
				new Entity( 'name' )
					.add(
						new Sprite().setXY( 25, 0 )
					)
					.add(
						new TextString( 'MonitorMini' )
							.setStyle(
								{
									spaceSize: 6
								}
							)
							.setString( specs.list.name )
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


			create_scrollbar();
			update_view();
		}

		return _;
	};

	/**
	 * Update sounds with a new [object] list
	 */
	this.setSounds = function( object )
	{
		for ( var o in object ) {
			if ( sounds.hasOwnProperty( o ) ) {
				sounds[o] = object[o];
			}
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
		play_sound( 'select' );
		// ...
	};
}