//座標を変換
//0~1に納める
function encode_xy(x, y, l, r, t, d){
  return [(x-l)/(r-l), (y-d)/(t-d)];
}
//0~1から元に戻す
function decode_xy(x, y, l, r, t, d){
  return [x*(r-l)+l, y*(t-d)+d];
}

//ロジスティック関数
function logistic(x){
  return (Math.tanh(x/2)+1)/2;
}

function hsv2rgb(h, s, v){
  var c = v * s;
  var h = h / 60;
  var x = c * (1 - Math.abs(h % 2 - 1));

  var r, g, b;
  switch(parseInt(h)){
    case 0:
      [r,g,b]=[c,x,0];
      break;
    case 1:
      [r,g,b]=[x,c,0];
      break;
    case 2:
      [r,g,b]=[0,c,x];
      break;
    case 3:
      [r,g,b]=[0,x,c];
      break;
    case 4:
      [r,g,b]=[x,0,c];
      break;
    case 5:
      [r,g,b]=[c,0,x];
      break;
  }

  var m = v - c;
  [r, g, b] = [r+m, g+m, b+m];

  r = parseInt(r);
  g = parseInt(g);
  b = parseInt(b);

  var ret;
  ret = 0x10000*r;
  ret += 0x100*g;
  ret += b;
  return ret;
}
//カラーをランダムに求める
//s彩度(0~1)
//v明度(0~255)
function randomColor(s, v){
  var h = 360*Math.random();

  return hsv2rgb(h, s, v);
}

//OnOffをするテキストボタン
class SwitchTextButton extends Phaser.Graphics {
  constructor(game, x, y, width, height, round, text, style){
    super(game, x, y);

    this.bkWidth = width;
    this.bkHeight = height;
    this.round = round;

    this.onColor = randomColor(0.20,0xDD);
    this.offColor = 0xCCCCCC;

    var text = new Phaser.Text(game, x, y, text, style);
    text.centerX = width/2;
    text.centerY = height/2;
    this.addChild(text);

    this.inputEnabled = true;
    this.events.onInputDown.add(this.onClick, this);

    this.isOn = false;
    this.colorChange();
  }

  colorChange(){
    this.clear();
    if(this.isOn){
      this.beginFill(this.onColor,1);
    }else{
      this.beginFill(this.offColor,1);
    }
    this.drawRoundedRect(0, 0, this.bkWidth, this.bkHeight, this.round);
  }

  onClick(){
    this.isOn = !this.isOn;
    this.colorChange();
  }
}

//選択式ボタン
//choices:選択肢のリスト
//横向き width>height
class SelectButton extends Phaser.Graphics {
  constructor(game, x, y, width, height, choices, dflt){
    super(game, x, y);

    this.sbWidth = width;
    this.sbHeight = height;
    this.r = height/3;
    this.lineLength = width - this.r*2 - this.r*2;
    this.choiceNum = choices.length;
    this.choices = choices;

    this.onColor = randomColor(0.20,0xDD);
    this.offColor = 0xCCCCCC;

    this.lineStyle(5, this.offColor);
    this.moveTo(this.r+this.r, this.r*2);
    this.lineTo(this.r+this.r+this.lineLength, this.r*2);

    for(var i = 0; i < this.choiceNum; i++){
      var switch_ = new Phaser.Graphics(game, 0, 0);
      switch_.id = i;
      this.addChild(switch_);
      switch_.beginFill(this.offColor,1);
      switch_.drawCircle(this.r +this.r+ this.lineLength/(this.choiceNum-1)*i,this.r*2,this.r);

      switch_.inputEnabled = true;
      switch_.events.onInputDown.add(this.onClick, switch_);

      var switchText = new Phaser.Text(game, 0, 0, choices[i],
                                      {font:'bold Arial', fontSize: this.r, fill:'black'});
      this.addChild(switchText);
      switchText.centerX = this.r +this.r+ this.lineLength/(this.choiceNum-1)*i
      switchText.Y = 0;
    }

    this.selectedId = dflt;
    this.selected = new Phaser.Graphics(game, 0, 0);
    this.addChild(this.selected);
    this.drawSelected();
  }

  drawSelected(){
    this.selected.clear();
    this.selected.beginFill(this.onColor,1);
    this.selected.drawCircle(this.r +this.r+ this.lineLength/(this.choiceNum-1)*this.selectedId,this.r*2,this.r*1.6);
  }
  onClick(){
    this.parent.selectedId = this.id;
    this.parent.drawSelected();
  }

  getSelected(){
    return this.choices[this.selectedId];
  }
}

//テキストボタン
class TextButton extends Phaser.Graphics {
  constructor(game, x, y, width, height, round, text, style){
    super(game, x, y);

    this.bkWidth = width;
    this.bkHeight = height;
    this.round = round;

    this.onColor = 0xEEEECC;
    this.offColor = 0xCCCCCC;

    var text = new Phaser.Text(game, x, y, text, style);
    text.centerX = width/2;
    text.centerY = height/2;
    this.addChild(text);

    this.beginFill(this.onColor,1);
    this.drawRoundedRect(0, 0, this.bkWidth, this.bkHeight, this.round);
  }
}
