import Camera from '../camera';
import Input from '../input';
import { vec3, vec2 } from 'gl-matrix';
import { Key } from 'ts-key-enum';


// This is a controller to simulate a flying Camera
// The controls are:
// Hold Left-Mouse-Button and Drag to rotate camera
// Hold Left-Mouse-Button + WASD to move and QE to go up or down
// Mouse Wheel to zoom in or out 
// Press T to toggle between Perspective and Orthographic

export default class FlyCameraController {
    camera: Camera;
    input: Input;
    PlayerPos: vec3;
    Left: boolean
    Right:boolean
    Front:boolean
    Back:boolean
    yaw: number = 0;
    pitch: number = 0;

    yawSensitivity: number = 0.001;
    pitchSensitivity: number = 0.001;
    movementSensitivity: number = 0.001;

    constructor(camera: Camera, input: Input, PlayerPos: vec3){
        this.camera = camera;
        camera.up = vec3.fromValues(0, 1, 0);
        this.input = input;
        
        const direction = camera.direction;
        this.yaw = Math.atan2(direction[2], direction[0]);
        this.pitch = Math.atan2(direction[1], vec2.len([direction[0], direction[1]]));

        this.PlayerPos = PlayerPos;
    }

    public update(deltaTime: number) {
        if(this.input.isButtonJustDown(0)){
            this.input.requestPointerLock()
        }

        if(this.input.isKeyJustDown("t")){
            if(this.camera.type === 'orthographic') this.camera.type = 'perspective';
            else this.camera.type = 'orthographic';
        }
        if(this.camera.type === 'perspective'){            
            this.camera.perspectiveFoVy -= this.input.WheelDelta[1] * 0.001;
            this.camera.perspectiveFoVy = Math.min(Math.PI, Math.max(Math.PI/8, this.camera.perspectiveFoVy));
        } else if(this.camera.type === 'orthographic') {
            this.camera.orthographicHeight -= this.input.WheelDelta[1] * 0.01;
            this.camera.perspectiveFoVy = Math.max(0.001, this.camera.perspectiveFoVy);

        }
    }
}