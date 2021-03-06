// Here, we import the things we need from other script files 
import Game from './common/game';
import CrossyRoad from './scenes/CrossyRoad';

// First thing we need is to get the canvas on which we draw our scenes
const canvas: HTMLCanvasElement = document.querySelector("#app");

// Then we create an instance of the game class and give it the canvas
const game = new Game(canvas);

// Here we list all our scenes and our initial scene
const scenes = {
    "CrossyRoad": CrossyRoad
};
const initialScene = "CrossyRoad";

// Then we add those scenes to the game object and ask it to start the initial scene
game.addScenes(scenes);
game.startScene("CrossyRoad");

