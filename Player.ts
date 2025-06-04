import { _decorator, Camera, Collider2D, Component, Contact2DType, Enum, EventMouse, EventTouch, game, Game, Input, input, instantiate, IPhysics2DContact, math, Prefab, ProgressBar, RigidBody2D, Sprite, Vec2, Vec3 } from 'cc';
import { Reward } from './Reward';
import { EnemyManager } from './EnemyManager';
import { UIManager } from './UIManager';
import { StartUI } from './StartUI';
const { ccclass, property } = _decorator;
export const RewardType= Enum({
    upBalls:0,
    quickBalls:1,
    normallBalls:2
})

@ccclass('Player')
export class Player extends Component {
    @property
    private forceScale: number = 0;  // 推力大小

    @property
    private hp: number = 3;  // 生命值
    // private Sprite: Sprite;

    //蓄力时间
    clickStartTime:number = 0;
    clickEndTime:number = 0;

    chargeOpen:number = 0; // 0为关闭，1为开启


    private rigidBody: RigidBody2D;
    
    collider: Collider2D = null;
    
    private bugtime:number = 0;

    //进度条
    @property(ProgressBar)
    private chargingBar: ProgressBar;

    @property({type:RewardType})
    rewardType = RewardType.upBalls;

  

    @property(Prefab)
    public playerPrefab: Prefab = null; // 玩家预制体

    public ballpos: Vec3 = new Vec3(0, 0, 0); // 小球位置


    quickBallsTime: number = 0; // 快速小球的时间
    @property
    quickBallsTimer: number = 5;

    @property
    public upballcount:number = 0;

    

    CanMove:boolean = true;

    



    nowMoveSpeed = new Vec2();  // 当前移动速度
    protected onLoad(): void {
        
        //刚体
        this.rigidBody = this.getComponent(RigidBody2D);
        this.chargingBar.progress = 0;
        this.collider = this.getComponent(Collider2D);

        //碰撞体物理条件设置
        if (this.collider) {
                    this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);//开始接触的事件
                  
                }

        
    }
    start() {
          UIManager.getInstance().updateHpUI(this.hp);
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);  
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);   // 监听鼠标抬起事件
      
          

    }
    protected update(dt: number): void {
        // console.log(this.CanMove);
        // console.log(this.quickBallsTime)
       
        //当主球出界就会扣血并且重置位置
        if(this.node.position.y < -377 ||  this.node.position.y > 377 || this.node.position.x < -377 || this.node.position.x > 377){
           this.DecreaseHp();
        }
        this.nowMoveSpeed = this.rigidBody.linearVelocity;
        //设置进度条
        if(this.chargeOpen == 1){
        this.clickStartTime += dt*1000 ;
        this.chargingBar.progress =  this.clickStartTime/2000;
        }

        switch(this.rewardType){
        case RewardType.upBalls:
                break;
        case RewardType.quickBalls:
            this.quickBalls(dt);
            break;
         case RewardType.normallBalls:
            break;
        }
       
        
        //  console.log(this.forceScale);
       
        this.bugtime ++;//bugtime为当移动较短的时候在某一帧数为直接判定小于导致可以提前移动
        if(this.bugtime >50){
            this.OpencanMove();
        }
        
    //    UIManager.getInstance().changeStartUIColor(this.CanMove);
       
    }
    protected onDestroy(): void {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);  
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);   // 监听鼠标抬起事件
    }
    onMouseDown(event: EventMouse){
        if(this.rewardType != RewardType.upBalls){
        if(this.CanMove == false)return;
        this.increaseBar();
        this.chargeOpen = 1;
         }
        
    }
    // 鼠标抬起事件处理函数
    onMouseUp(event: EventMouse) {
        if(this.rewardType != RewardType.upBalls){
        if(!this.CanMove)return;
        this.ballMove(event);
        
         }else{
            this.upBalls(event);
         }
      
    }
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){

        //设置碰撞体物理条件。否则碰撞墙壁会导致没法获取getComponent(Collider2D)的组件
      
            const reward = otherCollider.getComponent(Reward);
          if(reward){
            this.onContactToReward(reward);
        
            
          }else{

          
        }
        
     
    }
    lastReward:Reward = null; //碰撞的奖励多次触碰检测
    // 处理与奖励的接触
    onContactToReward(reward:Reward){
          if(reward == this.lastReward)return;
          switch (reward.rewardType) {
             case RewardType.upBalls:
                this.transitionToupBalls();
                break;
            case RewardType.quickBalls:
                this.transitionToquickBalls();
                break;
          }
          this.lastReward = reward;
            reward.getComponent(Collider2D).enabled = false;//碰撞后禁用奖励，防止多次触发
            reward.getComponent(Sprite).enabled = false;//碰撞后隐藏奖励
             
      
    }
   
    
    
    
    ballMove(event) {
    //处于道具效果返回

        let mousePos = event.getUILocation();   // 获取鼠标位置
        let playerPos = this.node.getPosition().clone();    // 获取玩家位置（注意两个坐标系不同，不能直接用于射击方向的计算）
        let shootDirection = new Vec2(mousePos.x - 640 - playerPos.x, mousePos.y - 360 - playerPos.y).normalize();  // 计算射击方向

        // 调试语句，用于测试getUILocation()方法和getPosition()方法的坐标输出，再进一步推导射击向量的计算公式
        // console.log(mousePos);
        // console.log(playerPos);
        // console.log(shootDirection);
        //蓄力时间
         this.forceScale =  this.clickStartTime - this.clickEndTime;
         if(this.forceScale > 2000){
             this.forceScale = 2000;
         }
        
       
        // 射击
        let force = new Vec2(shootDirection.x * this.forceScale, shootDirection.y * this.forceScale);
        // let rigidBody = this.getComponent(RigidBody2D);
        this.rigidBody.applyForceToCenter(force, true);
       this.rigidBody.applyAngularImpulse(1,true)
        this.DownonCanMove();
        this.chargeOpen = 0;
    

    }
    

    DecreaseHp(){
         
         this.hp --;
         UIManager.getInstance().updateHpUI(this.hp);
        this.rigidBody.linearVelocity = new Vec2(0,0);
         if(this.hp<=0){
             this.getComponentInChildren(Sprite).enabled  = false;
            this.node.destroy();
            game.pause(); // 暂停游戏
        }else{
            this.node.setPosition(0,0);
        }
        

         
    }
    DownonCanMove(){
        console.log("关闭移动");
           this.CanMove = false;
            UIManager.getInstance().changeStartUIColor(this.CanMove);
    }

    
    increaseBar(){
        this.chargingBar.progress = 0;
        this.clickStartTime = 0;
        // this.chargingBar.progress =  this.forceScale/2000;

    }
    transitionToupBalls(){
       this.rewardType = RewardType.upBalls;
       this.upballcount = 1;
             
    }
    transitionToquickBalls(){
        this.rewardType = RewardType.quickBalls;
        this.quickBallsTime = 0;
    }

    OpencanMove(){
            if(Math.abs(this.nowMoveSpeed.x) < 0.1 && Math.abs(this.nowMoveSpeed.y) < 0.1){
            this.CanMove = true;
            this.bugtime = 0;
            UIManager.getInstance().changeStartUIColor(this.CanMove);
           
             
            if( this.CanMove = true){
             
            console.log("可以移动");
        }
        }
    }

    //快速球的效果
    quickBalls(dt){
        this.quickBallsTime += dt; 
        if(this.quickBallsTime >= this.quickBallsTimer){
            this.rewardType = RewardType.normallBalls; // 恢复为普通小球
            this.quickBallsTime = 0; // 重置计时器     
    }
          this.CanMove = true;
          
    }

    upBalls(event){
        if(this.upballcount != 0 ){
            let screenPos = new Vec3(event.getLocationX(), event.getLocationY(), 0);
        
        // 转换为世界坐标
        let worldPos = new Vec3();

        //用父节点，若当前节点第二次点击就会出错
        this.node.parent.inverseTransformPoint(worldPos, screenPos);
        
        
        // 将节点位置设置为鼠标点击的世界坐标
        this.node.setPosition(worldPos.x+148, worldPos.y+55, worldPos.z);
        console.log("worldPos",worldPos)
        console.log("screenPos",screenPos)
       

        this.upballcount --;

        }if(this.upballcount == 0){
            this.rewardType = RewardType.normallBalls;
        }
       
       
       
       
           
          
}

        
    
      
}


