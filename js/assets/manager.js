(function(scope){
	/**
	 * Instance of an image or audio asset
	 */
	function Asset(type) {
		// Private:
		var _ = this;
		var loaded = false;

		function createMedia() {
			switch (type) {
				case 'image':
					return new Image();
				case 'audio':
					return new Audio();
				default:
					return null;
			}
		}

		function checkFailState() {
			return (
				(_.type === 'image' && _.media.complete && _.media.naturalWidth === 0) ||
				(_.type === 'audio' && _.media.error !== null)
			);
		}

		// Public:
		this.path;
		this.type = type;
		this.media = createMedia();

		this.from = function(_path) {
			if (!loaded) {
				_.path = _path;
			}
			return _;
		}

		this.load = function(callback) {
			if (!loaded) {
				function loadComplete() {
					loaded = true;
					callback(_);
				}

				var loadEvent = (_.type === 'image' ? 'onload' : 'oncanplay');
				_.media[loadEvent] = loadComplete;
				_.media.src = _.path;
			}
			return _;
		}

		this.fail = function(callback) {
			if (checkFailState()) {
				callback(_.path);
				return _;
			}

			_.media.onerror = function() {
				callback(_.path);
			}
			return _;
		}
	}

	/**
	 * Instance of a loaded asset library, used to retrieve assets during game
	 */
	function AssetManager(_root) {
		// Private:
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

		// Public:
		this.path = function(type, folder) {
			if (!locked && typeof root.hasOwnProperty(type)) {
				root[type] = folder + '/';
			}
			return _;
		}

		this.store = function(asset) {
			if (!locked) {
				data[asset.type][asset.path] = asset;
			}
			return _;
		}

		this.getImage = function(file) {
			return data.image[root.base + root.images + file].media;
		}

		this.getAudio = function(file) {
			return data.audio[root.base + root.audio + file].media;
		}

		this.lock = function() {
			locked = true;
		}
	}

	/**
	 * Instance of the asset loader resource, which can be used to load a list
	 * of assets into memory and then handle them through the returned asset manager
	 */
	function AssetLoader() {
		// Private:
		var _ = this;
		var root = '';
		var assets;
		var onProgress = function(){};
		var onError = function(){};
		var onComplete = function(){};

		function loadAssets() {
			var images = assets.images.files || [];
			var audio = assets.audio.files || [];
			var _root = './' + root + '/';
			var assetManager = new AssetManager(_root).path('images', assets.images.folder).path('audio', assets.audio.folder);
			var assetCount = images.length + audio.length;
			var loaded = 0;

			function loadProgress(asset) {
				assetManager.store(asset);
				onProgress(Math.round(100 * (++loaded / assetCount)));

				if (loaded >= assetCount) {
					assetManager.lock();
					onComplete(assetManager);
				}
			}

			images.forEach(function(file){
				var asset = new Asset('image').from(_root + assets.images.folder + '/' + file).load(loadProgress).fail(onError);
			});

			audio.forEach(function(file){
				var asset = new Asset('audio').from(_root + assets.audio.folder + '/' + file).load(loadProgress).fail(onError);
			});
		}

		// Public:
		this.root = function(_root) {
			root = _root;
			return _;
		}

		this.load = function(_assets) {
			assets = _assets;
			return _;
		}

		this.progress = function(callback) {
			onProgress = callback || onProgress;
			return _;
		}

		this.catch = function(callback) {
			onError = callback || onError;
			return _;
		}

		this.then = function(callback) {
			onComplete = callback || onComplete;
			loadAssets();
		}
	}

	scope.AssetLoader = AssetLoader;
})(window);