//オーディオ関係の処理
//ピッチ検出を行います
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

var micBuf;
var pitch = -1;
var mag = -1;
if (navigator.getUserMedia) {
  navigator.getUserMedia (
    // 音声を有効にする
    {audio: true},
    // コールバック
    function(stream) {
      var source = audioCtx.createMediaStreamSource(stream);
      var processor = audioCtx.createScriptProcessor(1024,1,1);

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = function(e){
        //波形データをmic_bufとして取得
        micBuf = e.inputBuffer.getChannelData(0);

        pitch = pitchDetect(micBuf);

        var tmpMag = 0;
        for(var i = 0; i < micBuf.length; i++) {
          tmpMag += micBuf[i]*micBuf[i];
        }
        tmpMag /= micBuf.length;
        mag = tmpMag;
      };
    },
    // エラー時のフィードバック
    function(err) {
      console.log('The following gUM error occured: ' + err);
    });
}

//ピッチ検出アルゴリズム
//TODO:このアルゴリズムは微妙なのであとで検討
function pitchDetect(buf){
  var newBuf = new Float32Array(buf.length*2);
  newBuf.set(buf);
  var newBufImag = new Float32Array(buf.length*2);

  FFT.init(buf.length*2);
  FFT.fft1d(newBuf, newBufImag);

  var ac = new Float32Array(buf.length*2);
  for(var i = 0; i < buf.length*2; i++) {
    ac[i] = newBuf[i]*newBuf[i] + newBufImag[i]*newBufImag[i];
  }

  //マグニチュードでやろうかと思ったが，
  //やっぱりパワースペクトルでやる
  var psMax = 0;
  for(var i = 0; i < buf.length*2; i++) {
    if(psMax < ac[i]){
      psMax = ac[i];
    }
  }
  if(psMax < 100){
    return -1;
  }

  newBufImag = new Float32Array(buf.length*2);
  FFT.ifft1d(ac, newBufImag);

  var magnitude = new Float32Array(buf.length);
  magnitude[buf.length-1] = buf[0]**2 + buf[buf.length-1]**2;
  for(var i = 1; i < buf.length; i++) {
    magnitude[buf.length-1-i] = magnitude[buf.length-i] + buf[i]**2
                                + buf[buf.length-1-i]**2;
  }

  //音が小さい場合は-1
  //if(magnitude[0]/2 < 0.5){
  //  return -1;
  //}

  var nsdf = new Float32Array(buf.length);
  for(var i = 0; i < buf.length; i++) {
    nsdf[i] = 2*ac[i]/magnitude[i];
  }

  var peekTime = [];
  var flg = false;
  for(var i = 0; i < buf.length; i++) {
    if(flg == false && nsdf[i] > 0){
      flg = true;
      peekTime.push(i);
    }
    else if(flg == true && nsdf[i] > 0){
      if(nsdf[i] > nsdf[peekTime[peekTime.length-1]]){
        peekTime[peekTime.length-1] = i;
      }
    }
    else if(flg == true && nsdf[i] <= 0){
      flg = false;
    }
  }

  var peek = [];
  var modifiedPeekTime = [];
  for(var i = 0; i < peekTime.length; i++) {
    x0 = peekTime[i];
    if(x0 == 0 || x0 == buf.length-1){
      continue;
    }
    a = nsdf[x0-1]/2 -nsdf[x0] + nsdf[x0+1]/2;
    b = -nsdf[x0-1]*x0 -nsdf[x0-1]/2 + 2*nsdf[x0]*x0 -nsdf[x0+1]*x0
        + nsdf[x0+1]/2;
    c = nsdf[x0-1]*(x0**2)/2 + nsdf[x0-1]*x0/2 - nsdf[x0]*(x0**2) + nsdf[x0]
        + nsdf[x0+1]*(x0**2)/2 - nsdf[x0+1]*x0/2;

    modifiedPeekTime.push(-b/(2*a));
    peek.push(-(b**2)/(4*a) + c);
  }

  var peekMax = 0;
  for(var i = 0; i < peek.length; i++) {
    if(peek[i] > peekMax){
      peekMax = peek[i];
    }
  }

  var peekThr = 0.8*peekMax;
  var cycle;
  for(var i = 0; i < peek.length; i++) {
    if(peek[i] > peekThr){
      cycle = modifiedPeekTime[i];
      break;
    }
  }

  var frq = audioCtx.sampleRate/cycle;

  return frq2pit(frq);
}

//周波数からピッチへ変換
function frq2pit(frq){
  var pit = Math.log2(frq/(440/(2**4)))*12;
  return pit;
}
//ピッチから周波数へ変換
function pit2frq(pit){
  var frq = (2**(pit/12))*(440/(2**4));
  return frq;
}

var menuState = new MenuState();
var game = new Phaser.Game(375, 667, Phaser.AUTO, 'musense');
game.state.add("menu", menuState);
game.state.start("menu");

var musense = document.getElementById("musense");
musense.style.height = window.innerHeight+"px";
if(window.innerWidth>0.5*window.innerHeight && window.innerWidth<0.8*window.innerHeight){
  musense.style.width = window.innerWidth+"px";
}else{
  musense.style.width = window.innerHeight*375/667+"px";
}

window.onresize = function () {
  var musense = document.getElementById("musense");
  musense.style.height = window.innerHeight+"px";
  if(window.innerWidth>0.5*window.innerHeight && window.innerWidth<0.8*window.innerHeight){
    musense.style.width = window.innerWidth+"px";
  }else{
    musense.style.width = window.innerHeight*375/667+"px";
  }
};
