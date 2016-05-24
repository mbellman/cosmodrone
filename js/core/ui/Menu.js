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
		var stage = new Entity();
		var total = 0;
		var builder;
		var selection = 0;
		var events = {
			focus: null,
			unfocus: null,
			select: null
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
		 * Build the menu grid using [builder] to construct
		 * and return entities to be placed into the [stage].
		 */
		function build_grid()
		{
			if ( typeof builder !== 'function' ) {
				return;
			}

			stage.disposeChildren();

			for ( var i = 0 ; i < total ; i++ ) {
				stage.addChild( builder( i ) );
			}
		}

		/**
		 * Selects the closest grid item to the active
		 * selection in a specific cardinal [direction]
		 */
		function select_nearest( direction )
		{
			var active = stage.getNthChild( selection ).find( Sprite );
			var minimum_distance = Number.POSITIVE_INFINITY;
			var closest = selection;
			var index = 0;
			var target, distance;

			stage.forDirectChildren( function( child ) {
				target = child.find( Sprite );

				if ( target !== null && target !== active ) {
					distance = Vec2.distance( active.x._, active.y._, target.x._, target.y._ );

					if (
						( distance < minimum_distance ) &&
						(
							( direction === 'up' && target.y._ < active.y._) ||
							( direction === 'down' && target.y._ > active.y._) ||
							( direction === 'left' && target.x._ < active.x._) ||
							( direction === 'right' && target.x._ > active.x._)
						)
					) {
						minimum_distance = distance;
						closest = index;
					}
				}

				index++;
			});

			if ( closest !== selection ) {
				events.unfocus( stage.getNthChild( selection ), selection );
				events.focus( stage.getNthChild( closest ), closest );
				play_sound( 'cursor' );

				selection = closest;
			} else {
				play_sound( 'invalid' );
			}
		}

		// -- Public: --
		this.owner = null;

		this.update = function( dt ) {}

		this.onAdded = function( entity )
		{
			_.owner = entity;
			_.owner.addChild( stage );

			build_grid();

			if ( typeof events.focus === 'function' ) {
				events.focus( stage.getNthChild( selection ), selection );
			}
		}

		/**
		 * Set the number of items in the grid
		 */
		this.setTotal = function( _total )
		{
			total = _total;
			return _;
		}

		/**
		 * Set the option [builder] function (see: build_grid())
		 */
		this.setBuilder = function( _builder )
		{
			builder = _builder;
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
		 * Set up menu [event] handlers
		 */
		this.on = function( event, handler )
		{
			if ( events.hasOwnProperty( event ) ) {
				events[event] = handler;
			}

			return _;
		}

		/**
		 * Go up one grid item
		 */
		this.up = function()
		{
			select_nearest( 'up' );
		}

		/**
		 * Go down one grid item
		 */
		this.down = function()
		{
			select_nearest( 'down' );
		}

		/**
		 * Go left one grid item
		 */
		this.left = function()
		{
			select_nearest( 'left' );
		}

		/**
		 * Go right one grid item
		 */
		this.right = function()
		{
			select_nearest( 'right' );
		}

		/**
		 * Pick the active selection and trigger its callback
		 */
		this.select = function()
		{
			if ( events.select( stage.getNthChild( selection ), selection ) ) {
				play_sound( 'select' );
				return;
			}

			play_sound( 'invalid' );
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
		this.owner = null;

		this.update = function( dt ) {}

		this.onAdded = function( entity )
		{
			_.owner = entity;
			_.owner.addChild( stage );

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
				// ListMenu: menu options as a list of key-value pairs. (Key: string; Value: callback)
				// GridMenu: grid item generator function. Receives the item ID and returns an entity.
				options: null,

				// ListMenu parameters:
				// Option font
				font: null,
				// Option text alignment
				align: 'left',
				// Option line height
				lineHeight: 30,
				// Cursor graphic
				cursor: null,
				// Cursor offset from selected item
				cursorOffset: {
					x: -50,
					y: 0
				},

				// GridMenu parameters:
				// Number of grid items to construct
				items: 0,
				// Handler for navigating to a menu option. Receives the grid item entity and its index as two arguments.
				focus: null,
				// Handler for leaving a menu option. Receives the grid item entity and its index as two arguments.
				unfocus: null,
				// Handler for selecting a menu option. Receives the grid item entity and its index as two arguments.
				// This function should return true or false depending on whether the selection is 'valid'.
				select: null,

				// Menu action sound effects:
				sounds: {
					// SFX: Navigating between options
					cursor: null,
					// SFX: Selecting an option
					select: null,
					// SFX: Invalid selection (null callback)
					invalid: null
				},
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
				input.on( 'UP', menu.up );
				input.on( 'DOWN', menu.down );
				input.on( 'LEFT', menu.left );
				input.on( 'RIGHT', menu.right );
			}

			input.on( 'ENTER', menu.select );
		}

		// -- Public: --
		this.owner = null;

		this.update = function( dt ) {}

		this.onAdded = function( entity )
		{
			_.owner = entity;

			if ( menu !== null ) {
				_.owner.add( menu );
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
			for ( var p in props ) {
				if ( attributes.hasOwnProperty( p ) ) {
					attributes[p] = props[p] || attributes[p];
				}
			}

			if ( menu instanceof ListMenu ) {
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
				menu
					.setTotal( attributes.items )
					.setBuilder( attributes.options )
					.setSounds( attributes.sounds )
					.on( 'focus', attributes.focus )
					.on( 'unfocus', attributes.unfocus )
					.on( 'select', attributes.select );
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