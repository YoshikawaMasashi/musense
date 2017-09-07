//問題
class Question{
  constructor(firstPitch, interval, intervalName, tol){
    this.firstPitch = firstPitch;
    this.interval = interval;
    this.intervalName = intervalName;
    this.tol = tol;
    this.secondPitch = this.firstPitch + this.interval;
  }
}

//問題を生成
//intervalsには使うインターバルのリスト ex.[{interval:1, name:"▲Half"}, {interval:2, name:"▲Whole"},{interval:3, name:"▲m3"}]
class QuestionGenerator{
  constructor(intervals, tol, lowerPitch, upperPitch){
    this.intervals = intervals;
    this.tol = tol;
    this.lowerPitch = lowerPitch;
    this.upperPitch = upperPitch;
  }
  generate(){
    var interval = parseInt(Math.random()*this.intervals.length);
    var intervalName  = this.intervals[interval].name;
    interval = this.intervals[interval].interval;
    var firstPitch;
    if(interval>=0){
      //lowerPitch~upperPitchに納める→firstPitchをlowerPitch~upperPitch-intervalに納める
      firstPitch = Math.random()*(this.upperPitch-interval-this.lowerPitch) + this.lowerPitch;
    }else{
      //lowerPitch~upperPitchに納める→firstPitchをlowerPitch-interval~upperPitchに納める
      firstPitch = Math.random()*(this.upperPitch-(this.lowerPitch-interval)) + this.lowerPitch-interval;
    }
    return new Question(firstPitch, interval, intervalName, this.tol);
  }
}
