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
import Player from '../Classes/Player';

export default class CrossyRoad extends Scene{
    program: ShaderProgram;
    meshes: {[name: string]: Mesh} = {};
    camera: Camera;
    controller: FlyCameraController;
    textures: {[name: string]: WebGLTexture} = {};
    current_texture: number = 0;
    sampler: WebGLSampler;
    PlayerPos: vec3;
    incrementalValue=0;
    levelMap: string[];
    blockSize = 25;
    carPositions: Array<vec3> = [];
    origCarPositions:Array<vec3>=[];
    carStep=10;
    carSpeed=1;
    // This will store our material properties
    material = {
        diffuse: vec3.fromValues(0.5,0.3,0.1),
        specular: vec3.fromValues(1,1,1),
        ambient: vec3.fromValues(0.5,0.3,0.1),
        shininess: 1
    };

    // And this will store our directional light properties
    light = {
        diffuse: vec3.fromValues(1,1,1),
        specular: vec3.fromValues(1,1,1),
        ambient: vec3.fromValues(0.1,0.1,0.1),
        direction: vec3.fromValues(0,-10,-1)
    };
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
            ["road"]:{url:'images/Grass/road.jpg',type:'image'},
            ["inputLevel"]:{url:'Levels/level1.txt',type:'text'}

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

        this.gl.clearColor(1.0,1.0,1.0,1);
        
        for(let i =0; i<this.levelMap.length;i++)
        {
            for(let j =0;j<this.levelMap[i].length;j++)
            {
                if(['C','F'].includes(this.levelMap[i].charAt(j)))
                {
                    this.origCarPositions.push(vec3.fromValues(j*2*this.blockSize,0,i*2*this.blockSize));
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

        let VP = this.camera.ViewProjectionMatrix;
        this.program.setUniformMatrix4fv("VP", false, this.camera.ViewProjectionMatrix);
        this.program.setUniform3fv("cam_position",this.camera.position);

         // Send light properties
         this.program.setUniform3f("light.diffuse", this.light.diffuse);
         this.program.setUniform3f("light.specular", this.light.specular);
         this.program.setUniform3f("light.ambient", this.light.ambient);
         this.program.setUniform3f("light.direction", vec3.normalize(vec3.create(), this.light.direction));
        
        this.program.setUniform3f("material.diffuse", this.material.diffuse);
        this.program.setUniform3f("material.specular", this.material.specular);
        this.program.setUniform3f("material.ambient", this.material.ambient);
        this.program.setUniform1f("material.shininess", this.material.shininess);

         for(let i = 0; i < this.levelMap.length; i++)
        {
            for(let j = 0; j < this.levelMap[i].length; j++)
            {
                if(['G','T'].includes(this.levelMap[i].charAt(j)))
                {
                    let GroundMat=mat4.create();    
                    mat4.translate(GroundMat, GroundMat, [(j)*2*this.blockSize,0,(i)*2*this.blockSize]);
                    mat4.scale(GroundMat,GroundMat,[this.blockSize,1,this.blockSize]);              //game block = 25*25  
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['grass']);

                    this.program.setUniformMatrix4fv("M",false,GroundMat);
                    this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),GroundMat));
                    this.program.setUniform1i('texture_sampler',0);
                    this.program.setUniform1f("material.shininess", 1);

                    this.meshes['grass'].draw(this.gl.TRIANGLES);

                }
                else if(['R','C','F'].includes(this.levelMap[i].charAt(j)))
                {
                    let GroundMat=mat4.create();    
                    mat4.translate(GroundMat, GroundMat, [(j)*2*this.blockSize,0,(i)*2*this.blockSize]);
                    mat4.scale(GroundMat,GroundMat,[this.blockSize,1,this.blockSize]);              //game block = 25*25  
                    mat4.rotateY(GroundMat, GroundMat, Math.PI/2);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['road']);

                    this.program.setUniformMatrix4fv("M",false,GroundMat);
                    this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),GroundMat)); // Model inverse transpose for lighting
                    this.program.setUniform1f("material.shininess", 2);
                    this.program.setUniform1i('texture_sampler',0);

                    this.meshes['road'].draw(this.gl.TRIANGLES);
                }
            }
        }

        

        for(let i=0; i<this.origCarPositions.length; i++){
                    let CarMat=mat4.create();  
                    let translate = this.carStep*this.incrementalValue*this.carSpeed;
                    let MapWidth=this.blockSize*this.levelMap[0].length*2;

                   //translate cars in their direction
                    if((this.origCarPositions[i][2]/(2*this.blockSize))%2){
                        let translate = (this.carStep*this.carSpeed*this.incrementalValue)%(MapWidth);  
                        mat4.translate(CarMat, CarMat, [MapWidth-translate,0,this.origCarPositions[i][2]]);
                        this.carPositions[i][0]=(this.blockSize*this.levelMap[0].length*2)-translate;
                    }
                    else{
                        mat4.translate(CarMat, CarMat, [(this.origCarPositions[i][0]+translate)%MapWidth,0,this.origCarPositions[i][2]]);
                        this.carPositions[i][0]=(this.origCarPositions[i][0]+translate%MapWidth;
                    }
  
                    mat4.rotateY(CarMat, CarMat, Math.PI/2);
                    mat4.rotateX(CarMat,CarMat, -Math.PI/2);
                    if((this.origCarPositions[i][2]/(2*this.blockSize))%2)            //if a car is in an odd lane, rotate it
                        mat4.rotateZ(CarMat,CarMat, Math.PI);
                    
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['dogtex']);
                    this.program.setUniformMatrix4fv("M",false,CarMat);
                    this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),CarMat)); // Model inverse transpose for lighting
                    this.program.setUniform1f("material.shininess", 3);
                    this.program.setUniform1i('texture_sampler',0);
                  
                    this.meshes['dog'].draw(this.gl.TRIANGLES);

                    //Here we check for collision with the current car
                    let rangepos = vec3.fromValues(this.PlayerPos[0]+5,0,this.PlayerPos[2]+20);    //positive margin for floating point error
                    let rangeneg  = vec3.fromValues(this.PlayerPos[0]-5,0,this.PlayerPos[2]-20);   //negative margin for floating point error 

                    let firstCheck:boolean = (this.carPositions[i][2]<=rangepos[2]&&this.carPositions[i][2]>=rangeneg[2]); //Check if Car's Z component is in the collision range of player 
                    let secondCheck:boolean = (this.carPositions[i][0]<=rangepos[0]&&this.carPositions[i][0]>=rangeneg[0]);  //Check if Car's X component is in the collision range of player position
                    if(firstCheck&&secondCheck){
                        this.end(); //temporarily till we figure out how to stop the drawing loop
                    }
        }
 
        let MatPig = mat4.create();
        mat4.translate(MatPig,MatPig,this.PlayerPos);

        this.program.setUniformMatrix4fv("M", false, MatPig);
        this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),MatPig));    // Model inverse transpose for lighting
        this.program.setUniform1f("material.shininess", 1);

        this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['pigtex']);
        this.meshes['Pig'].draw(this.gl.TRIANGLES);
        this.incrementalValue++;
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