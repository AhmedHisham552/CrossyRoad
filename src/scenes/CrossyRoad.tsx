import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';
import { Vector, Selector, Color, NumberInput } from '../common/dom-utils';
import { createElement, StatelessProps, StatelessComponent } from 'tsx-create-element';
import { translate } from 'gl-matrix/src/gl-matrix/mat2d';
import { Player } from '../Classes/Player';

export default class CrossyRoad extends Scene{
    program: ShaderProgram;
    meshes: {[name: string]: Mesh} = {};
    camera: Camera;
    controller: FlyCameraController;
    textures: {[name: string]: WebGLTexture} = {};
    current_texture: number = 0;
    sampler: WebGLSampler;
    Player:Player;

    public load(): void {
        // Here we will tell the loader which files to load from the webserver
        this.game.loader.load({
            ["vert"]:{url:'shaders/crossy.vert', type:'text'},
            ["frag"]:{url:'shaders/crossy.frag', type:'text'},
            ["suzanne"]:{url:'models/Ship/Ship.obj',type:'text'}
        });
    }

    public start(): void {
        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();

        this.meshes['suzanne']=MeshUtils.LoadOBJMesh(this.gl,this.game.loader.resources["suzanne"]);
        this.meshes['ground']=MeshUtils.Plane(this.gl,{min:[0,0],max:[200,200]});

        //this.textures['ground']=this.gl.createTexture();
        //this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['ground']);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['ground']);
        // const C0 = [26, 23, 15], C1 = [245, 232, 163];
        // const W = 1024, H = 1024, cW = 256, cH = 256;
        // let data = Array(W*H*3);
        // for(let j = 0; j < H; j++){
        //     for(let i = 0; i < W; i++){
        //         data[i + j*W] = (Math.floor(i/cW) + Math.floor(j/cH))%2 == 0 ? C0 : C1;
        //     }
        // }
        // this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
        // this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, W, H, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, new Uint8Array(data.flat()));
        // this.gl.generateMipmap(this.gl.TEXTURE_2D);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.camera=new Camera();
        this.camera.type='perspective';
        this.camera.position=vec3.fromValues(0,300,300);
        this.camera.direction=vec3.fromValues(0,-2,-1);
        this.camera.aspectRatio=this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        this.controller = new FlyCameraController(this.camera, this.game.input);
        //this.controller.movementSensitivity = 0.05;
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clearColor(0,0,0,1);
        // Here we will initialize the scene objects before entering the draw loop 
    } 

    public draw(deltaTime: number): void {
       // Here will draw the scene (deltaTime is the difference in time between this frame and the past frame in milliseconds)
        this.controller.update(deltaTime);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.program.use();

        let VP = this.camera.ViewProjectionMatrix;
        let GroundMat=mat4.create();
        mat4.scale(GroundMat,GroundMat,[300,1,3000]);
        mat4.multiply(GroundMat,VP,GroundMat);
        this.program.setUniformMatrix4fv("MVP",false,GroundMat);
        // this.gl.activeTexture(this.gl.TEXTURE0);
        // this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['ground']);
        // this.program.setUniform1i('texture_sampler',0);
        this.program.setUniform4f("tint", [0.0, 1.0, 0.0, 1.0]);
        this.meshes['ground'].draw(this.gl.TRIANGLES);

        this.program.setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
        let MatSuzanne = mat4.clone(VP);
        mat4.translate(MatSuzanne, MatSuzanne, [0, 0, 300]);
        //let translate = vec3.fromValues(0,0,-1);
        //vec3.add(this.camera.position,this.camera.position,translate);
        mat4.scale(MatSuzanne, MatSuzanne, [10,10,10]);
        this.program.setUniformMatrix4fv("MVP", false, MatSuzanne);
        this.program.setUniform4f("tint", [0.0, 0.0, 0.0, 1.0]);
        this.meshes['suzanne'].draw(this.gl.TRIANGLES);
       // this.program.setUniform3f("cam_position", this.camera.position);
    }


    public end(): void {
        // Here we free the memory from objects we allocated
        this.program.dispose();
        this.program = null;
        for(let key in this.meshes)
            this.meshes[key].dispose();
        this.meshes = {};
        for(let key in this.textures)
            this.gl.deleteTexture(this.textures[key]);
        this.textures = {};
    }

}