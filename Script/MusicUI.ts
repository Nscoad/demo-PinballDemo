import { _decorator, AudioClip, AudioSource, Component, director, EventTouch, Input, input, Node, ProgressBar, v3, Vec3 } from 'cc';
import { AudioMgr } from './AudioMgr';
import { UIManager } from './UIManager';
const { ccclass, property } = _decorator;

@ccclass('MusicUI')
export class MusicUI extends Component {
    @property(Node)
    public MusicBall: Node = null;
     worldPos = new Vec3();
    @property(ProgressBar)
    public MusicBar: ProgressBar = null;
    @property(AudioClip)
    public Music: AudioClip = null;
    @property(AudioSource)
     public MusicSource: AudioSource = null;

     @property(UIManager)
     public UIManager: UIManager = null;
    
    start() {
        // AudioMgr.inst.play(this.Music);
      
        this.MusicBar.progress = 0.5;
        
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);  
        // input.on(Input.EventType.TOUCH_MOVE, this.onMouseMove, this);  
       
      
       }
    protected onDestroy(): void {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);  
        // input.off(Input.EventType.TOUCH_MOVE, this.onMouseMove, this);  
    }
       onMouseDown(event){
         if(this.UIManager.ConMusic == false)return;
       let pos = v3(event.getUILocationX(),event.getUILocationY(),0);
        this.node.inverseTransformPoint(this.worldPos, pos)
        this.canMore();
        this.MoveBar();
        this.ControlMusic();   
        console.log(this.MoveBar())
        this.MusicBall.setPosition(this.worldPos.x-118,this.worldPos.y,this.worldPos.z);
       }
    //  onMouseMove(eventTouch:EventTouch){
    //     let pos = v3(eventTouch.touch.getUILocationX(),eventTouch.touch.getUILocationY(),0);
    //     this.canMore();
    //     this.node.inverseTransformPoint(this.worldPos, pos)
    //     this.MusicBall.setPosition(this.worldPos.x-130,this.worldPos.y,this.worldPos.z);
    //  }

     canMore(){
        if(this.worldPos.y !=0 ){
           this.worldPos.y = 0;
        }
        if(this.worldPos.x <43 ){
            this.worldPos.x = 43;
        }else if(this.worldPos.x > 193){
              this.worldPos.x = 193;
        }
     }

     MoveBar(){
        this.MusicBar.progress = (this.worldPos.x-43)/150;
    //     const  volume = String(this.MusicBar.progress);
       return this.MusicBar.progress; 
       
     }
     ControlMusic(){
         this.MusicSource.getComponent(AudioSource).volume = this.MusicBar.progress;
        //  AudioMgr.inst.play(volume);
     }
     
     

     

     
    
}


