d3.csv("data/states-profit.csv", function(err, data) {//读取绘制到地图上的数据（利润）
d3.csv("data/states-sales.csv", function(err, data_sale) {//读取点击每个州出现的数据（销售额、利润、地区名）
var config = {"defaultValue":"Total","state":"State"};//设置初始界面值
  
var COLOR_COUNTS = 50;

var SCALE = 0.7;
var centered;
var valueType = "";

var commaFormat = d3.format("0,000");
//设置坐标轴显示format
function KMBFormat(d) {
  if (d > 1000000000) {
    return valueType + Math.round(d / 1000000000 * 10) / 10 + "B";
  } else if (d > 1000000) {
    return valueType + Math.round(d / 1000000 * 10) / 10 + "M";
  } else if (d > 1000) {
    return valueType + Math.round(d / 1000 * 10) / 10 + "K";
  } else {
    return valueType + d;
  }
}

function displayFormat(value) {
  if (valueType === "$") {
    return "$" + commaFormat(value);
  } else {
    return commaFormat(value);
  }
}
//转换数据
function Interpolate(start, end, steps, count) {
    var s = start,
        e = end,
        final = s + (((e - s) / steps) * count);
    return Math.floor(final);
}
//根据数据设置颜色
function Color(_r, _g, _b) {
    var r, g, b;
    var setColors = function(_r, _g, _b) {
        r = _r;
        g = _g;
        b = _b;
    };

    setColors(_r, _g, _b);
    this.getColors = function() {
        var colors = {
            r: r,
            g: g,
            b: b
        };
        return colors;
    };
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
/////////设置正利润（地图上的颜色）///////
var COLOR_FIRST = "#C2F8F3", COLOR_LAST = "#002457";

var rgb = hexToRgb(COLOR_FIRST);

var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

rgb = hexToRgb(COLOR_LAST);
var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

var MAP_CATEGORY = config.state;
var MAP_VALUE; //在之后会定义！！

var width = 800,
    height = 400;

var valueById = d3.map();
var valueById_sales = d3.map();

var left_width = 150;

var startColors = COLOR_START.getColors(),
    endColors = COLOR_END.getColors();

var colors = [];

for (var i = 0; i < COLOR_COUNTS; i++) {
  var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
  var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
  var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
  colors.push(new Color(r, g, b));
}
///////////设置负利润的颜色（地图上）////////////
var COLOR_FIRSTn = "#E9967A", COLOR_LASTn = "#DC143C";

var rgbn = hexToRgb(COLOR_FIRSTn);

var COLOR_STARTn = new Color(rgbn.r, rgbn.g, rgbn.b);

rgbn = hexToRgb(COLOR_LASTn);
var COLOR_ENDn = new Color(rgbn.r, rgbn.g, rgbn.b);

var startColorsn = COLOR_STARTn.getColors(),
    endColorsn = COLOR_ENDn.getColors();

var colorsn = [];

for (var i = 0; i < COLOR_COUNTS; i++) {
  var rn = Interpolate(startColorsn.r, endColorsn.r, COLOR_COUNTS, i);
  var gn = Interpolate(startColorsn.g, endColorsn.g, COLOR_COUNTS, i);
  var bn = Interpolate(startColorsn.b, endColorsn.b, COLOR_COUNTS, i);
  colorsn.push(new Color(rn, gn, bn));
}

///////////用 quantize定义颜色范围////////////
//设置颜色比例尺的定义域
var quantize = d3.scale.quantize()
    .domain([0, 1.0])
    .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

var path = d3.geo.path();//定义地理位置

d3.tsv("data/us-state-name.tsv",function(error, names) {

name_id_map = {};//每个州的id
id_name_map = {};//每个州的name
id_name_map1 = {};
for (var i = 0; i < names.length; i++) {
  name_id_map[names[i].name] = names[i].id;
  id_name_map[names[i].id] = names[i].name;
  id_name_map1[names[i].id] = names[i];
}
//以下的数组为点击一个州显示的数据
var salesTotalD = {
    0: ""
};
var salesFurnitureD = {
    0: ""
};
var salesTechnologyD = {
    0: ""
};
var salesOfficeD = {
    0: ""
};
var salesTotalP = {
    0: ""
};
var salesFurnitureP = {
    0: ""
};
var salesTechnologyP = {
    0: ""
};
var salesOfficeP = {
    0: ""
};
var salesRegion = {
    0: ""
};
var state_ids = [ 0 ];
var id_state_map = {
    0: ""
};
var id_topo_map = {
    0: null
};
/////////初始化数据////////////
function initDataByValue() {
	//初始化地图和柱状图（profits数据）:
  data.forEach(function(d) {
    var id = name_id_map[d[MAP_CATEGORY]];//将id值按照地图对应州名赋值给了id号!!
    
    if (d[MAP_VALUE].indexOf("$") !== -1) {
      valueType = "$";
    }
    
    valueById.set(id, +d[MAP_VALUE].replace("$", "").replace(/,/g, "")); //正则表达式，g代表global，表示将，全部替换为空
  });
  
  quantize.domain([d3.min(data, function(d){ return +d[MAP_VALUE].replace("$", "").replace(/,/g, "") }),
    d3.max(data, function(d){ return +d[MAP_VALUE].replace("$", "").replace(/,/g, "") })]);
	
	
	//初始化点击各个州的数据（sales、profits、region）:
	data_sale.forEach(function(d) {
    var id = name_id_map[d[MAP_CATEGORY]];
   salesTotalD[id]=d["Total Sales"];
   salesFurnitureD[id]= d["Furniture Sales"];
    salesTechnologyD[id] = d["Technology Sales"];
   salesOfficeD[id]= d["Office Supplies Sales"];

    salesTotalP[id]=d["Total Profits"];
   salesFurnitureP[id]= d["Furniture Profits"];
    salesTechnologyP[id] = d["Technology Profits"];
   salesOfficeP[id]= d["Office Supplies Profits"];

   salesRegion[id]= d["Region"];
  });
}
var categories_count;
////////初始化地图///////////
function makeMap(us) {
//创建SVG元素
//select方法返回的是div中id=canvas-svg元素
//append方法在body内部追加一个svg元素
//attr()分别给SVG的width和height属性赋值。
  var svg = d3.select("#canvas-svg").append("svg")
    .attr("width", width)
    .attr("height", height);
    
  svg.append("g")
    .attr("id", "states")
    .attr("class", "categories-choropleth")//连接到类categories-choropleth
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)//读入TopoJSON数据
    .enter()
    .append("path")
    .attr("transform", "scale(" + SCALE + ")")
    .style("fill", function(d) {
        if (valueById.get(d.id)) 
        {
           //根据不同利润值设置颜色，正的为蓝色，负的为红色
          var i = quantize(valueById.get(d.id));
          if(valueById.get(d.id)>0){

            var color = colors[i].getColors();
          return "rgb(" + color.r + "," + color.g +
              "," + color.b + ")";}
          else{  
          	var color = colorsn[i].getColors();
          return "rgb(" + color.r + "," + color.g +
              "," + color.b + ")";}
       
          }
       
        else
        {
          return "";
        }
      })
      .attr("d", path)
	    .attr("id", function(d) {
            state_ids.push(+d.id); //获取州的id
            id_state_map[d.id] = id_name_map1[d.id].name; //获取州名
            id_topo_map[d.id] =d;//州的id(从地图获取)

         
            return "map-" + d.id;
        }).on("click", map_clicked) //地图点击事件，联系到函数
      .on("mousemove", function(d) {//鼠标悬停
          var html = "";
          //在html中增加代码，显示出一个文本框，用于显示州名和利润
          html += "<div class=\"tooltip_kv\">";
          html += "<span class=\"tooltip_key\">";
          html += id_name_map[d.id];
          html += "</span>";
          html += "<span class=\"tooltip_value\">";
          html += (valueById.get(d.id) ? displayFormat(valueById.get(d.id)) : "");
          html += "";
          html += "</span>";
          html += "</div>";
          
          $("#tooltip-container").html(html);//css文件中该类定义了显示文本框
          $(this).attr("fill-opacity", "0.8");
          $("#tooltip-container").show();
          
          var coordinates = d3.mouse(this);
          
          var map_width = $('.categories-choropleth')[0].getBoundingClientRect().width;
          //设置移动到该州的左边、右边的不同显示效果
          if (d3.event.layerX < map_width / 2) 
          {
            d3.select("#tooltip-container")
              .style("top", (d3.event.layerY + 15) + "px")
              .style("left", (d3.event.layerX + 15) + "px");
          }
          else
          {
            var tooltip_width = $("#tooltip-container").width();
            d3.select("#tooltip-container")
              .style("top", (d3.event.layerY + 15) + "px")
              .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
          }
      })
      .on("mouseout", function() {//鼠标移开
        $(this).attr("fill-opacity", "1.0");
        $("#tooltip-container").hide();//隐藏文本框
      });
      //读取地图数据
      svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "categories")
      .attr("transform", "scale(" + SCALE + ")")
      .attr("d", path);
	    state_ids = state_ids.sort(function(a, b) {
            return a - b;
        });
        //建立一个选择框，可按照州名选择
      d3.select("#canvas-svg").append("select")
        .attr("id", "state-select")
        .on("change", function() {
           var topo = id_topo_map[$(this).val()];
          map_clicked(topo);
      }).selectAll("option")
        .data(state_ids)
        .enter().append("option")
        .attr("value", function(d) {
            return d;
        }).text(function(d) {
            return id_state_map[d];
        });
        //选择州名后输出的效果：

        d3.select("#canvas-svg").append("div")
          .attr("id", "data-sales");
        $("#data-sales").html("<h4>Region:</h4>"
          + "<h2 id='data-region-value'><span class='no-data'>No Data</span></h2>" 
          +"<h4>Profit:</h4>"
         + "<h2 id='data-profit-value'><span class='no-data'>No Data</span></h2>" 
          +"<h4>Sale:</h4>"
         + "<h2 id='data-sale-value'><span class='no-data'>No Data</span></h2>" );
    //初始化选择华盛顿州
	$("#state-select").val(53);
        var topo = id_topo_map[53];

          console.log( "topo:"+topo);
        map_clicked(topo);
}
////////初始化柱状图/////////
function makeBars() {
  var bar_names = [],
      ids = [],
      name_values = [],
      values = [],
      chart,
      width = 400,
      bar_height = 20;
  
  var total_categories = 0;//排序的所有州
  categories_count = 0;//种类数
  //用jquery方法遍历所有州的数据
  Object.keys(name_id_map).forEach(function(n) {
    if (valueById.get(+name_id_map[n])) {
      ids.push(+name_id_map[n]);
      values.push(valueById.get(+name_id_map[n]));
      name_values.push({name: n, value: valueById.get(+name_id_map[n])});
      total_categories += valueById.get(+name_id_map[n]);
      categories_count++;
    }
  });
  
  values.push(Math.round(total_categories / categories_count));
  
  values = values.sort(function(a, b) {
    return -(a - b);
  });
  
  name_values = name_values.sort(function(a, b) {
    return -(a.value - b.value);
  });
  
  name_values.forEach(function(d) {
    bar_names.push(d.name);
  });
  //设置高度
  var height = (bar_height + 2 * gap) * bar_names.length;
  //定义坐标轴
  var x = d3.scale.linear()
     .domain([0, d3.max(values)])
     .range([0, width]);
  
  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .tickFormat(KMBFormat);
 //定义每个柱形间的空隙
  var gap = 2;
  
  //调整空隙后再定义y轴高度，实现数据均显示的效果
  var y = d3.scale.ordinal()
    .domain(bar_names)
    .rangeBands([0, (bar_height + 2 * gap) * bar_names.length]);
//开始画柱状图
  chart = d3.select("#canvas-svg")
    .append('svg')
    .attr('class', 'chart')
    .attr('width', left_width + width + 100)
    .attr('height', (bar_height + gap * 2) * bar_names.length + 30)
    .append("g")
    .attr("transform", "translate(10, 20)");
//画坐标轴
  chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + left_width + ", 0)")
    .call(xAxis);

  chart.selectAll(".tick").append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", (bar_height + gap * 2) * bar_names.length);
//画矩形
  chart.selectAll("rect")
    .data(name_values)
    .enter().append("rect")
    .attr("x", left_width)
    .attr("y", function(d) { return y(d.name) + gap; })
    .attr("name", function(d, i) {
      return d.name;
    })
    .attr("width", function(d, i) {
      if(d.value>0)return x(d.value);
    })
    .attr("height", bar_height)
    .style("fill", function(d) {
      var i = quantize(d.value);
      var color = colors[i].getColors();
      return "rgb(" + color.r + "," + color.g +
          "," + color.b + ")";
    })
    .attr("class", function(d) {
      return "category-bar";
    });
//画每个矩形的数据（利润值）
  chart.selectAll("text.score")
    .data(name_values)
    .enter().append("text")
   
    .attr("x", function(d) { if(d.value>0) return x(d.value) +  left_width;})
    .attr("y", function(d, i){  return y(d.name) + y.rangeBand()/2; } )
    .attr("dx", 5)
    .attr("dy", ".36em") 
    .attr("font-size",13) 
    .attr("text-anchor", "start")//设置显示在矩形后面
    .attr('class', 'score')
    .text(function(d) {  //return d.value;
      if(d.value>0) return displayFormat(d.value);
    });
//输出排序的序号和州名
  var index = 1;//排序的序号
  chart.selectAll("text.name")
    .data(name_values)
    .enter().append("text")
    .attr("x", left_width / 2)
    .attr("y", function(d, i){
      return y(d.name) + y.rangeBand()/2; } )
    .attr("dy", ".36em") 
    .attr("font-size",15) 
    .attr("text-anchor", "middle")
    .attr('class', function(d) {
      return "name";
    })
    .text(function(d) { 
      if(d.value>0)
      return (index++) + ". " + d.name;
    });
}

// 定义所有种类（ALL_TYPES数组有4个元素（0-3号分别代表不同种类））
var first_dp = data[0];
var ALL_TYPES = [];
for (i = 0; i < Object.keys(first_dp).length; i++) {
  if (Object.keys(first_dp)[i] !== MAP_CATEGORY) {
    ALL_TYPES.push(Object.keys(first_dp)[i]);
  }
}
//定义按钮（4个）
for (i = 0; i < ALL_TYPES.length; i++) {
  $("#categories-btns").append($("<button></button>")
    .attr("class", "btn-multi-type")
    .attr("multi-type", ALL_TYPES[i])
 
    .html(ALL_TYPES[i])
  );
}
//console.log( "MAP_VALUE"+MAP_VALUE);
$(".btn-multi-type").on("click", function(e) {
  $(".btn-multi-type.active").removeClass("active");
  $(this).addClass("active");
  MAP_VALUE = $(this).attr("multi-type");

  initDataByValue();//初始化
  transitionBars();//点击按钮改变柱状图
  transitionMap();//点击按钮改变地图


//可由MAP_VALUE名判断此时点击哪个按钮
 //并输出不同pie图
if(MAP_VALUE=="Total")
  makePie_Total();
else  if(MAP_VALUE=="Furniture")
  makePie_Furniture();
else  if(MAP_VALUE=="Office Supplies")
  makePie_Office();
else  if(MAP_VALUE=="Technology")
  makePie_Technology();
});

// 定义第一个MAP_VALUE
MAP_VALUE = ALL_TYPES[0];
$("#btn-multi-type-" + MAP_VALUE).click();

/////////初始化所有图表///////////
function makeMapAndBars() {

  d3.json("data/us.json", function(error, us) {
    makeMap(us);
    makeBars();
    makePie_Total();
    //makeBars(data);
  });

}
/////////改变地图//////////
function transitionMap() {
  var map_group = d3.select(".categories-choropleth");
    
  map_group
    .selectAll("path")
      .attr("transform", "scale(" + SCALE + ")")
      .style("fill", function(d) {
      	if (valueById.get(d.id)) 
        {
          //根据不同利润值设置颜色，正的为蓝色，负的为红色
          var i = quantize(valueById.get(d.id));
          if(valueById.get(d.id)>0){

            var color = colors[i].getColors();
          return "rgb(" + color.r + "," + color.g +
              "," + color.b + ")";}
          else{  
          	var color = colorsn[i].getColors();
          return "rgb(" + color.r + "," + color.g +
              "," + color.b + ")";}
          }
        else
        {
          return "";
        }
       
      })
      .attr("d", path);
      $("#state-select").val(53);
        var topo = id_topo_map[53];
         console.log( "topo:"+topo);
        map_clicked(topo);
}
////////改变柱状图（与上面的的makeBars几乎相同）//////////
function transitionBars() { 
  var width = 400,
      bar_height = 20;
 var chart = d3.select(".chart");
  //chart.selectAll("rect").transition().remove(); 
  var total_categories = 0, categories_count = 0;
  var values = [], name_values = [], bar_names = [];
  Object.keys(name_id_map).forEach(function(n) {
    if (valueById.get(+name_id_map[n])) {
      values.push(valueById.get(+name_id_map[n]));
      name_values.push({name: n, value: valueById.get(+name_id_map[n])});
      total_categories += valueById.get(+name_id_map[n]);
      categories_count++;
    }
  }); 
  values.push(Math.round(total_categories / categories_count));
  
  values = values.sort(function(a, b) {
    return -(a - b);
  });
  
  name_values = name_values.sort(function(a, b) {
    return -(a.value - b.value);
  });
  
  name_values.forEach(function(d) {
    bar_names.push(d.name);
  });
  
  var height = (bar_height + 2 * gap) * bar_names.length;
  
  var x = d3.scale.linear()
     .domain([0, d3.max(values)])
     .range([0, width]);
  
  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top")
    .tickFormat(KMBFormat);

  var gap = 2;
  // redefine y for adjusting the gap
  var y = d3.scale.ordinal()
    .domain(bar_names)
    .rangeBands([0, (bar_height + 2 * gap) * bar_names.length]);
  
  var bars = chart.selectAll("rect")
    .data(name_values);
  
  chart.select(".x.axis")
    .call(xAxis);
  
  chart.selectAll(".tick").append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", (bar_height + gap * 2) * bar_names.length);
  
  bars.transition()
  .duration(500)
  .attr("x", left_width)
      .attr("y", function(d) { return y(d.name) + gap; })
      .attr("name", function(d, i) {
        return d.name;
      })
      .attr("width", function(d, i) {
        if(d.value>0){  return x(d.value);}
      })
      .attr("height", bar_height)
      .style("fill", function(d) {
        
         if(d.value>0){
        var i = quantize(d.value);
        var color = colors[i].getColors();
        return "rgb(" + color.r + "," + color.g +
            "," + color.b + ")";}
      })
      .attr("class", function(d) {
        return "category-bar";
      });
  
  chart.selectAll("text.score")
    .data(name_values)
    .transition()
    .duration(500)
    .attr("x", function(d) { 
      if(d.value>0) return x(d.value) +  left_width; 
    })
    .attr("y", function(d, i){ return y(d.name) + y.rangeBand()/2; } )
    .attr("dx", 5)
    .attr("dy", ".36em")
    .attr("text-anchor", "start")
    .attr('class', 'score')
    .text(function(d) {
     
      if(d.value>0)
      return displayFormat(d.value);
    });
  
  var index = 1;
  chart.selectAll("text.name")
    .data(name_values)
    .transition()
    .duration(500)
    .attr("x", left_width / 2)
    .attr("y", function(d, i){
      return y(d.name) + y.rangeBand()/2; } )
    .attr("dy", ".36em")
    .attr("text-anchor", "middle")
    .attr('class', function(d) {
     
      return "name";
    } )
    .text(function(d) {
      if(d.value>0)
      return (index++) + ". " + d.name;
    });
}
////构建饼图（整体的）////
function makePie_Total()
{
  
  d3.csv("data/TotalPie.csv", function(err, data) {

var config = {"data1":"Furniture Sales","data2":"Office Supplies Sales","data3":"Technology Sales"};
  var WIDTH = 800, HEIGHT = 450;

var radius = 60,
    padding = 10;
//颜色函数
var color=d3.scale.category10();
color.domain([config.data1,config.data2, config.data3]);
//转换数据为适合生成饼图的对象数组
var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.count; });
//用svg的path绘制弧形的内置方法
var arc = d3.svg.arc()//设置弧度的内外径，等待传入的数据生成弧度
    .outerRadius(radius)
    .innerRadius(radius - 30);
data.forEach(function(d) {
  d.departments = color.domain().map(function(name) {
    return {name: name, count: +d[name]};
  });
});

//!!!!清空该div面板的所有svg，以便下次再重新画，不覆盖
 d3.select("#pie-svg").selectAll("svg").remove();
//定义图例
var legend = d3.select("#pie-svg").append("svg")
    .attr("class", "legend")
    .attr("width", radius * 2 + 180)
    .attr("height", radius * 2 + 120)
     .selectAll("g")
      .data(color.domain().slice().reverse())
     .enter().append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
//设置图例颜色
legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("x", 25)
    .attr("y", 50)
   //给不同的扇形区填充不同的颜色
    .style("fill", color);
//设置图例名称
legend.append("text")
.attr("font-size",13) 
    .attr("x", 50)
    .attr("y", 58)
    .attr("dy", ".35em")
    .text(function(d) { return d; });
//定义饼图
var piesvg = d3.select("#pie-svg").selectAll(".pie")
    .data(data)
  .enter()
  .append("svg")
    .attr("class", "pie")
    .attr("width", radius * 2 + 10)
    .attr("height", radius * 2 + 10)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

    
//准备分组,把每个分组移到图表中心
piesvg.selectAll(".arc")
    .data(function(d) { return pie(d.departments); })//使用弧生成器
  .enter()
  .append("path")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("class", "arc")
    .attr("d", arc)//使用弧生成器//将角度转为弧度（d3使用弧度绘制）

    .style("fill", function(d) { return color(d.data.name); })//设定弧的颜色
    .transition()                   //设置动画  
    .ease('bounce')                 //动画效果  
    .duration(2000)                 //持续时间  
    .attrTween('d',tweenPie)        //两个属性之间平滑的过渡。  
    .transition()  
    .ease("elastic");  
          
//动画
    function tweenPie(b){  
     //这里将每一个的弧的开始角度和结束角度都设置成了0  
    //然后向他们原始的角度(b)开始过渡，完成动画。  
       b.innerRadius=0;      
       var i=d3.interpolate({startAngle:0,endAngle:0},b);  
         //下面的函数就是过渡函数，他是执行多次最终达到想要的状态。  
      return function(t){return arc(i(t));};  
    }     

//为组中每个元素添加文本，在中心显示地区名
piesvg.append("text")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("dy", ".35em")
    .style("text-anchor", "middle") 
    .text(function(d) { return d.Region; });

});
}
////构建饼图（Furniture）////
function makePie_Furniture()
{
 d3.csv("data/FurniturePie.csv", function(err, data) {

var config = {"data1":"Bookcases","data2":"Chairs & Chairmats","data3":"Office Furnishings","data4":"Tables"};

  var WIDTH = 800, HEIGHT = 450;

var radius = 60,
    padding = 10;
//颜色函数
var color=d3.scale.category10();
color.domain([config.data1,config.data2, config.data3,config.data4]);
//转换数据为适合生成饼图的对象数组
var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.count; });
//用svg的path绘制弧形的内置方法
var arc = d3.svg.arc()//设置弧度的内外径，等待传入的数据生成弧度
    .outerRadius(radius)
    .innerRadius(radius - 30);
data.forEach(function(d) {
  d.departments = color.domain().map(function(name) {
    return {name: name, count: +d[name]};
  });
});

 d3.select("#pie-svg").selectAll("svg").remove();

var legend = d3.select("#pie-svg").append("svg")
    .attr("class", "legend")
    .attr("width", radius * 2 + 180)
    .attr("height", radius * 2 + 120)
     .selectAll("g")
      .data(color.domain().slice().reverse())
     .enter().append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("x", 25)
    .attr("y", 50)
   //给不同的扇形区填充不同的颜色
    .style("fill", color);

legend.append("text")
.attr("font-size",13) 
    .attr("x", 50)
    .attr("y", 58)
    .attr("dy", ".35em")
    .text(function(d) { return d; });

var piesvg = d3.select("#pie-svg").selectAll(".pie")
    .data(data)
  .enter()
  .append("svg")
    .attr("class", "pie")
    .attr("width", radius * 2 + 10)
    .attr("height", radius * 2 + 10)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

    
//准备分组,把每个分组移到图表中心
piesvg.selectAll(".arc")
    .data(function(d) { return pie(d.departments); })//使用弧生成器
  .enter()
  .append("path")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("class", "arc")
    .attr("d", arc)//使用弧生成器//将角度转为弧度（d3使用弧度绘制）

    .style("fill", function(d) { return color(d.data.name); })//设定弧的颜色

    .transition()                   //设置动画  
    .ease('bounce')                 //动画效果  
    .duration(2000)                 //持续时间  
    .attrTween('d',tweenPie)        //两个属性之间平滑的过渡。  
    .transition()  
    .ease("elastic");  
          

    function tweenPie(b){  
     //这里将每一个的弧的开始角度和结束角度都设置成了0  
    //然后向他们原始的角度(b)开始过渡，完成动画。  
       b.innerRadius=0;      
       var i=d3.interpolate({startAngle:0,endAngle:0},b);  
         //下面的函数就是过渡函数，他是执行多次最终达到想要的状态。  
      return function(t){return arc(i(t));};  
    }     

//为组中每个元素添加文本
piesvg.append("text")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("dy", ".35em")
    .style("text-anchor", "middle") 
    .text(function(d) { return d.Region; });

});
}
////构建饼图（Technology）////
function makePie_Technology()
{
 d3.csv("data/TechnologyPie.csv", function(err, data) {

var config = {"data1":"Computer Peripherals","data2":"Copiers and Fax","data3":"Office Machines","data4":"Telephones and Communication"};

  var WIDTH = 800, HEIGHT = 450;

var radius = 60,
    padding = 10;
//颜色函数
var color=d3.scale.category10();
color.domain([config.data1,config.data2, config.data3,config.data4]);
//转换数据为适合生成饼图的对象数组
var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.count; });
//用svg的path绘制弧形的内置方法
var arc = d3.svg.arc()//设置弧度的内外径，等待传入的数据生成弧度
    .outerRadius(radius)
    .innerRadius(radius - 30);
data.forEach(function(d) {
  d.departments = color.domain().map(function(name) {
    return {name: name, count: +d[name]};
  });
});

 d3.select("#pie-svg").selectAll("svg").remove();

var legend = d3.select("#pie-svg").append("svg")
    .attr("class", "legend")
    .attr("width", radius * 2 + 180)
    .attr("height", radius * 2 + 120)
     .selectAll("g")
      .data(color.domain().slice().reverse())
     .enter().append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("x", 25)
    .attr("y", 50)
   //给不同的扇形区填充不同的颜色
    .style("fill", color);

legend.append("text")
.attr("font-size",13) 
    .attr("x", 50)
    .attr("y", 58)
    .attr("dy", ".35em")
    .text(function(d) { return d; });

var piesvg = d3.select("#pie-svg").selectAll(".pie")
    .data(data)
  .enter()
  .append("svg")
    .attr("class", "pie")
    .attr("width", radius * 2 + 10)
    .attr("height", radius * 2 + 10)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

    
//准备分组,把每个分组移到图表中心
piesvg.selectAll(".arc")
    .data(function(d) { return pie(d.departments); })//使用弧生成器
  .enter()
  .append("path")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("class", "arc")
    .attr("d", arc)//使用弧生成器//将角度转为弧度（d3使用弧度绘制）

    .style("fill", function(d) { return color(d.data.name); })//设定弧的颜色
    .transition()                   //设置动画  
    .ease('bounce')                 //动画效果  
    .duration(2000)                 //持续时间  
    .attrTween('d',tweenPie)        //两个属性之间平滑的过渡。  
    .transition()  
    .ease("elastic");  
          

    function tweenPie(b){  
     //这里将每一个的弧的开始角度和结束角度都设置成了0  
    //然后向他们原始的角度(b)开始过渡，完成动画。  
       b.innerRadius=0;      
       var i=d3.interpolate({startAngle:0,endAngle:0},b);  
         //下面的函数就是过渡函数，他是执行多次最终达到想要的状态。  
      return function(t){return arc(i(t));};  
    }     


//为组中每个元素添加文本

piesvg.append("text")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("dy", ".35em")
    .style("text-anchor", "middle") 
    .text(function(d) { return d.Region; });
});
}
////构建饼图（Office Supplies）////
function makePie_Office()
{
 d3.csv("data/OfficePie.csv", function(err, data) {

var config = {"data1":"Appliances","data2":"Binders and Binder Accessories",
"data3":"Envelopes","data4":"Labels","data5":"Paper","data6":"Pens & Art Supplies",
"data7":"Rubber Bands","data8":"Scissors, Rulers and Trimmers","data9":"Storage & Organization"};

  var WIDTH = 800, HEIGHT = 450;

var radius = 60,
    padding = 10;
//颜色函数
var color=d3.scale.category10();
color.domain([config.data1,config.data2, config.data3,config.data4,config.data5,config.data6
  ,config.data7,config.data8,config.data9]);
//转换数据为适合生成饼图的对象数组
var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.count; });
//用svg的path绘制弧形的内置方法
var arc = d3.svg.arc()//设置弧度的内外径，等待传入的数据生成弧度
    .outerRadius(radius)
    .innerRadius(radius - 30);
data.forEach(function(d) {
  d.departments = color.domain().map(function(name) {
    return {name: name, count: +d[name]};
  });
});

 d3.select("#pie-svg").selectAll("svg").remove();

var legend = d3.select("#pie-svg").append("svg")
    .attr("class", "legend")
    .attr("width", radius * 2 + 180)
    .attr("height", radius * 2 + 120)
     .selectAll("g")
      .data(color.domain().slice().reverse())
     .enter().append("g")
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("x", 25)
    .attr("y", 50)
   //给不同的扇形区填充不同的颜色
    .style("fill", color);

legend.append("text")
.attr("font-size",13) 
    .attr("x", 50)
    .attr("y", 58)
    .attr("dy", ".35em")
    .text(function(d) { return d; });

var piesvg = d3.select("#pie-svg").selectAll(".pie")
    .data(data)
  .enter()
  .append("svg")
    .attr("class", "pie")
    .attr("width", radius * 2 + 10)
    .attr("height", radius * 2 + 10)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

    
//准备分组,把每个分组移到图表中心
piesvg.selectAll(".arc")
    .data(function(d) { return pie(d.departments); })//使用弧生成器
  .enter()
  .append("path")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("class", "arc")
    .attr("d", arc)//使用弧生成器//将角度转为弧度（d3使用弧度绘制）

    .style("fill", function(d) { return color(d.data.name); })//设定弧的颜色
    .transition()                   //设置动画  
    .ease('bounce')                 //动画效果  
    .duration(2000)                 //持续时间  
    .attrTween('d',tweenPie)        //两个属性之间平滑的过渡。  
    .transition()  
    .ease("elastic");  
          

    function tweenPie(b){  
     //这里将每一个的弧的开始角度和结束角度都设置成了0  
    //然后向他们原始的角度(b)开始过渡，完成动画。  
       b.innerRadius=0;      
       var i=d3.interpolate({startAngle:0,endAngle:0},b);  
         //下面的函数就是过渡函数，他是执行多次最终达到想要的状态。  
      return function(t){return arc(i(t));};  
    }     
//为组中每个元素添加文本

piesvg.append("text")//每个g元素都追加一个path元素用绑定到这个g的数据d生成路径信息

    .attr("dy", ".35em")
    .style("text-anchor", "middle") 
    .text(function(d) { return d.Region; });
});
}
initDataByValue();
makeMapAndBars();

// 激活按钮
var count = 0;
function clickCatergoriesButton() {
  if (count < ALL_TYPES.length) {
    MAP_VALUE = ALL_TYPES[count];
    count++;
    animateClicks(); 
  }
}

function animateClicks() {
  setTimeout(clickCatergoriesButton, 1000);
}
//点击地图的事件
function map_clicked(d) {
    if (d) {
     // console.log( "MAP_VALUE"+MAP_VALUE);
        $("#state-select").val(d.id);//选择一个州
        //输出该州在不同种类下的数据
        if(MAP_VALUE=="Total"){
        if (salesTotalD[d.id]) {
            $("#data-region-value").html(salesRegion[d.id]);
             $("#data-profit-value").html(salesTotalP[d.id]);
            $("#data-sale-value").html(salesTotalD[d.id]);
         
        } else {
           $("#data-region-value").html("<span class='no-data'>No Data</span>");
             $("#data-profit-value").html("<span class='no-data'>No Data</span>");
            $("#data-sale-value").html("<span class='no-data'>No Data</span>");
             
            
        }
      } 
      else if(MAP_VALUE=="Office Supplies"){
        if (salesOfficeD[d.id]){
      
          $("#data-region-value").html(salesRegion[d.id]);
          $("#data-profit-value").html(salesOfficeP[d.id]);
            $("#data-sale-value").html(salesOfficeD[d.id]);
        
        } else {
              $("#data-region-value").html("<span class='no-data'>No Data</span>");
             $("#data-profit-value").html("<span class='no-data'>No Data</span>");
            $("#data-sale-value").html("<span class='no-data'>No Data</span>");
            
        }
      }
      else if(MAP_VALUE=="Furniture"){
        if (salesFurnitureD[d.id]){
         
         $("#data-region-value").html(salesRegion[d.id]);
          $("#data-profit-value").html(salesFurnitureP[d.id]);
            $("#data-sale-value").html(salesFurnitureD[d.id]);
         
        } else {
              $("#data-region-value").html("<span class='no-data'>No Data</span>");
             $("#data-profit-value").html("<span class='no-data'>No Data</span>");
            $("#data-sale-value").html("<span class='no-data'>No Data</span>");
            
        }
      }
      else if(MAP_VALUE=="Technology"){
        if (salesTechnologyD[d.id]){
       
         $("#data-region-value").html(salesRegion[d.id]);
             $("#data-profit-value").html(salesTechnologyP[d.id]);
            $("#data-sale-value").html(salesTechnologyD[d.id]);
         
        } else {
              $("#data-region-value").html("<span class='no-data'>No Data</span>");
             $("#data-profit-value").html("<span class='no-data'>No Data</span>");
            $("#data-sale-value").html("<span class='no-data'>No Data</span>");
            
        }
      }
    }
}
});
});
});