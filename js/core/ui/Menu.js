/**
 * ---------------
 * DEPENDENCIES:
 *
 * system/Input.js
 * core/Entity.js
 * core/Sprite.js
 * core/ui/Text.js
 * ---------------
 */

(function( scope ) {
	/**
	 * ---------------
	 * Class: GridMenu
	 * ---------------
	 *
	 * A grid of selectable options
	 */
	function GridMenu()
	{
		// -- Private: --
		var _ = this;
		var owner = null;
		var stage = new Entity();

		// -- Public: --
		this.update = function( dt ) {}

		this.onAdded = function( entity )
		{
			owner = entity;
			owner.addChild( stage );
		}
	}

	/**
	 * ---------------
	 * Class: ListMenu
	 * ---------------
	 *
	 * A list of selectable option strings
	 */
	function ListMenu()
	{
		// -- Private: --
		var _ = this;
		var owner = null;
		var font = null;
		var width = 0;
		var options = [];
		var handlers = [];
		var selection = 0;
		var cursor = new Sprite();
		var container = new Entity();
		var stage = new Entity();
		var style = {
			align: 'left',
			lineHeight: 34,
			cursor: {
				x: -50,
				y: 0
			}
		};
		var sounds = {
			cursor: null,
			select: null,
			invalid: null
		};

		/**
		 * Play one of the menu action sound effects
		 */
		function play_sound( sound )
		{
			if ( sounds[sound] !== null ) {
				sounds[sound].play();
			}
		}

		/**
		 * Reposition [cursor] to the active selection
		 */
		function align_cursor()
		{
			if ( options.length > 0 ) {
				var position = options[selection].getPosition();
				cursor.setXY( position.x + style.cursor.x, position.y + style.cursor.y );
			}
		}

		/**
		 * Positions the menu options according to [style]
		 */
		function align_list()
		{
			for ( var o = 0 ; o < options.length ; o++ ) {
				var HZ_space = width - options[o].getSize().width;
				var shift = (
					( style.align !== 'left' ) ?
						( style.align === 'center' ? ( HZ_space / 2 ) : HZ_space )
					:
						0
				);

				options[o].setXY( shift, style.lineHeight * o );
			}
		}

		// -- Public: --
		this.update = function( dt ) {}

		this.onAdded = function( entity )
		{
			owner = entity;
			owner.addChild( stage );

			stage
				.addChild( container )
				.addChild( new Entity().add( cursor ) );
		}

		/**
		 * Set the menu [font] (required before setting options)
		 */
		this.setFont = function( _font )
		{
			font = _font;
			width = 0;

			for ( var o = 0 ; o < options.length ; o++ ) {
				options[o].setFont( font );
				width = Math.max( width, options[o].getSize().width );
			}

			align_list();
			align_cursor();

			return _;
		}

		/**
		 * Set the menu option strings/callbacks
		 * using an [object] of key-value pairs.
		 * (Key: string; Value: selection callback)
		 */
		this.setMenuOptions = function( object )
		{
			if ( font === null ) {
				return;
			}

			options.length = 0;
			handlers.length = 0;
			width = 0;

			container.disposeChildren();

			for ( var string in object ) {
				if ( object.hasOwnProperty( string ) ) {
					var text = new TextString( font ).setString( string );
					width = Math.max( width, text.getSize().width );

					options.push( text );
					handlers.push( object[string] );

					container.addChild( new Entity().add( text ) );
				}
			}

			align_list();
			align_cursor();

			return _;
		}

		/**
		 * Set the menu selection cursor graphic
		 */
		this.setCursorGraphic = function( asset )
		{
			cursor.setSource( asset );
			align_cursor();
			return _;
		}

		/**
		 * Set the menu action sound effects
		 */
		this.setSounds = function( object )
		{
			for ( var o in object ) {
				if ( sounds.hasOwnProperty( o ) ) {
					sounds[o] = object[o];
				}
			}

			return _;
		}

		/**
		 * Set various style attributes for the menu
		 */
		this.setStyle = function( object )
		{
			for ( var o in object ) {
				if ( style.hasOwnProperty( o ) ) {
					style[o] = object[o];
				}
			}

			align_list();
			align_cursor();
			return _;
		}

		/**
		 * Cycle to the previous option
		 */
		this.previous = function()
		{
			if ( --selection < 0 ) {
				selection = options.length - 1;
			}

			play_sound( 'cursor' );
			align_cursor();
		}

		/**
		 * Cycle to the next option
		 */
		this.next = function()
		{
			if ( ++selection > options.length - 1 ) {
				selection = 0;
			}

			play_sound( 'cursor' );
			align_cursor();
		}

		/**
		 * Pick the active selection and trigger its callback
		 */
		this.select = function()
		{
			var callback = handlers[selection];

			if ( typeof callback === 'function' ) {
				play_sound( 'select' );
				handlers[selection]();
				return;
			}

			play_sound( 'invalid' );
		}
	}

	/**
	 * -----------
	 * Class: Menu
	 * -----------
	 *
	 * A navigable menu interface. This component
	 * automatically adds the appropriate secondary
	 * menu component to the owner based on [type]
	 * and manages its instance and attributes.
	 */
	function Menu( type )
	{
		// -- Private: --
		var _ = this;
		var owner = null;
		var input = new InputHandler();
		var stage = new Entity();
		var menu = create_menu();
		var attributes = default_attributes();

		/**
		 * Default Menu configuration
		 */
		function default_attributes()
		{
			return {
				// Font for the menu to use (ListMenu only)
				font: null,
				// Selection options as a list of key-value pairs. Key: string
				// (ListMenu) or entity (GridMenu); Value: selection callback.
				options: {},
				// Menu text alignment (ListMenu only)
				align: 'left',
				// Menu text line height (ListMenu only)
				lineHeight: 30,
				// Menu action sound effects:
				sounds: {
					// SFX: Navigating between options
					cursor: null,
					// SFX: Selecting an option
					select: null,
					// SFX: Invalid selection (null callback)
					invalid: null
				},
				// Cursor graphic
				cursor: null,
				// Cursor offset coordinates from selected item (ListMenu only)
				cursorOffset: {
					x: -50,
					y: 0
				}
			};
		}

		/**
		 * Creates and returns a secondary menu component for [type]
		 */
		function create_menu()
		{
			switch ( type ) {
				case 'list':
					return new ListMenu();
				case 'grid':
					return new GridMenu();
				default:
					return null;
			}
		}

		/**
		 * Set up input listeners
		 */
		function bind_input_handlers()
		{
			if ( type === 'list' ) {
				input.on( 'UP', menu.previous );
				input.on( 'DOWN', menu.next );
			} else
			if ( type === 'grid' ) {
				// TODO: GridMenu navigation functions
			}

			input.on( 'ENTER', menu.select );
		}

		// -- Public: --
		this.update = function( dt ) {}

		this.onAdded = function( entity )
		{
			owner = entity;

			if ( menu !== null ) {
				owner.add( menu );
			}

			input.listen();
			bind_input_handlers();
		}

		this.onRemoved = function()
		{
			input.unlisten();
		}

		/**
		 * Configure the attributes and behavior of the [menu]
		 */
		this.configure = function( props )
		{
			if ( menu instanceof ListMenu ) {
				for ( var p in props ) {
					if ( attributes.hasOwnProperty( p ) ) {
						attributes[p] = props[p] || attributes[p];
					}
				}

				menu
					.setFont( attributes.font )
					.setMenuOptions( attributes.options )
					.setCursorGraphic( attributes.cursor )
					.setSounds( attributes.sounds )
					.setStyle(
						{
							align: attributes.align,
							lineHeight: attributes.lineHeight,
							cursor: {
								x: attributes.cursorOffset.x,
								y: attributes.cursorOffset.y
							}
						}
					);
			} else
			if ( menu instanceof GridMenu) {
				// TODO: Grid Menu configuration
			}

			return _;
		}

		/**
		 * Prevent any [menu] input
		 */
		this.disable = function()
		{
			input.disable();
			return _;
		}

		/**
		 * Enable [menu] input
		 */
		this.enable = function()
		{
			input.enable();
			return _;
		}
	}

	scope.Menu = Menu;
})( window );