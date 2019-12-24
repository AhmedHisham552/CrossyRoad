import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import * as TextureUtils from '../common/texture-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4 } from 'gl-matrix';
import Input from '../common/input';
import { Vector, Selector, Color, NumberInput } from '../common/dom-utils';
import { createElement, StatelessProps, StatelessComponent } from 'tsx-create-element';

export default class CrossyRoad extends Scene{
    //webgl variables
    program: ShaderProgram;
    meshes: {[name: string]: Mesh} = {};
    camera: Camera;
    controller: FlyCameraController;
    textures: {[name: string]: WebGLTexture} = {};
    current_texture: number = 0;
    sampler: WebGLSampler;

    //Player variables
    PlayerPos: vec3;
    playerOrientation="Front";
    motionLocked=0;
    motionDirection=0;
    positionToTranslateTo: vec3;
    //Map variables
    levelMap: string[];
    blockSize = 25;
    levelLength;
    carPositions: Array<vec3> = [];
    origCarPositions:Array<vec3>=[];
    carSpeeds:Array<number>=[];
    treePositions:Array<vec3>=[];
    //Map boundaries
    input: Input;
    carStep=10;
    carSpeed=1;
    //these two variables will store the value of minimum and maximum horizontal displacement for the player model
    minimumX;
    maximumX;

    //Car translation variables
    incrementalValue=0;
    NormalcarSpeed=1;
    FastCarSpeed=2;


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
            ["tree"]:{url:'models/tree/tree.obj', type: 'text'},
            ["grass"]:{url:'images/Grass/Grass.jfif',type:'image'},
            ['pigtex']:{url:'/models/Pig/pig.png',type:'image'},
            ["dogtex"]:{url:'models/dog/dogtex.jpg', type: 'image'},
            ["treetex"]:{url:'models/tree/treetex.jpg',type:'image'},
            ["road"]:{url:'images/Grass/road.jpg',type:'image'},
            ["inputLevel"]:{url:'Levels/level2.txt',type:'text'},
            ["finish"]:{url:'images/finish.png',type:'image'}

        });
    }

    public start(): void {
     

        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();
        
        this.loadLevel();
        this.loadObjAndTex();
        this.cameraInit();

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clearColor(1.0,1.0,1.0,1);
        this.motionDirection=0;
        this.motionLocked=0;
    } 


    public draw(deltaTime: number): void {
       // Here will draw the scene (deltaTime is the difference in time between this frame and the past frame in milliseconds)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.program.use();
        console.log(this.PlayerPos);
        this.lightAndCameraUniforms();
        this.drawLevel();
        this.MoveAndCheckColl();
        this.drawPlayer();

        //Checks if the player finished the level
        if(this.PlayerPos[2]==this.levelLength+2*this.blockSize){
            this.start(); //restarts level upon finishing
        }
        this.incrementalValue++;

        if(this.motionLocked == 0)
            this.checkForMovement();
        else if(this.motionLocked == 1)
            this.transitionPlayerTo();
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
        while(this.carPositions.length!=0){
            this.carPositions.pop();
            this.origCarPositions.pop();
        }
    }



    private transitionPlayerTo() :void // direction:{1: W, 2: S, 3: D, 4: A}
    {
        let originalPos = this.PlayerPos;
        let delta = 10;

        console.log(this.PlayerPos);
        console.log(this.positionToTranslateTo);

        if(vec3.equals(this.PlayerPos,this.positionToTranslateTo))
        {
            this.motionLocked = 0;
            return;
        }


        switch(this.motionDirection)
        {
            case 1:
                this.PlayerPos[2] += delta;
                break;
            case 2:
                this.PlayerPos[2] -= delta;
                break;
            case 3:
                this.PlayerPos[0] -= delta;
                break;
            case 4:
                this.PlayerPos[0] += delta;
                break;
        }
        
        this.camera.position[2] = this.PlayerPos[2];
        this.camera.position[0] = this.PlayerPos[0];
    }

    private checkForMovement(){
        var input = this.game.input;

        if(input.isButtonJustDown(0)){
            input.requestPointerLock();
        }

        if(input.isPointerLocked())
        {
            let movement = vec3.create();
            movement = vec3.clone(this.PlayerPos);
            if(input.isKeyJustDown("w")) {
                movement[2] += 50;
                this.playerOrientation="Front";
                this.motionDirection = 1;
                this.motionLocked = 1;
            }
            if(input.isKeyJustDown("s")) {
                movement[2] -= 50;
                this.playerOrientation="Back";
                this.motionDirection = 2;
                this.motionLocked = 1;
            }
            if(input.isKeyJustDown("d")) {
                movement[0] -= 50;
                this.playerOrientation="Right";
                this.motionDirection = 3;
                this.motionLocked = 1;
            };
            if(input.isKeyJustDown("a")) {
                movement[0] += 50
                this.playerOrientation="Left";
                this.motionDirection = 4;
                this.motionLocked = 1;
            };
            let flag=true;
            for(let i=0;i<this.treePositions.length;i++){
                let rangepos = vec3.fromValues(movement[0]+25,0,0);    //positive margin for floating point error
                let rangeneg  = vec3.fromValues(movement[0]-25,0,0);
                let firstCheck:boolean = (this.treePositions[i][2]==movement[2]);
                let secondCheck:boolean = (this.treePositions[i][0]<=rangepos[0]&&this.treePositions[i][0]>=rangeneg[0]);
                if(secondCheck&&firstCheck){
                    flag=false;
                }
            }
            if(flag)
                this.positionToTranslateTo = vec3.clone(movement);

        }
    }
    
    private loadLevel():void{
        let levelString=this.game.loader.resources['inputLevel'];
        this.levelMap = levelString.split("\n");
        this.PlayerPos = vec3.create();
        this.PlayerPos = vec3.fromValues(this.levelMap[0].length*this.blockSize,0,0);
        this.levelLength=(this.levelMap.length*this.blockSize*2)-this.blockSize*2;
        this.minimumX=this.blockSize;
        this.maximumX=(this.levelMap[0].length*this.blockSize*2)-this.blockSize*4;
        //load car positions
        for(let i =0; i<this.levelMap.length;i++)
        {
            for(let j =0;j<this.levelMap[i].length;j++)
            {
                if(['C','F'].includes(this.levelMap[i].charAt(j)))
                {
                    this.origCarPositions.push(vec3.fromValues(j*2*this.blockSize,0,i*2*this.blockSize));
                    this.carPositions.push(vec3.fromValues(j*2*this.blockSize,0,i*2*this.blockSize));
                    if(['C'].includes(this.levelMap[i].charAt(j))){
                        this.carSpeeds.push(this.NormalcarSpeed);
                    }
                    else{
                        this.carSpeeds.push(this.FastCarSpeed);
                    }
                }
                else if(['T'].includes(this.levelMap[i].charAt(j))){
                    this.treePositions.push(vec3.fromValues(j*2*this.blockSize,0,i*2*this.blockSize));
                    console.log(this.treePositions[i]);
                }
            }
        }
    }

    private loadObjAndTex():void{
        this.meshes['Pig']=MeshUtils.LoadOBJMesh(this.gl,this.game.loader.resources["Pig"]);
        this.meshes['dog']= MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["dog"]);
        this.meshes['tree']= MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["tree"]);
        this.meshes['grass']=MeshUtils.Plane(this.gl,{min:[0,0],max:[1,1]});
        this.meshes['road']=MeshUtils.Plane(this.gl,{min:[0,0],max:[1,1]});
        this.meshes['finish']=MeshUtils.Plane(this.gl,{min:[0,0],max:[1,1]});

        this.textures['grass']= TextureUtils.LoadImage(this.gl,this.game.loader.resources['grass']);
        this.textures['road'] = TextureUtils.LoadImage(this.gl,this.game.loader.resources['road'])
        this.textures['pigtex']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['pigtex']);
        this.textures['dogtex']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['dogtex']);
        this.textures['finishline']=TextureUtils.LoadImage(this.gl,this.game.loader.resources['finish']);
    }

    private cameraInit():void{
        this.camera=new Camera();
        this.camera.type='perspective';
        this.camera.position=vec3.fromValues(this.PlayerPos[0],250,this.PlayerPos[2]);
        this.camera.direction=vec3.fromValues(0,-0.83,0.554197);
        this.camera.aspectRatio=this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
    }

    private drawLevel():void{
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
                if(['T'].includes(this.levelMap[i].charAt(j)))
                {
                    let GroundMat=mat4.create();    
                    mat4.translate(GroundMat, GroundMat, [(j)*2*this.blockSize,0,(i)*2*this.blockSize]);
                    mat4.scale(GroundMat,GroundMat,[this.blockSize,this.blockSize,this.blockSize]);              //game block = 25*25  
                    mat4.rotateY(GroundMat, GroundMat, Math.PI/2);
                    mat4.rotateZ(GroundMat, GroundMat, Math.PI);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['grass']);

                    this.program.setUniformMatrix4fv("M",false,GroundMat);
                    this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),GroundMat)); // Model inverse transpose for lighting
                    this.program.setUniform1f("material.shininess", 2);
                    this.program.setUniform1i('texture_sampler',0);

                    this.meshes['tree'].draw(this.gl.TRIANGLES);
                }
            }
        }
        for(let j = 0; j < this.levelMap[0].length-1; j++)
        {
            {
                let GroundMat=mat4.create();    
                mat4.translate(GroundMat, GroundMat, [(j)*2*this.blockSize,0,(this.levelMap.length)*2*this.blockSize]);
                mat4.scale(GroundMat,GroundMat,[this.blockSize,1,this.blockSize]);              //game block = 25*25  
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['finishline']);

                this.program.setUniformMatrix4fv("M",false,GroundMat);
                this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),GroundMat));
                this.program.setUniform1i('texture_sampler',0);
                this.program.setUniform1f("material.shininess", 1);

                this.meshes['finish'].draw(this.gl.TRIANGLES);

            }

        }
    }

    private MoveAndCheckColl():void{
        for(let i=0; i<this.origCarPositions.length; i++){
            let CarMat=mat4.create();  
            let zFactor=((this.origCarPositions[i][2]+this.levelLength)/this.levelLength);      //Adds a factor to the speed according to the lane of the car
            let translate = this.carStep*this.incrementalValue*this.carSpeeds[i]*zFactor;
            let MapWidth=(this.blockSize*this.levelMap[0].length*2)-this.blockSize*2;

            //translate cars in their direction
            if((this.origCarPositions[i][2]/(2*this.blockSize))%2){
                let translate = (this.carStep*this.carSpeeds[i]*this.incrementalValue*zFactor)%(MapWidth);  
                mat4.translate(CarMat, CarMat, [(MapWidth-translate),0,this.origCarPositions[i][2]]);
                this.carPositions[i][0]=(MapWidth-translate);
            }
            else{
                mat4.translate(CarMat, CarMat, [(this.origCarPositions[i][0]+translate)%MapWidth,0,this.origCarPositions[i][2]]);
                this.carPositions[i][0]=((this.origCarPositions[i][0]+translate)%MapWidth);
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
            let rangepos = vec3.fromValues(this.PlayerPos[0]+30,0,this.PlayerPos[2]+30);    //positive margin for floating point error
            let rangeneg  = vec3.fromValues(this.PlayerPos[0]-30,0,this.PlayerPos[2]-30);   //negative margin for floating point error 

            let firstCheck:boolean = (this.carPositions[i][2]<=rangepos[2]&&this.carPositions[i][2]>=rangeneg[2]); //Check if Car's Z component is in the collision range of player 
            let secondCheck:boolean = (this.carPositions[i][0]<=rangepos[0]&&this.carPositions[i][0]>=rangeneg[0]);  //Check if Car's X component is in the collision range of player position
            if(firstCheck&&secondCheck){
                this.end();
                this.start();   //restart game upon losing
            }
        }
    }

    private drawPlayer():void{
        //Assure player is inside map boundaries
        if (this.PlayerPos[0]>this.maximumX){
            this.PlayerPos[0]= this.maximumX - this.blockSize;
            this.motionLocked = 0;
            this.camera.position[2] = this.PlayerPos[2];
            this.camera.position[0] = this.PlayerPos[0];
        }
        else if(this.PlayerPos[0]<this.minimumX){
            this.PlayerPos[0] = this.minimumX + this.blockSize;
            this.motionLocked = 0;
            this.camera.position[2] = this.PlayerPos[2];
            this.camera.position[0] = this.PlayerPos[0];
        }
        if(this.PlayerPos[2]<0){
            this.PlayerPos[2]=0;
            this.motionLocked = 0;
            this.camera.position[2] = this.PlayerPos[2];
            this.camera.position[0] = this.PlayerPos[0];
        }

        let MatPig = mat4.create();
        mat4.translate(MatPig,MatPig,this.PlayerPos);

        if(this.playerOrientation=="Left"){
            mat4.rotateY(MatPig,MatPig,Math.PI*90/180);
        }
        else if(this.playerOrientation=="Back"){
            mat4.rotateY(MatPig,MatPig,Math.PI);
        }
        else if(this.playerOrientation=="Right"){
            mat4.rotateY(MatPig,MatPig,-Math.PI*90/180);
        }

        this.program.setUniformMatrix4fv("M", false, MatPig);
        this.program.setUniformMatrix4fv("M_it",true,mat4.invert(mat4.create(),MatPig));    // Model inverse transpose for lighting
        this.program.setUniform1f("material.shininess", 1);
        
        this.gl.bindTexture(this.gl.TEXTURE_2D,this.textures['pigtex']);
        this.meshes['Pig'].draw(this.gl.TRIANGLES);
    }

    private lightAndCameraUniforms():void{
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

    }
}