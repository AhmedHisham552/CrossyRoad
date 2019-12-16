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
//import { Player } from '../Classes/Player';
import { toRadian } from 'gl-matrix/src/gl-matrix/common';
import { forEach } from 'gl-matrix/src/gl-matrix/vec4';

export default class CrossyRoad extends Scene{
    program: ShaderProgram;
    meshes: {[name: string]: Mesh} = {};
    camera: Camera;
    controller: FlyCameraController;
    textures: {[name: string]: WebGLTexture} = {};
    current_texture: number = 0;
    sampler: WebGLSampler;
    //Player:Player;
    //planeWidth = 402.0;             //width of double planes
    PlayerPos: vec3;
    levelMap: string[];
    blockSize = 25;
    carPositions: Array<vec3> = [];
    public load(): void {
        // Here we will tell the loader which files to load from the webserver
        this.game.loader.load({
            ["vert"]:{url:'shaders/crossy.vert', type:'text'},
            ["frag"]:{url:'shaders/crossy.frag', type:'text'},
            ["Pig"]:{url:'models/Pig/pig.obj',type:'text'},
            ["dog"]:{url:'models/dog/dog.obj', type: 'text'},
            ["car"]:{url:'models/polycar/polycar.obj', type:'text'},
            ["grass"]:{url:'images/Grass/Grass.jfif',type:'image'},
            ['pigtex']:{url:'/models/Pig/pig.png',type:'image'},
            ["dogtex"]:{url:'models/dog/dogtex.jpg', type: 'image'},
            //["cartex"]:{url:'models/polycar/polycar.mtl', type: 'image'},
            ["road"]:{url:'images/Grass/road.jpg',type:'image'},
            ["inputLevel"]:{url:'Levels/level2.txt',type:'text'}

        });
    }

    public start(): void {
                
        let levelString=this.game.loader.resources['inputLevel'];
        this.levelMap = levelString.split("\n");
        this.PlayerPos = vec3.create();
        this.PlayerPos = vec3.fromValues(this.levelMap[1].length*this.blockSize,0,0);
        console.log(this.PlayerPos);
        
        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();

        this.meshes['Pig']=MeshUtils.LoadOBJMesh(this.gl,this.game.loader.resources["Pig"]);
        this.meshes['dog']= MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["dog"]);
        //this.meshes['car']= MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["car"]);
        this.meshes['grass']=MeshUtils.Plane(this.gl,{min:[0,0],max:[1,1]});
        this.meshes['road']=MeshUtils.Plane(this.gl,{min:[0,0],max:[1,1]});

        this.camera=new Camera();
        this.camera.type='perspective';
        this.camera.position=vec3.fromValues(this.PlayerPos[0],250,this.PlayerPos[2]);
        this.camera.direction=vec3.fromValues(0,-0.83,0.554197);
        this.camera.aspectRatio=this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;

        this.controller = new FlyCameraController(this.camera, this.game.input, this.PlayerPos);
        this.controller.movementSensitivity = 0.5;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.textures['grass']= TextureUtils.LoadImage(this.gl,this.game.loader.resources['grass']);
        this.textures['road'] = TextureUtils.LoadImage(this.gl,this.game.loader.resources['road'])
        this.textures['pigtex']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['pigtex']);
        this.textures['dogtex']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['dogtex']);
        //this.textures['polycar']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['polycar']);
        this.gl.clearColor(1.0,1.0,1.0,1);
        //console.log(vec3.fromValues(0,0,0));
        
        for(let i =0; i<this.levelMap.length;i++)
        {
            for(let j =0;j<this.levelMap[i].length;j++)
            {
                if(['C','F'].includes(this.levelMap[i].charAt(j)))
                {
                    this.carPositions.push(vec3.fromValues(j*2*this.blockSize,0,i*2*this.blockSize));
                }
            }
        }
        
    } 


    public draw(deltaTime: number): void {
       // Here will draw the scene (deltaTime is the difference in time between this frame and the past frame in milliseconds)
        this.controller.update(deltaTime);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.program.use();
        console.log(this.PlayerPos);
       // console.log(this.carPositions.length);
        let VP = this.camera.ViewProjectionMatrix;
        for(let i = 0; i < this.levelMap.length; i++)
        {
            for(let j = 0; j < this.levelMap[i].length; j++)
            {
                if(['G','T'].includes(this.levelMap[i].charAt(j)))
                {
                    let GroundMat=mat4.clone(VP);    
                    mat4.translate(GroundMat, GroundMat, [(j)*2*this.blockSize,0,(i)*2*this.blockSize]);
                    mat4.scale(GroundMat,GroundMat,[this.blockSize,1,this.blockSize]);              //game block = 25*25  

                    this.program.setUniformMatrix4fv("MVP",false,GroundMat);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['grass']);
                    this.program.setUniform1i('texture_sampler',0);
                    this.program.setUniform4f("tint", [0.0, 1.0, 0.0, 1.0]);
                    this.meshes['grass'].draw(this.gl.TRIANGLES);
                }else if(['R','C','F'].includes(this.levelMap[i].charAt(j)))
                {
                    let GroundMat=mat4.clone(VP);    
                    mat4.translate(GroundMat, GroundMat, [(j)*2*this.blockSize,0,(i)*2*this.blockSize]);
                    mat4.scale(GroundMat,GroundMat,[this.blockSize,1,this.blockSize]);              //game block = 25*25  
                    mat4.rotateY(GroundMat, GroundMat, Math.PI/2);
                    this.program.setUniformMatrix4fv("MVP",false,GroundMat);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['road']);
                    this.program.setUniform1i('texture_sampler',0);
                    this.program.setUniform4f("tint", [0.0, 1.0, 0.0, 1.0]);
                    this.meshes['road'].draw(this.gl.TRIANGLES);
                }
            }
        }

        

        this.carPositions.forEach(carPos => {
                    let GroundMat=mat4.clone(VP);  

                    //translate cars in their direction
                    if((carPos[2]/(2*this.blockSize))%2){
                        let temp=(performance.now()*0.5)%(this.blockSize*this.levelMap[0].length*2);  
                        mat4.translate(GroundMat, GroundMat, [(this.blockSize*this.levelMap[0].length*2)-temp,0,carPos[2]]);
                    }
                    else{
                        mat4.translate(GroundMat, GroundMat, [(carPos[0]+performance.now()*0.5)%(this.blockSize*this.levelMap[0].length*2),0,carPos[2]]);
                    }
                    
                   // mat4.scale(GroundMat,GroundMat,[this.blockSize,1,this.blockSize]);              //game block = 25*25  
                    mat4.rotateY(GroundMat, GroundMat, Math.PI/2);
                    mat4.rotateX(GroundMat,GroundMat, -Math.PI/2);
                    if((carPos[2]/(2*this.blockSize))%2)            //if a car is in an odd lane, rotate it
                        mat4.rotateZ(GroundMat,GroundMat, Math.PI);
                    
                    this.program.setUniformMatrix4fv("MVP",false,GroundMat);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['dogtex']);
                    this.program.setUniform1i('texture_sampler',0);
                    this.program.setUniform4f("tint", [0.0, 1.0, 0.0, 1.0]);
                    this.meshes['dog'].draw(this.gl.TRIANGLES);
        });

        this.program.setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
        let MatPig = mat4.clone(VP);
        mat4.translate(MatPig,MatPig,this.PlayerPos);
        //mat4.rotateY(MatPig,MatPig,Math.PI/2);
        this.program.setUniformMatrix4fv("MVP", false, MatPig);
        this.program.setUniform4f("tint", [0.0, 0.0, 0.0, 1.0]);
        this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['pigtex']);
        this.meshes['Pig'].draw(this.gl.TRIANGLES);


        //console.log(this.camera.direction);
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