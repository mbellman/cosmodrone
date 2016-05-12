(function(scope)
{
	/**
	 * Instance of an image or audio asset
	 */
	function Asset(type)
	{
		// Private:
		var _ = this;
		var loaded = false;
		var onComplete = function(){};

		/**
		 * Create a media object for the asset
		 */
		function create_media()
		{
			switch (type)
			{
				case 'image':
					return new Image();
				case 'audio':
					return new Audio();
				default:
					return null;
			}
		}

		/**
		 * Check to see if the asset
		 * has already failed to load
		 */
		function check_fail_state()
		{
			return (
				(_.type === 'image' && _.media.complete && _.media.naturalWidth === 0) ||
				(_.type === 'audio' && _.media.error !== null)
			);
		}

		/**
		 * Called once asset successfully loads
		 */
		function load_complete()
		{
			loaded = true;
			onComplete(_);
		}

		// Public:
		this.path;
		this.type = type;
		this.media = create_media();

		this.from = function(_path)
		{
			if (!loaded)
			{
				_.path = _path;
			}

			return _;
		}

		this.load = function(callback)
		{
			if (!loaded)
			{
				onComplete = callback;

				var loadEvent = (_.type === 'image' ? 'onload' : 'oncanplay');
				_.media[loadEvent] = load_complete;
				_.media.src = _.path;
			}

			return _;
		}

		this.fail = function(callback)
		{
			if (check_fail_state())
			{
				callback(_.path);
				return _;
			}

			_.media.onerror = function()
			{
				callback(_.path);
			}

			return _;
		}
	}

	/**
	 * Instance of a loaded asset library,
	 * used to retrieve assets during game
	 */
	function AssetManager(_root)
	{
		// Private:
		var _ = this;
		var locked = false;
		var root =
		{
			base: _root,
			images: '',
			audio: ''
		};
		var data =
		{
			image: {},
			audio: {}
		};

		/**
		 * Warns of an unavailable asset listing
		 */
		function asset_error(path, file)
		{
			console.warn('Asset error: ' + (root.base + path + file));
			return null;
		}

		// Public:
		this.path = function(type, folder)
		{
			if (!locked && typeof root.hasOwnProperty(type))
			{
				root[type] = folder + '/';
			}

			return _;
		}

		this.store = function(asset)
		{
			if (!locked)
			{
				data[asset.type][asset.path] = asset;
			}

			return _;
		}

		this.getImage = function(file)
		{
			try
			{
				return data.image[root.base + root.images + file].media;
			}
			catch(e)
			{
				return asset_error(root.images, file);
			}
		}

		this.getAudio = function(file)
		{
			try
			{
				return data.audio[root.base + root.audio + file].media;
			}
			catch(e)
			{
				return asset_error(root.audio, file);
			}
		}

		this.lock = function()
		{
			locked = true;
		}
	}

	/**
	 * Instance of the asset loader resource,
	 * which can be used to load a list of
	 * assets into memory and then handle them
	 * through the returned asset manager
	 */
	function AssetLoader()
	{
		// Private:
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
			var asset_manager = new AssetManager(_root).path('images', assets.images.folder).path('audio', assets.audio.folder);
			var asset_count = images.length + audio.length;
			var loaded = 0;

			/**
			 * Temporary asset load handler callback
			 */
			function INTERNAL_load_progress(asset)
			{
				asset_manager.store(asset);
				onProgress(Math.round(100 * (++loaded / asset_count)));

				if (loaded >= asset_count)
				{
					asset_manager.lock();
					onComplete(asset_manager);
				}
			}

			images.forEach(function(file)
			{
				var asset = new Asset('image').from(_root + assets.images.folder + '/' + file).load(INTERNAL_load_progress).fail(onError);
			});

			audio.forEach(function(file)
			{
				var asset = new Asset('audio').from(_root + assets.audio.folder + '/' + file).load(INTERNAL_load_progress).fail(onError);
			});
		}

		// Public:
		this.root = function(_root)
		{
			root = _root;
			return _;
		}

		this.load = function(_assets)
		{
			assets = _assets;
			return _;
		}

		this.progress = function(callback)
		{
			onProgress = callback || onProgress;
			return _;
		}

		this.catch = function(callback)
		{
			onError = callback || onError;
			return _;
		}

		this.then = function(callback) {
			onComplete = callback || onComplete;
			load_assets();
		}
	}

	scope.AssetLoader = AssetLoader;
})(window);