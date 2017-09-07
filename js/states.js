//問題部分
class QuestionState extends Phaser.State {
  constructor(question, finishCallback, leftUpText) {
    super();
    this.question = question;
    this.finishCallback = finishCallback;
    this.leftUpText = leftUpText;
  }
  preload() {}
  create() {
    //値初期化
    this.befPitch = -1;
    this.startTime = this.time.now/1000;
    this.befTime = 0;
    this.okbuf1 = 0.;
    this.okbuf2 = 0.;
    this.mode = 0;

    //色彩
    this.colorH = 360*Math.random();

    //音再生
    this.osc = audioCtx.createOscillator();
    this.osc.type = 'triangle';
    this.gain = audioCtx.createGain();
    this.osc.connect(this.gain);
    this.gain.connect(audioCtx.destination);
    this.osc.frequency.value = pit2frq(this.question.firstPitch);
    this.gain.gain.value = 1;
    this.osc.start(0);
    window.setTimeout(function() {
        this.osc.stop(0);
    }.bind(this), 2000);

    var x_,y_;

    //音程表示
    [x_,y_] = decode_xy(0.5, 0.5, 0, this.game.width, 0, this.game.height);
    this.intervalText = this.add.text(0, 0, this.question.intervalName,
                        {font:'bold 60pt Arial', fill:'#000000'});
    [this.intervalText.centerX,this.intervalText.centerY] = [x_,y_];
    this.intervalText.alpha=0.2;

    //音程範囲を描画
    this.teachRangeGrpc = this.add.graphics(0,0);
    var x1,x2,y1,y2;
    [x1, y1] = this.timepitch2xy(1, this.question.firstPitch - this.question.tol, 6);
    [x2, y2] = this.timepitch2xy(6, this.question.firstPitch + this.question.tol, 6);
    [x1, y1] = decode_xy(x1, y1, 0, this.game.width, 0, this.game.height);
    [x2, y2] = decode_xy(x2, y2, 0, this.game.width, 0, this.game.height);
    this.teachRangeGrpc.beginFill(hsv2rgb(this.colorH,0.2,0xd4),0.3);
    this.teachRangeGrpc.drawRect(x1, y1, x2-x1, y2-y1);

    //音程ラインを描画
    this.teachGrpc = this.add.graphics(0,0);
    this.teachGrpc.lineStyle(5,0xBBBBBB);
    for(var i = 0; i < 60; i++) {
      if(i >= 10){
        this.teachGrpc.lineStyle(5,hsv2rgb(this.colorH,0.2,0xd4));
      }
      [x_,y_] = this.timepitch2xy(i/10, this.question.firstPitch, 6);
      [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
      this.teachGrpc.moveTo(x_,y_);
      [x_,y_] = this.timepitch2xy((i+1/10), this.question.firstPitch, 6);
      [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
      this.teachGrpc.lineTo(x_,y_);
    }

    //歌声音程ライン初期化
    this.singGrpc = this.add.graphics(0,0);
    this.singGrpc.lineStyle(5,0xBBBBBB);
    this.singColor = hsv2rgb(this.colorH,0.7,0xa5);

    //waveアニメーション初期化
    this.waveFrq = 400;
    this.waveX = new Float32Array(this.waveFrq+1);
    this.waveY = new Float32Array(this.waveFrq+1);
    this.waveGrpc = this.add.graphics(0,0);
    this.waveColor = hsv2rgb(this.colorH,0.08,0xf5);

    //今の線初期化
    this.nowLine = this.add.graphics(0,0);

    //テキスト
    if(this.leftUpText !== undefined){
      this.add.text(0, 0, this.leftUpText,
                                {font:'bold 24pt Arial', fill:"#666666"});
    }
  }
  update() {
    this.now = this.time.now/1000 - this.startTime;

    //音調整
    this.gain.gain.value = Math.min(this.now*1000,
                            Math.max(1 - 0.5*this.now, 0));

    var x_,y_;

    //今の線
    x_ = this.time2x(this.now, 6)*this.game.width;
    this.nowLine.clear();
    this.nowLine.lineStyle(1,0xDDDDDD);
    this.nowLine.moveTo(x_, 0);
    this.nowLine.lineTo(x_, this.game.height);

    //歌声音程ライン
    if(this.bef_time < 1 && this.now >= 1){
      this.singGrpc.lineStyle(5,this.singColor);
    }
    if(this.bef_pitch != -1 && pitch != -1){
      [x_,y_] = this.timepitch2xy(this.bef_time, this.bef_pitch, 6);
      [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
      this.singGrpc.moveTo(x_,y_);
      [x_,y_] = this.timepitch2xy(this.now, pitch, 6);
      [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
      this.singGrpc.lineTo(x_,y_);
    }

    //waveアニメーション
    this.waveGrpc.clear();
    this.waveGrpc.lineStyle(5,this.waveColor);
    var audioSize = Math.min(1,mag*5);
    var teachSize = Math.exp(-3*this.now)*10*this.now;
    var waveGweight = logistic((this.now-2)*2);
    var waveGSize = waveGweight*audioSize+ (1-waveGweight)*teachSize;
    for(var i = 0; i < this.waveFrq+1; i++) {
      this.waveX[i] = i/this.waveFrq;
      this.waveY[i] = 0.1 * waveGSize * Math.sin(this.waveX[i]*50+this.now*50)
                      * (Math.sin(this.now*20)) +0.5;
    }
    this.waveGrpc.moveTo(0,0);
    for(var i = 0; i < this.waveFrq+1; i++) {
      [x_,y_] = decode_xy(this.waveX[i], this.waveY[i], 0, this.game.width, 0,
                this.game.height);
      this.waveGrpc.lineTo(x_, y_);
    }
    this.game.world.moveDown(this.waveGrpc);

    //firstPitchを歌えているか
    if(this.now >= 1 && this.now <= 6 && this.mode == 0
      && pitch >= this.question.firstPitch-this.question.tol
      && pitch <= this.question.firstPitch+this.question.tol
      && this.bef_pitch >= this.question.firstPitch-this.question.tol
      && this.bef_pitch <= this.question.firstPitch+this.question.tol){
      this.okbuf1 += this.now - this.bef_time;
    }
    //secondPitchを歌えているか
    if(this.now >= 1 && this.now <= 6 && this.mode == 1
      && pitch >= this.question.secondPitch-this.question.tol
      && pitch <= this.question.secondPitch+this.question.tol
      && this.bef_pitch >= this.question.secondPitch-this.question.tol
      && this.bef_pitch <= this.question.secondPitch+this.question.tol){
      this.okbuf2 += this.now - this.bef_time;
    }

    //歌えたか判定
    if(this.mode == 0 && this.okbuf1 >= 1){
      this.mode = 1;
      [x_,y_] = this.timepitch2xy(this.now-1, this.question.firstPitch, 6);
      [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
      var okText = this.add.text(x_, y_, "OK!",
                                {font:'bold 36pt Arial', fill:'black'});

      this.teachRangeGrpc.clear()
      this.teachRangeGrpc.beginFill(hsv2rgb(this.colorH,0.2,0xd4),0.3);
      var x1,x2,y1,y2;
      [x1, y1] = this.timepitch2xy(1, this.question.firstPitch - this.question.tol, 6);
      [x2, y2] = this.timepitch2xy(this.now, this.question.firstPitch + this.question.tol, 6);
      [x1, y1] = decode_xy(x1, y1, 0, this.game.width, 0, this.game.height);
      [x2, y2] = decode_xy(x2, y2, 0, this.game.width, 0, this.game.height);
      this.teachRangeGrpc.drawRect(x1, y1, x2-x1, y2-y1);
      [x1, y1] = this.timepitch2xy(this.now, this.question.secondPitch - this.question.tol, 6);
      [x2, y2] = this.timepitch2xy(6, this.question.secondPitch + this.question.tol, 6);
      [x1, y1] = decode_xy(x1, y1, 0, this.game.width, 0, this.game.height);
      [x2, y2] = decode_xy(x2, y2, 0, this.game.width, 0, this.game.height);
      this.teachRangeGrpc.drawRect(x1, y1, x2-x1, y2-y1);

      var teach_t = new Float32Array(61);
      var teach_pitch = new Float32Array(61);
      for(var i = 0; i < 61; i++) {
        teach_t[i] = i/10;
        teach_pitch[i] = this.question.firstPitch
                        + this.question.interval*logistic((teach_t[i]-this.now-1)*10);
      }
      this.teachGrpc.clear();
      this.teachGrpc.lineStyle(5,0xBBBBBB);
      for(var i = 0; i < 60; i++) {
        if(i==10){
          this.teachGrpc.lineStyle(5,hsv2rgb(this.colorH,0.2,0xd4));
        }
        [x_,y_] = this.timepitch2xy(teach_t[i], teach_pitch[i], 6);
        [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
        this.teachGrpc.moveTo(x_,y_);
        [x_,y_] = this.timepitch2xy(teach_t[i+1], teach_pitch[i+1], 6);
        [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
        this.teachGrpc.lineTo(x_,y_);
      }
    }
    if(this.mode == 1 && this.okbuf2 >= 1){
      this.mode = 2;
      [x_,y_] = this.timepitch2xy(this.now-1, this.question.secondPitch, 6);
      [x_,y_] = decode_xy(x_, y_, 0, this.game.width, 0, this.game.height);
      var okText = this.add.text(x_, y_, "OK!",
                                {font:'bold 36pt Arial', fill:'black'});
    }

    if(this.mode == 2 && this.now <= 6){
      this.mode = 3;
      [x_,y_] = decode_xy(0.5, 0.5, 0, this.game.width, 0, this.game.height);
      var resultText = this.add.text(x_, y_, "success!",
                                    {font:'bold 36pt Arial', fill:'black'});
      [resultText.centerX, resultText.centerY] = [x_,y_];
      window.setTimeout(function() {
        this.finishCallback(true);
      }.bind(this), 500);
    }
    if(this.now > 6 && this.mode < 2){
      this.mode = 3;
      [x_,y_] = decode_xy(0.5, 0.5, 0, this.game.width, 0, this.game.height);
      var resultText = this.add.text(x_, y_, "failed!",
                                    {font:'bold 36pt Arial', fill:'black'});
      [resultText.centerX, resultText.centerY] = [x_,y_];
      window.setTimeout(function() {
        this.finishCallback(false);
      }.bind(this), 500);
    }

    //前回アップデート時のピッチタイム
    this.bef_pitch = pitch;
    this.bef_time = this.now;
  }
  timepitch2xy(time, pitch, totalT){
    var up = Math.max(this.question.firstPitch, this.question.secondPitch);
    var dp = Math.min(this.question.firstPitch, this.question.secondPitch);
    return [time/totalT,(pitch-dp+1)/(up-dp+2)];
  }
  time2x(time, totalT){
    return time/totalT;
  }
}

//問題準備
class ExamReadyState extends Phaser.State {
  constructor(finishCallback) {
    super();
    this.finishCallback = finishCallback;
  }
  preload() {}
  create() {
    this.startTime = this.time.now/1000;
    var x_,y_;
    [x_,y_] = [0.5,0.5];
    [x_,y_] = decode_xy(x_,y_, 0, this.game.width, 0, this.game.height);
    this.text = this.add.text(x_, y_, "3",
                                  {font:'bold 96pt Arial', fill:'black', align:'center'});
    [this.text.centerX, this.text.centerY] = [x_,y_];
  }
  update() {
    this.now = this.time.now/1000 - this.startTime;

    var resTime = parseInt(4- this.now);
    resTime = Math.max(1, resTime);
    this.text.text = resTime;
    this.game.world.bringToTop(this.text);
    var circle = this.game.add.graphics(0, 0);
    circle.beginFill(randomColor(0.33,0xc4), 0.2);
    var x_,y_;
    x_ = Math.random();
    y_ = Math.random();
    [x_,y_] = decode_xy(x_,y_, 0, this.game.width, 0, this.game.height);
    circle.drawCircle(x_, y_, this.now*Math.random()*100);

    if(this.now >= 3){
      this.finishCallback();
    }
  }
}

//結果画面
class ExamResultState extends Phaser.State {
  constructor(finishCallback, result) {
    super();
    this.finishCallback = finishCallback;
    this.result = result;

    this.successN = 0;
    for(var i = 0; i < this.result.length; i++){
      if(this.result[i]==true){
        this.successN++;
      }
    }
  }
  preload() {}
  create() {
    var x_,y_;
    [x_,y_] = decode_xy(0.5, 0.7, 0, this.game.width, 0, this.game.height);
    this.title = this.add.text(x_, y_, "Result",
                                  {font:'bold 24pt Arial', fill:'black'});
    [this.title.centerX, this.title.centerY] = [x_,y_];

    [x_,y_] = decode_xy(0.5, 0.5, 0, this.game.width, 0, this.game.height);
    this.text = this.add.text(x_, y_, String(this.successN) + "/" + String(this.result.length),
                                  {font:'bold 96pt Arial', fill:'black', align:'center'});
    [this.text.centerX, this.text.centerY] = [x_,y_];

    [x_,y_] = decode_xy(1, 0, 0, this.game.width, 0, this.game.height);
    this.back = this.add.text(x_, y_, "Back",
                                  {font:'bold 24pt Arial', fill:'black', align:'right'});
    [this.back.x, this.back.y] = [x_-this.back.width, y_-this.back.height];
    this.back.inputEnabled = true;
    this.back.events.onInputDown.add(this.onclickBackBtn, this);

  }
  update() {
    this.now = this.time.now/1000 - this.startTime;
  }

  onclickBackBtn(){
    this.finishCallback();
  };
}

//最初のメニュー
class MenuState extends Phaser.State {
  constructor(){
    super();
    this.intervals = [{interval:1, name:"▲Half"}, {interval:2, name:"▲Whole"},
                    {interval:3, name:"▲m3"}, {interval:4, name:"▲M3"},
                    {interval:5, name:"▲4"}, {interval:6, name:"▲5-"},
                    {interval:7, name:"▲5"}, {interval:8, name:"▲m6"},
                    {interval:9, name:"▲M6"}, {interval:10, name:"▲m7"},
                    {interval:11, name:"▲M7"}, {interval:12, name:"▲8"},
                    {interval:-1, name:"▼Half"}, {interval:-2, name:"▼Whole"},
                    {interval:-3, name:"▼m3"}, {interval:-4, name:"▼M3"},
                    {interval:-5, name:"▼4"}, {interval:-6, name:"▼5-"},
                    {interval:-7, name:"▼5"}, {interval:-8, name:"▼m6"},
                    {interval:-9, name:"▼M6"}, {interval:-10, name:"▼m7"},
                    {interval:-11, name:"▼M7"}, {interval:-12, name:"▼8"}]
  }
  preload() {}
  create() {
    game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
    this.game.time.desiredFps = 30;

    this.stage.backgroundColor = 0xFBFBFB;

    this.text1 = this.add.text(10, 0, "Select intervals",
                                  {font:'bold 18pt Arial', fill:'black'});
    this.text1.centerY = this.game.height/13/2;
    this.itvBtns = [];
    for(var i = 0; i < this.intervals.length; i++){
      var itvBtn = new SwitchTextButton(this.game,
                                      (i%3)*this.game.width/3+1, (parseInt(i/3)+1)*this.game.height/13+1,
                                      this.game.width/3-2, this.game.height/13-2, 10,
                                      this.intervals[i].name, {font:'bold 18pt Arial', fill:'black'});
      this.world.addChild(itvBtn);
      this.itvBtns.push(itvBtn);
    }

    this.text2 = this.add.text(10, 0, "Which",
                                  {font:'bold Arial', fontSize: '18px', fill:'black'});
    this.text2.centerY = this.game.height/13*9.3 + this.game.height/13/2;

    this.femaleBtn = new SelectButton(this.game,
                                    this.game.width/2, 9.3*this.game.height/13+1,
                                    this.game.width/2, this.game.height/13, ["male", "female"], 0);
    this.world.addChild(this.femaleBtn);

    this.text3 = this.add.text(10, 0, "Select Tolerance",
                                  {font:'bold Arial', fontSize: 18, fill:'black'});
    this.text3.centerY = this.game.height/13*10.6 + this.game.height/13/2;

    this.tolBtn = new SelectButton(this.game,
                                    this.game.width/2, 10.6*this.game.height/13+1,
                                    this.game.width/2, this.game.height/13, [0.1, 0.3, 0.5], 1);
    this.world.addChild(this.tolBtn);

    this.startBtn = new TextButton(this.game,
                                    0, 12*this.game.height/13+1,
                                    this.game.width, this.game.height/13-2, 10,
                                    "Start", {font:'bold 18pt Arial', fill:'black'});
    this.startBtn.inputEnabled = true;
    this.startBtn.events.onInputDown.add(this.onclickStartBtn, this);
    this.world.addChild(this.startBtn);
  }
  update() {}

  onclickStartBtn(){
    //webaudioのタッチ制約対応
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 440;
    gain.gain.value = 0;
    osc.start(0);
    osc.stop(0);

    var sendIntervals = [];
    for(var i = 0; i < this.itvBtns.length; i++){
      if(this.itvBtns[i].isOn){
        sendIntervals.push(this.intervals[i]);
      }
    }

    if(sendIntervals.length > 0){
      var tol = this.tolBtn.getSelected();
      if(this.femaleBtn.getSelected() == 'male'){
        var examManager = new ExamManager(10, this.state, sendIntervals, tol, 24, 37);
        examManager.start("menu");
      }else{
        var examManager = new ExamManager(10, this.state, sendIntervals, tol, 36, 50);
        examManager.start("menu");
      }
    }
  };
}

//問題集に相当するもの
//問題数，種類，正誤などを管理する
//それぞれのStateの遷移も行う．
class ExamManager{
  constructor(qNum, state, intervals, tol, lowerPitch, upperPitch){
    this.qNum = qNum;
    this.result = [];
    this.pasts = [];
    this.state = state;
    this.questionGenerator = new QuestionGenerator(intervals, tol, lowerPitch, upperPitch);
  }
  newQuestion(){
    //var question = this.generateQuestion();
    var question = this.questionGenerator.generate();
    this.pasts.push(question);
    return question;
  }
  start(nextStateName){
    this.nextStateName = nextStateName;

    var examReadyState = new ExamReadyState(this.finishReady.bind(this));
    this.state.add("examReady", examReadyState);
    this.state.start("examReady");
  }
  finishReady(name, bSuccess){
    var questionState = new QuestionState(this.newQuestion(), this.finishQuestion.bind(this), '1/'+String(this.qNum));
    this.state.remove("examReady");
    this.state.add("question", questionState);
    this.state.start("question");
  }
  finishQuestion(bSuccess){
    this.result.push(bSuccess);

    if(this.result.length == this.qNum){
      var examResultState = new ExamResultState(this.finishResult.bind(this), this.result);
      this.state.remove("question");
      this.state.add("examResult", examResultState);
      this.state.start("examResult");
    }else{
      var questionState = new QuestionState(this.newQuestion(), this.finishQuestion.bind(this), String(this.result.length+1) + '/' + String(this.qNum));
      this.state.remove("question");
      this.state.add("question", questionState);
      this.state.start("question");
    }
  }
  finishResult(){
    this.state.start(this.nextStateName);
    this.state.remove("examResult");
  }
}
