(function(scope){
	/**
	 * Instance of a graphic or audio asset
	 */
	function Asset(_type) {
		// Private:
		var _ = this;
		var loaded = false;
		var path, data, type;

		function create() {
			switch (_type) {
				case 'image':
					return new Image();
				case 'audio':
					return new Audio();
			}
		}

		data = create();
		type = _type;

		// Public:
		this.getPath = function() {
			return path;
		}

		this.getType = function() {
			return type;
		}

		this.getObject = function() {
			return data;
		}

		this.from = function(_path) {
			if (!loaded) {
				path = _path;
			}
			return _;
		}

		this.load = function(callback) {
			data.onload = function(){
				loaded = true;
				callback(_);
			}
			data.src = path;
		}
	}

	/**
	 * Instance of the asset bank query system, used to retrieve assets during game
	 */
	function AssetManager(path) {
		// Private:
		var _ = this;
		var locked = false;
		var basePath = path;
		var data = {
			image: {},
			audio: {}
		};

		// Public:
		this.store = function(asset) {
			if (!locked) {
				data[asset.getType()][asset.getPath()] = asset;
			}

			return _;
		}

		this.getImage = function(name) {
			return data.image[basePath + name].getObject();
		}

		this.getAudio = function(name) {
			return data.audio[basePath + name].getObject();
		}

		this.lock = function() {
			locked = true;
		}
	}

	/**
	 * Instance of the asset loader resource, which can be used to load a list
	 * of assets into memory and then handle them through the asset manager
	 */
	function AssetLoaderInstance() {
		// Private:
		var _ = this;
		var basePath = '';
		var assets;
		var onProgress = function(){};
		var onComplete = function(){};

		function startLoading() {
			var graphics = assets.graphics || [];
			var sounds = assets.sounds || [];
			var path = './' + basePath + '/';
			var manager = new AssetManager(path);
			var assetCount = graphics.length + sounds.length;
			var loaded = 0;

			function loadProgress(asset) {
				manager.store(asset);

				if (++loaded >= assetCount) {
					manager.lock();
					onComplete(manager);
				}

				onProgress(100 * (loaded / assetCount));
			}

			graphics.forEach(function(graphic){
				var asset = new Asset('image').from(path + graphic).load(loadProgress);
			});

			sounds.forEach(function(sound){
				var asset = new Asset('audio').from(path + sound).load(loadProgress);
			});
		}

		// Public:
		this.root = function(path) {
			basePath = path;
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

		this.then = function(callback) {
			onComplete = callback || onComplete;
			startLoading();
		}
	}

	scope.AssetLoader = AssetLoaderInstance;
})(window);