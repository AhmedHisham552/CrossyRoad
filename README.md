

# Tables of Contents
- [Tables of Contents](#tables-of-contents)
- [How to run](#how-to-run)
- [Game rules](#game-rules)
  - [Game controls](#game-controls)
- [Screenshots](#screenshots)
- [Design your own level](#design-your-own-level)


# How to run

1. Install [Node.js](https://nodejs.org/en/) and [Visual Studio Code](https://code.visualstudio.com/).
2. Open the project in Visual Studio Code.
3. Open a terminal (Terminal > New Terminal).
4. run `npm install` . If it failed for any reason, try again.
5. run `npm run watch` .
6. Ctrl + click the link shown in the terminal (usually it will be http://localhost:1234).

**Note:** you can use yarn to enable caching so that you don't download all the packages with project. You can download yarn from [yarnpkg.com](https://yarnpkg.com/lang/en/). Then replace `npm install` with `yarn install` and `npm run watch` with `yarn watch`.

# Game rules
You're playing with a pig, you need to reach the end of the map to win, it sounds simple but becareful from the hungry dogs crossing the street, they will eat you whenever they can and then you'll restart from the beginning.
## Game controls
This game is controlled with WASD keys on the keyboard for moving forward, left, backward, right respectively.

# Screenshots
![](https://i.imgur.com/N9yDGkt.jpg)
![](https://i.imgur.com/vxlSwEx.jpg)
![](https://i.imgur.com/xhnKDK7.gif)


# Design your own level
You can design your own level by using level maps.
* Make a level map like the example shown below in a txt file
* TTTGGGGGGGGGGGGGGGGGGGGGGGGGGTTT
RRRRRRRRRFRRRRRRRRRFRRRRRRRRFRRR
RRRRRRFRRRRRRRFRRRRRRRRRRRRRRRRR
TTTGGGGGGGGGGGGGGGGGGGGGGGGGGTTT
RRRRRRFRRRRRRRFRRRRRRRRRRRRRRRRR
TTTGGGGGGGGGGGGGGGGGGGGGGGGGGTTT
* The level map encoding is as follow
    * (T) for trees
    * (R) for Road
    * (G) for grass
    * (F) for initial dog locations
* Then load your desired level map by changing inputLevel path in CrossyRoad.tsx to the desired input level.