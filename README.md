# cosmodrone
A game about space station maintenance!

### TODO:

##### LEVEL SELECT SCREEN
* / character for MonitorMini font
* Map layout preview below level description
* Loading bar/indicator of some kind

##### GAME
* Numerical power/fuel value
* Extended dialogue chunks
* Hardware interface screen (video view within station pane)
* Collisions/drone damage
* Random event docking alignment minigame
* Components with update cycles/architecture for various hardware parts
* Specific terminal coordinates for precision docking
* Truss modules
* Solar panels
* Additional modules/parts as needed
* First-level tutorial
* Handler for drone running out of power/fuel
* Ability to move drone above or below the station (*)
* Moving docking targets (later-stage development) (*)
* Scene zoom-out when speeding up (*)
* Replace jQuery with vanilla JS (*)

##### HUD
* "Autospin" system indicator
* Indicate when docking mode is usable
* Show data readout for docking target

##### BACKGROUND/TERRAIN
* Additional color formula sets/terrain features (for other planets)
* Rivers

##### CODE
* Retrofit SpriteSequence component to allow pausing/resuming/specific frame selection
* Have scrolling background use a pool of Cloud instances rather than re-instantiating new ones
* Consolidate major framework elements (Canvas, WebAudio, AssetLoader, Entity/Component, Sprite, Text, etc.)
* Docs for framework stuff
* Terrain and HeightMap classes need some tidying