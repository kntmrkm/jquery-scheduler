
$(function() {
  $.fn.timeSchedule = function(options){
    var defaults = {
      jsonURL: null,
      rows : {},
      startTime: "07:00",
      endTime: "19:30",
      timeUnit: 600,  // 区切り時間(秒)
      timeUnitWidth: 20,
      timeLineHeight: 50,
      timeBorder: 1,
      headTimeBorder: 1,
      headerTitle: 'title',
      dataWidth: null,
      // event
      init_data: null,
      change: null,
      click: null,
      append: null,
      time_click: null,
      title_click: null,
      debug: ""   // debug selecter
    };

    this.calcStringTime = function(string) {
      var slice = string.split(':');
      var h = Number(slice[0]) * 60 * 60;
      var i = Number(slice[1]) * 60;
      var min = h + i;
      return min;
    };

    this.formatTime = function(min) {
      var h = "" + (min/36000|0) + (min/3600%10|0);
      var i = "" + (min%3600/600|0) + (min%3600/60%10|0);
      var string = h + ":" + i;
      return string;
    };

    var setting = $.extend(defaults,options);
    this.setting = setting;
    var scheduleData = new Array();
    var timelineData = new Array();
    var $element = $(this);
    var element = (this);
    var tableStartTime = element.calcStringTime(setting.startTime);
    var tableEndTime = element.calcStringTime(setting.endTime);
    var currentNode = null;
    tableStartTime -= (tableStartTime % setting.timeUnit);
    tableEndTime -= (tableEndTime % setting.timeUnit);

    this.getScheduleData = function(){
      return scheduleData;
    };
    this.getTimelineData = function(){
      return timelineData;
    };

    // 現在のタイムライン番号を取得
    this.getTimeLineNumber = function(top){
      var num = 0;
      var n = 0;
      var tn = Math.ceil(top / (setting.timeLineHeight));
      for(var i in setting.rows){
        var r = setting.rows[i];
        var tr = 0;
        if(typeof r["schedule"] == Object){
          tr = r["schedule"].length;
        }
        if(currentNode && currentNode["timeline"]){
          tr ++;
        }
        n += Math.max(tr,1);
        if(n >= tn){
          break;
        }
        num ++;
      }
      return num;
    };

    // スケジュール数の取得
    this.getScheduleCount = function(n){
      var num = 0;
      for(var i in scheduleData){
        if(scheduleData[i]["timeline"] == n){
          num ++;
        }
      }
      return num;
    };

    // スケジュール追加
    this.addScheduleData = function(data){
      var st = Math.ceil((data["start"] - tableStartTime) / setting.timeUnit);
      var et = Math.floor((data["end"] - tableStartTime) / setting.timeUnit);
      var $bar = $('<div class="sc_Bar"><span class="head"><span class="time"></span></span><span class="text"></span></div>');
      var stext = element.formatTime(data["start"]);
      var etext = element.formatTime(data["end"]);
      var snum = element.getScheduleCount(data["timeline"]);

      $bar.css({
        left : (st * setting.timeUnitWidth), top : (snum * setting.timeLineHeight),
        width : ((et - st) * setting.timeUnitWidth), height : (setting.timeLineHeight)
      });

      // データの表示
      $bar.find(".time").text(stext+" ~ "+etext);
      if(data["text"]){
        $bar.find(".text").text(data["text"]);
      }
      if(data["class"]){
        $bar.addClass(data["class"]);
      }
      //$element.find('.sc_main').append($bar);
      $element.find('.sc_main .timeline').eq(data["timeline"]).append($bar);

      // データの追加
      scheduleData.push(data);
      var key = scheduleData.length - 1;
      $bar.data("sc_key", key);

      $bar.bind("mouseup", function(){
        // コールバックがセットされていたら呼出
        if(setting.click){
          if($(this).data("dragCheck") !== true && $(this).data("resizeCheck") !== true){
            var node = $(this);
            var sc_key = node.data("sc_key");
            setting.click(node, scheduleData[sc_key]);
          }
        }
      });

      var $node = $bar;

      if (data["editable"] == true) {
        $node.draggable({
          grid: [setting.timeUnitWidth, 1],
          containment: ".sc_main",
          helper: 'original',
          start: function (event, ui) {
            var node = {};
            node["node"] = this;
            node["offsetTop"] = ui.position.top;
            node["offsetLeft"] = ui.position.left;
            node["currentTop"] = ui.position.top;
            node["currentLeft"] = ui.position.left;
            node["timeline"] = element.getTimeLineNumber(ui.position.top);
            node["nowTimeline"] = node["timeline"];
            currentNode = node;
          },
          drag: function (event, ui) {
            $(this).data("dragCheck", true);
            if (!currentNode) {
              return false;
            }
            var $moveNode = $(this);
            var sc_key = $moveNode.data("sc_key");

            // テキスト変更
            element.rewriteBarText($moveNode, scheduleData[sc_key]);
            return true;
          },
          // 要素の移動が終った後の処理
          stop: function (event, ui) {
            $(this).data("dragCheck", false);
            var node = $(this);
            var sc_key = node.data("sc_key");

            //var x = node.position().left;
            //var w = node.width();
            //var start = tableStartTime + (Math.floor(x / setting.timeUnitWidth) * setting.timeUnit);
            //var end = tableStartTime + (Math.floor((x + w) / setting.timeUnitWidth) * setting.timeUnit);
            //scheduleData[sc_key]["start"] = start;
            //scheduleData[sc_key]["end"] = end;
            // コールバックがセットされていたら呼出
            if (setting.change) {
              //setting.change(node, scheduleData[sc_key]);
            }
            currentNode = null;
          }
        });

        $node.resizable({
          handles: 'e',
          grid: [setting.timeUnitWidth, setting.timeLineHeight],
          minWidth: setting.timeUnitWidth,
          start: function (event, ui) {
            var node = $(this);
            node.data("resizeCheck", true);
          },
          // 要素の移動が終った後の処理
          stop: function (event, ui) {
            var node = $(this);
            var sc_key = node.data("sc_key");
            var x = node.position().left;
            var w = node.width();
            var start = tableStartTime + (Math.floor(x / setting.timeUnitWidth) * setting.timeUnit);
            var end = tableStartTime + (Math.floor((x + w) / setting.timeUnitWidth) * setting.timeUnit);
            var timelineNum = scheduleData[sc_key]["timeline"];

            scheduleData[sc_key]["start"] = start;
            scheduleData[sc_key]["end"] = end;

            // 高さ調整
            element.resetBarPosition(timelineNum);
            // テキスト変更
            element.rewriteBarText(node, scheduleData[sc_key]);

            node.data("resizeCheck", false);
            // コールバックがセットされていたら呼出
            if (setting.change) {
              setting.change(node, scheduleData[sc_key]);
            }
          }
        });
      } // editable?
      return key;
    };

    // add
    this.addRow = function(timeline, row){
      var title = row["title"];
      var id = $element.find('.sc_main .timeline').length;
      var html;
      html = '';
      html += '<div class="timeline">';
      html += '<span class="sc_title">' + title + '</span>';
      html += '<span class="sc_subtitle">' + row["subtitle"] + '</div>';
      html += '</div>';
      var $data = $(html);

      if (row["id"] && (row["id"] != "")) {
        $data.attr('id', row["id"]);
      }

      $data.data("timeline", timeline);
      $element.find('.sc_data_scroll').append($data);
      // クリックイベント
      if(setting.title_click && row['clickable'] == true){
        var eventTarget = $element.find('.sc_data_scroll').find('.timeline');
        eventTarget.addClass('clickable');
        eventTarget.click(function(){
          setting.title_click(
            timelineData[$(this).data("timeline")]
          );
        });
      }

      html = '';
      html += '<div class="timeline"></div>';
      var $timeline = $(html);

      for(var t = tableStartTime; t < tableEndTime; t += setting.timeUnit){
        var $tl = $('<div class="tl"></div>');
        var timeString = element.formatTime(t);
        var timeIsClickable = true;

        if (row['time']) {
          for (var i in row['time']) {
            if (row['time'][i].time == timeString) {
              $tl.html('<small class="tl_text">' + row['time'][i].text + '</small>');
              if (!row['time'][i].clickable) {
                timeIsClickable = false;
              }
            }
          }
        }
        if (timeIsClickable) {
          $tl.addClass('clickable');
        }
        $tl.height(setting.timeLineHeight);
        $tl.css('padding-top', (setting.timeLineHeight / 4));
        $tl.width(setting.timeUnitWidth);
        $tl.css('padding-left', (setting.timeUnitWidth / 4));
        $tl.data("time", timeString);
        $tl.data("timeline", timeline);
        $timeline.append($tl);

        // クリックイベント
        if(setting.time_click && timeIsClickable){
          $tl.click(function(){
            setting.time_click(
              $(this).data("time"),
              timelineData[$(this).data("timeline")]
            );
          });
        }
      }



      $timeline.data("resource_id", row.resource_id);
      $element.find('.sc_main').append($timeline);

      timelineData[timeline] = row;

      if(row["class"] && (row["class"] != "")){
        $element.find('.sc_data .timeline').eq(id).addClass(row["class"]);
        $element.find('.sc_main .timeline').eq(id).addClass(row["class"]);
      }

      // スケジュールタイムライン
      if (row["schedule"]) {
        for(var i in row["schedule"]){
          var bdata = row["schedule"][i];
          var s = element.calcStringTime(bdata["start"]);
          var e = element.calcStringTime(bdata["end"]);

          var data = {};
          data["timeline"] = id;
          data["start"] = s;
          data["end"] = e;
          data["editable"] = bdata["editable"];
          if(bdata["text"]){
            data["text"] = bdata["text"];
          }
          if(bdata["class"]){
            data["class"] = bdata["class"];
          }

          data["data"] = {};
          if(bdata["data"]){
            data["data"] = bdata["data"];
          }
          element.addScheduleData(data);
        }
      }

      // 高さの調整
      element.resetBarPosition(id);
      $element.find('.sc_main .timeline').eq(id).droppable({
        accept: ".sc_Bar",
        drop: function(event, ui) {
          var node = ui.draggable;
          var sc_key = node.data("sc_key");
          var x = node.position().left;
          var w = node.width();
          var start = tableStartTime + (Math.floor(x / setting.timeUnitWidth) * setting.timeUnit);
          var end = tableStartTime + (Math.floor((x + w) / setting.timeUnitWidth) * setting.timeUnit);
          //var end = start + (scheduleData[sc_key]["end"] - scheduleData[sc_key]["start"]);

          var nowTimelineNum = scheduleData[sc_key]["timeline"];
          var timelineNum = $element.find('.sc_main .timeline').index(this);
          var resourceID = $(this).data("resource_id");

          scheduleData[sc_key]["start"] = start;
          scheduleData[sc_key]["end"] = end;
          scheduleData[sc_key]["timeline"] = timelineNum;
          node.appendTo(this);

          if (setting.change) {
            setting.change(node, scheduleData[sc_key], resourceID);
          }

          // 高さ調整
          element.resetBarPosition(nowTimelineNum);
          element.resetBarPosition(timelineNum);
        }
      });

      // コールバックがセットされていたら呼出
      if(setting.append){
        $element.find('.sc_main .timeline').eq(id).find(".sc_Bar").each(function(){
          var node = $(this);
          var sc_key = node.data("sc_key");
          setting.append(node, scheduleData[sc_key]);
        });
      }
    };

    this.getScheduleData = function(){
      var data = new Array();

      for(var i in timelineData){
        if(typeof timelineData[i] == "undefined") continue;
        var timeline = $.extend(true, {}, timelineData[i]);
        timeline.schedule = new Array();
        data.push(timeline);
      }

      for(var i in scheduleData){
        if(typeof scheduleData[i] == "undefined") continue;
        var schedule = $.extend(true, {}, scheduleData[i]);
        schedule.start = this.formatTime(schedule.start);
        schedule.end = this.formatTime(schedule.end);
        var timelineIndex = schedule.timeline;
        delete schedule.timeline;
        data[timelineIndex].schedule.push(schedule);
      }

      return data;
    };

    // テキストの変更
    this.rewriteBarText = function(node, data){
      var x = node.position().left;
      var w = node.width();
      var start = tableStartTime + (Math.floor(x / setting.timeUnitWidth) * setting.timeUnit);
      var end = tableStartTime + (Math.floor((x + w) / setting.timeUnitWidth) * setting.timeUnit);
      var html = element.formatTime(start)+" ~ "+element.formatTime(end);
      $(node).find(".time").html(html);
    };

    this.resetBarPosition = function(n){
      // 要素の並び替え
      var $bar_list = $element.find('.sc_main .timeline').eq(n).find(".sc_Bar");
      var codes = [];

      for(var i = 0; i < $bar_list.length; i++){
        codes[i] = { code: i, x: $($bar_list[i]).position().left };
      };

      // ソート
      codes.sort(function(a, b){
        if(a["x"] < b["x"]) {
          return -1;
        } else if(a["x"] > b["x"]) {
          return 1;
        }
        return 0;
      });

      var check = [];
      var h = 0;
      var $e1, $e2;
      var c1, c2;
      var s1, e1, s2, e2;

      for(var i = 0; i < codes.length; i++){
        c1 = codes[i]["code"];
        $e1 = $($bar_list[c1]);
        for(h = 0; h < check.length; h++){
          var next = false;
          L: for(var j = 0; j < check[h].length; j++){
            c2 = check[h][j];
            $e2 = $($bar_list[c2]);

            s1 = $e1.position().left;
            e1 = $e1.position().left + $e1.width();
            s2 = $e2.position().left;
            e2 = $e2.position().left + $e2.width();
            if(s1 < e2 && e1 > s2){
              next = true;
              continue L;
            }
          }
          if(!next){ break; }
        }

        if(!check[h]){
          check[h] = [];
        }
        $e1.css({top:((h * setting.timeLineHeight))});
        check[h][check[h].length] = c1;
      }
      // 高さの調整
      this.resizeRow(n,check.length);
    };

    this.resizeRow = function(n,height){
      //var h = Math.max(element.getScheduleCount(n),1);
      var h = Math.max(height,1);
      $element.find('.sc_data .timeline').eq(n).height(h * setting.timeLineHeight);
      $element.find('.sc_main .timeline').eq(n).height(h * setting.timeLineHeight);
      $element.find('.sc_main .timeline').eq(n).find(".sc_bgBar").each(function(){
        $(this).height($(this).closest(".timeline").height());
      });

      $element.find(".sc_data").height($element.find(".sc_main_box").height());
    };

    // resizeWindow
    this.resizeWindow = function(){
      var dataWidth = setting.dataWidth;
      var sc_width = $element.width();
      var sc_main_width = sc_width - dataWidth - 1;
      var cell_num = Math.floor((tableEndTime - tableStartTime) / setting.timeUnit);

      $element.find(".sc_header_cell").width(dataWidth);
      $element.find(".sc_data_scroll").width(dataWidth);
      $element.find(".sc_data").width(dataWidth);
      $element.find(".sc_header").width(sc_main_width);
      $element.find(".sc_main_box").width(sc_main_width);
      $element.find(".sc_header_scroll").width(setting.timeUnitWidth*cell_num);
      $element.find(".sc_main_scroll").width(setting.timeUnitWidth*cell_num);
    };

    // init
    this.init = function(){
      var html = '';
      html += '<div class="sc_menu">'+"\n";
      html += '<div class="sc_header_cell"><span id="sc_date_span">'+"\n";
      if (setting.headerTitle != '') {
        html += setting.headerTitle;
      } else {
        html += '&nbsp;';
      }
      html += '</span></div>'+"\n";
      html += '<div class="sc_header">'+"\n";
      html += '<div class="sc_header_scroll">'+"\n";
      html += '</div>'+"\n";
      html += '</div>'+"\n";
      html += '<br class="clear" />'+"\n";
      html += '</div>'+"\n";
      html += '<div class="sc_wrapper">'+"\n";
      html += '<div class="sc_data">'+"\n";
      html += '<div class="sc_data_scroll">'+"\n";
      html += '</div>'+"\n";
      html += '</div>'+"\n";
      html += '<div class="sc_main_box">'+"\n";
      html += '<div class="sc_main_scroll">'+"\n";
      html += '<div class="sc_main">'+"\n";
      html += '</div>'+"\n";
      html += '</div>'+"\n";
      html += '</div>'+"\n";
      html += '<br class="clear" />'+"\n";
      html += '</div>'+"\n";

      $element.append(html);
      $element.find(".sc_main_box").scroll(function(){
        $element.find(".sc_data_scroll").css("top", $(this).scrollTop() * -1);
        $element.find(".sc_header_scroll").css("left", $(this).scrollLeft() * -1);
      });
      // add time cell
      for(var t = tableStartTime; t < tableEndTime; t += setting.timeUnit){
        if(0 == (t % 3600)){
          var html = '';
          html += '<div class="sc_time">'+element.formatTime(t)+'</div>';
          var $time = $(html);
          $time.width((3600 / setting.timeUnit) * setting.timeUnitWidth);
          $element.find(".sc_header_scroll").append($time);
        }
      }

      $(window).resize(function(){
        element.resizeWindow();
      }).trigger("resize");

      // addrow
      for(var i in setting.rows){
        this.addRow(i, setting.rows[i]);
      }
    };

    // 初期化
    this.init();

    // event call
    if(setting.init_data){
      setting.init_data();
    }

    this.debug = function(){
      var html = '';
      for(var i in scheduleData){
        html += '<div>';

        html += i+" : ";
        var d = scheduleData[i];
        for(var n in d){
          var dd = d[n];
          html += n+" "+dd;
        }

        html += '</div>';
      }
      $(setting.debug).html(html);
    };
    if(setting.debug && setting.debug != ""){
      setInterval(function(){ element.debug(); }, 10);
    }
    return( this );
  };

  // not using
  revertStringTime = function(integer) {
    var h = Math.floor(integer / (3600));
    var i = Math.floor((integer - (h * 3600)) / 60);
    var string = h + ':' + i;
    return string;
  };
});
