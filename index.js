//事件监听器
var EventCenter = {
  on: function(type, handler){
    $(document).on(type, handler)
  },
  fire: function(type, data){
    $(document).trigger(type, data)
  }
}

//底部小图
var Footer={
  init:function(){
    this.$footer = $('footer')
    this.$picList = this.$footer.find('.pic-list')
    this.$ul = this.$footer.find('ul')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.isToEnd = false
    this.isToStart = true
    this.isAnimate = false
    this.bind()
    this.render()
  },
  bind:function(){
    var _this = this
    
    // 左按钮
    this.$leftBtn.on('click',function(){
      if(_this.isAnimate) return
      var itemWidth = _this.$picList.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$picList.width()/itemWidth)
      
      if(!_this.isToStart){
        _this.isAnimate = true
         _this.$ul.animate({
          left:'+='+itemWidth*rowCount
         },500,function(){
          _this.isToEnd = false
          _this.isAnimate = false
          if(parseFloat(_this.$ul.css('left'))>=0){
            _this.isToStart = true
          }
        })
      }    
    }) 
    
    // 右按钮
    this.$rightBtn.on('click',function(){
      if(_this.isAnimate) return
      var itemWidth = _this.$picList.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$picList.width()/itemWidth)
      
      if(!_this.isToEnd){
         _this.isAnimate = true
         _this.$ul.animate({
          left:'-='+itemWidth*rowCount
         },500,function(){
           console.log(_this.$ul.css('left'))
           console.log(_this.$ul.css('width'))
          _this.isToStart = false
          _this.isAnimate = false
          if(parseFloat(_this.$picList.width())-parseFloat(_this.$ul.css('left'))>=parseFloat(_this.$ul.css('width'))){
            _this.isToEnd = true
          }
        })
      }    
    })
    
    //点击某一个 li 时，给加一个active 状态,同时去 触发一个事件
    this.$footer.on('click','li',function(){
      $(this).addClass('.active').siblings().remove('.active')
      
      EventCenter.fire('select-kind',{
        channelId: $(this).attr('data-channel-id'),
        channelName: $(this).attr('data-channel-name')
      })
    }) 
  },
  
  render:function(){
    var _this = this
    $.getJSON('https://api.jirengu.com/fm/v2/getChannels.php')
      .done(function(ret){
        console.log(ret)
        _this.renderFooter(ret.channels)
      }).fail(function(){
        console.log('error....')
      })
  },
  renderFooter:function(channels){
    var html=''
    channels.forEach(function(channel){
      html+='<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
      +'<div class="item" style="background-image:url('+channel.cover_small+')"></div>'
      +'<h3>'+channel.name+'</h3>'
      +'</li>'
    })
    this.$ul.html(html)
    this.setStyle()
  },
  setStyle:function(){
    var count = this.$footer.find('li').length
    var width = this.$footer.find('li').outerWidth(true)
    this.$ul.css({
      width:count*width+'px'
    })
  }   
}

// 头部音乐播放
var Fm={
  init:function(){
    this.$container = $('#pageMusic')
    this.audio = new Audio()
    this.audio.autoplay = true
    this.bind()
  },
  bind:function(){
    var _this = this
    EventCenter.on('select-kind',function(e,channelObj){
      _this.channelId = channelObj.channelId
      _this.channelName = channelObj.channelName
      _this.loadMusic()
    })
    
    // play|pause|next 按钮
    this.$container.find('.btn-play').on('click',function(){
      var $btn= $(this)
      if($btn.hasClass('icon-play')){
        $btn.removeClass('icon-play').addClass('icon-pause')
        _this.audio.play()
      }else{
        $btn.removeClass('icon-pause').addClass('icon-play')
        _this.audio.pause()
      }
    })
    
    this.$container.find('.btn-next').on('click',function(){
      _this.loadMusic(function(){
        _this.setMusic()
      })
    })   
    
    // 监听play|pause
    this.audio.onplay=function(){
      clearInterval(_this.clockStatus)
      _this.clockStatus= setInterval(function(){
        _this.updateStatus()
      },1000)
    }
    
    this.audio.onpause=function(){
      clearInterval(_this.clockStatus)
    }

    this.$container.find('.bar').on('click',function(e){
          var percentage = e.offsetX/parseFloat($(this).css('width'))
          _this.audio.currentTime = percentage * _this.audio.duration
    })

    this.$container.find('.btn-collection').on('click', function(){
      var $btn = $(this)
      if($btn.hasClass('active')){
        $btn.removeClass('active')
      }else{
        $(this).addClass('active')
      }
    })
    
  },
  
  // 获取音乐
  loadMusic:function(){
    var _this = this
    $.getJSON('https://api.jirengu.com/fm/v2/getChannels.php',{channel:this.channelId})
    .done(function(ret){
      _this.song = ret['song'][0]
      _this.setMusic()
      _this.loadLyric()
    })
  },
  
  //设置音乐，换新音乐
  setMusic:function(){
    this.audio.src = this.song.url
    $('.bg').css('background-image','url('+this.song.picture+')')
    this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
    this.$container.find('.info .name').text(this.song.title)
    this.$container.find('.info .singer').text(this.song.artist)
    this.$container.find('.info .tit').text(this.channelName)
    this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
  },
  
  // 获取歌词
  loadLyric:function(){
    var _this = this
    $.getJSON('https://api.jirengu.com/fm/v2/getChannels.php',{sid:this.song.sid})
    .done(function(ret){
      var lyric = ret.lyric
      var lyricObj = {}
      var arr = lyric.split('\n')
      arr.forEach(function(line){
        var times = line.match(/\d{2}:\d{2}/g)
        var str = line.replace(/\[.+?\]/g,'') 
        if(Array.isArray(times)){
          times.forEach(function(time){
            lyricObj[time]=str
          })
        }
      })
      _this.lyricObj = lyricObj
    })
  },
  
  // 更新音乐播放时间|进度条
  updateStatus:function(){
    var min = Math.floor(this.audio.currentTime/60)
    var sec = Math.floor(this.audio.currentTime%60)+''
    sec = sec.length === 2 ? sec: '0' + sec
    var processWidth = this.audio.currentTime/this.audio.duration*100+'%'
    this.$container.find('.cur-time').text(min+':'+sec)
    this.$container.find('.bar-process').css('width',processWidth)
    var line = this.lyricObj['0'+min+':'+sec]
    if(line){
      this.$container.find('.lyric').text(line).boomText('')
    }
  }
}

// 文字css3效果
$.fn.boomText = function(type){
  type = type || 'lightSpeedIn'
  
  var a= function(){
    var arrText = $(this).text().split('')
    var b = arrText.map(function(word){
        return '<span class="boomText">'+ word + '</span>'
    })
    return b.join('')
  }
  this.html(a)
  
  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated ' + type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  }, 300)
}
Footer.init()
Fm.init()

