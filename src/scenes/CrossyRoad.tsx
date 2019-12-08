import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import * as TextureUtils from '../common/texture-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';
import { Vector, Selector, Color, NumberInput } from '../common/dom-utils';
import { createElement, StatelessProps, StatelessComponent } from 'tsx-create-element';
import { translate } from 'gl-matrix/src/gl-matrix/mat2d';
import { Player } from '../Classes/Player';
import { toRadian } from 'gl-matrix/src/gl-matrix/common';

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
            ["Pig"]:{url:'models/Pig/pig.obj',type:'text'},
            ["grass"]:{url:'images/Grass/Road.png',type:'image'},
            ['pigtex']:{url:'/models/Pig/pig.png',type:'image'},
            ["road"]:{url:'images/Grass/road.jfif',type:'image'}

        });
    }

    public start(): void {
        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();

        this.meshes['Pig']=MeshUtils.LoadOBJMesh(this.gl,this.game.loader.resources["Pig"]);
        this.meshes['grass']=MeshUtils.Plane(this.gl,{min:[0,0],max:[1,1]});

        this.camera=new Camera();
        this.camera.type='perspective';
        this.camera.position=vec3.fromValues(100,100,0);
        this.camera.direction=vec3.fromValues(-0.5,-2,-1);
        this.camera.aspectRatio=this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.5;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.textures['grass']= TextureUtils.LoadImage(this.gl,this.game.loader.resources['grass']);
        this.textures['pigtex']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['pigtex']);
        this.gl.clearColor(1.0,1.0,1.0,1);

    } 

    public draw(deltaTime: number): void {
       // Here will draw the scene (deltaTime is the difference in time between this frame and the past frame in milliseconds)
        this.controller.update(deltaTime);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.program.use();

        let VP = this.camera.ViewProjectionMatrix;
        let GroundMat=mat4.clone(VP);
        mat4.scale(GroundMat,GroundMat,[100,1,100]);
        this.program.setUniformMatrix4fv("MVP",false,GroundMat);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['grass']);
        this.program.setUniform1i('texture_sampler',0);
        this.program.setUniform4f("tint", [0.0, 1.0, 0.0, 1.0]);
        this.meshes['grass'].draw(this.gl.TRIANGLES);

        this.program.setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
        let MatPig = mat4.clone(VP);
        mat4.rotateY(MatPig,MatPig,180*Math.PI/180);
        mat4.translate(MatPig,MatPig,[0,0,-10]);
        this.program.setUniformMatrix4fv("MVP", false, MatPig);
        this.program.setUniform4f("tint", [0.0, 0.0, 0.0, 1.0]);
        this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['pigtex']);
        this.meshes['Pig'].draw(this.gl.TRIANGLES);
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