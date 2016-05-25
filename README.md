# cosmodrone
A game about space station maintenance!

### TODO:

##### GAME
* Stop level selection text from printing upon viewing title screen
* Get better menu/text sounds
* Text coloring
* Loading bar/indicator of some kind
* New drone sprite
* Print debug text using Text component
* Configure level select to use 3D spinning models of celestial bodies
* Make sure hardware asset "light source" is adjusted based on the side of the module
* Collisions/drone damage
* Hardware/part maintenance interface
* Components with update cycles/architecture for various hardware parts
* Alerts screen with ability to select hardware maintenance jobs
* Handler for drone running out of power/fuel
* Ability to move drone above or below the station
* Moving docking targets (later-stage development) (?)
* Scene zoom-out when speeding up (?)
* Replace jQuery with vanilla JS (?)

##### HUD
* "Autospin" system indicator
* Radio signal reception mechanic
* Indicate when docking mode is usable
* Radar/local area map

##### BACKGROUND
* Try drawing both times to one canvas using globalAlpha for transitions
* Rivers

##### CODE
* Consolidate major framework elements (Canvas, WebAudio, AssetLoader, Entity/Component, Sprite, Text, etc.)
* Background, Terrain, and HeightMap classes need some tidying