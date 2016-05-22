/**
 * -------------------
 * DEPENDENCIES:
 *
 * audio/WebAudio.js
 * -------------------
 */

(function( scope ) {
	/**
	 * ------------------
	 * Class: AudioBuffer
	 * ------------------
	 *
	 * Special WebAudio buffer asset for audio playback
	 */
	function AudioBuffer( buffer )
	{
		// -- Private: --
		var _ = this;
		var node = null;

		// -- Public: --
		this.play = function()
		{
			node = WebAudio.play( buffer );
			return _;
		}

		this.stop = function()
		{
			if ( node !== null) {
				WebAudio.stop( node );
			}

			return _;
		}
	}

	/**
	 * ------------
	 * Class: Asset
	 * ------------
	 *
	 * Instance of an image or audio asset
	 */
	function Asset( type )
	{
		// -- Private: --
		var _ = this;
		var loaded = false;
		var onComplete = function(){};
		var onError = function(){};

		/**
		 * Create a WebAudio buffer for sounds
		 */
		function create_audio()
		{
			WebAudio.load( _.path.substring(2), {
				load: function( buffer ) {
					_.media = new AudioBuffer( buffer );
					load_complete();
				},
				fail: function() {
					_.media = -1;
					onError( _.path );
				}
			});
		}

		/**
		 * Check to see if the asset has already failed to load
		 */
		function check_fail_state()
		{
			return (
				( _.type === 'image' && _.media.complete && _.media.naturalWidth === 0 ) ||
				( _.type === 'audio' && _.media === -1 )
			);
		}

		/**
		 * Called once Asset successfully loads
		 */
		function load_complete()
		{
			loaded = true;
			onComplete( _ );
		}

		// -- Public: --
		this.path;
		this.type = type;
		this.media = ( type === 'image' ? new Image() : null );

		/**
		 * Set asset file [path]
		 */
		this.from = function( path )
		{
			if ( !loaded ) {
				_.path = path;

				if ( _.type === 'audio' ) {
					create_audio();
				}
			}

			return _;
		}

		/**
		 * Set asset load handler
		 */
		this.loaded = function( callback )
		{
			if ( !loaded ) {
				onComplete = callback;

				if ( _.type === 'image' ) {
					_.media.onload = load_complete;
					_.media.src = _.path;
				}
			}

			return _;
		}

		/**
		 * Set asset load failure handler
		 */
		this.fail = function( callback )
		{
			onError = callback;

			if ( check_fail_state() ) {
				onError( _.path );
				return _;
			}

			if ( _.type === 'image') {
				_.media.onerror = function() {
					onError( _.path );
				}
			}

			return _;
		}
	}

	/**
	 * -------------------
	 * Class: AssetManager
	 * -------------------
	 *
	 * Instance of a loaded asset library,
	 * used to retrieve assets during game
	 */
	function AssetManager( _root )
	{
		// -- Private: --
		var _ = this;
		var locked = false;
		var root = {
			base: _root,
			images: '',
			audio: ''
		};
		var data = {
			image: {},
			audio: {}
		};

		/**
		 * Warns of an unavailable asset listing
		 */
		function asset_error( path, file )
		{
			console.warn( 'Asset error: ' + ( root.base + path + file ) );
			return null;
		}

		// -- Public: --
		/**
		 * Set media [type] directory to [folder]
		 */
		this.path = function( type, folder )
		{
			if ( !locked && typeof root.hasOwnProperty( type ) ) {
				root[type] = folder + '/';
			}

			return _;
		}

		/**
		 * Save Asset [asset] to [data] bank
		 */
		this.store = function( asset )
		{
			if ( !locked ) {
				data[asset.type][asset.path] = asset;
			}

			return _;
		}

		/**
		 * Retrieve an image Asset by [file] name
		 */
		this.getImage = function( file )
		{
			try {
				return data.image[root.base + root.images + file].media;
			} catch( e ) {
				return asset_error( root.images, file );
			}
		}

		/**
		 * Retrieve an audio Asset by [file] name
		 */
		this.getAudio = function( file )
		{
			try {
				return data.audio[root.base + root.audio + file].media;
			} catch( e ) {
				return asset_error( root.audio, file );
			}
		}

		/**
		 * Lock [data] bank from further writing
		 */
		this.lock = function()
		{
			locked = true;
		}
	}

	/**
	 * ------------------
	 * Class: AssetLoader
	 * ------------------
	 *
	 * Instance of the asset loader resource,
	 * which can be used to load a list of
	 * assets into memory and handle them
	 * through the returned asset manager
	 */
	function AssetLoader()
	{
		// -- Private: --
		var _ = this;
		var root = '';
		var assets;
		var onProgress = function(){};
		var onError = function(){};
		var onComplete = function(){};

		/**
		 * Run through the queued asset list and
		 * load them as usable Asset instances
		 */
		function load_assets()
		{
			var images = assets.images.files || [];
			var audio = assets.audio.files || [];
			var _root = './' + root + '/';
			var asset_count = images.length + audio.length;
			var loaded = 0;

			// Instance which will be returned through
			// onComplete() once all assets are loaded
			var asset_manager = new AssetManager( _root )
				.path( 'images', assets.images.folder )
				.path( 'audio', assets.audio.folder );

			/**
			 * Temporary asset load handler callback
			 */
			function INTERNAL_load_progress( asset )
			{
				asset_manager.store( asset );
				onProgress( Math.round( 100 * ( ++loaded / asset_count ) ) );

				if (loaded >= asset_count) {
					asset_manager.lock();
					onComplete( asset_manager );
				}
			}

			images.forEach(function( file ) {
				new Asset( 'image' )
					.from( _root + assets.images.folder + '/' + file )
					.loaded( INTERNAL_load_progress )
					.fail( onError );
			});

			audio.forEach(function( file ) {
				new Asset( 'audio' )
					.from( _root + assets.audio.folder + '/' + file )
					.loaded( INTERNAL_load_progress )
					.fail( onError );
			});
		}

		// -- Public: --
		/**
		 * Set [root] assets directory
		 */
		this.root = function( _root )
		{
			root = _root;
			return _;
		}

		/**
		 * Save an Asset Manifest list to [assets]
		 */
		this.load = function( _assets )
		{
			assets = _assets;
			return _;
		}

		/**
		 * Set the asset load progress handler
		 */
		this.progress = function( callback )
		{
			onProgress = callback || onProgress;
			return _;
		}

		/**
		 * Set the asset load failure handler
		 */
		this.catch = function( callback )
		{
			onError = callback || onError;
			return _;
		}

		/**
		 * Set the asset list load completion
		 * handler, and trigger the asset loader
		 */
		this.then = function( callback )
		{
			onComplete = callback || onComplete;
			load_assets();
		}
	}

	scope.AssetLoader = AssetLoader;
})( window );