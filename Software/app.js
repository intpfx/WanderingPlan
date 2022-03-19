/*
version: 1.0.0
**/

/****************************************加载依赖模块开始*******************************************************/
var gpio = require("gpio"); // 加载GPIO模块 获取GPIO对象
var iot = require("iot"); // 加载IOT模块 获取物联网平台相关操作所用对象
var network = require("network"); // 加载NETWORK模块 获取网络状态所用对象
var uart = require("uart"); // 加载UART模块 获取串口对象
var i2c = require("i2c"); // 加载i2c模块 获取i2c对象
var GNSS = require("./gnss.js"); //加载GNSS模块 获取GNSS对象
/****************************************加载依赖模块结束*******************************************************/

/****************************************温度传感模块开始*******************************************************/
//初始化板上LM75A温度传感器
var lm75 = i2c.open({
  id: "I2C1",
});
//初始化温度值
var temperature = 0;
//定义函数 [温度传感器读取温度值]
function lm75tmpGet() {
  var sig = 1;
  var temp;
  var regval = lm75.readMem(0x00, 2);
  var tempAll = (regval[0] << 8) + regval[1];

  if (regval[0] & (0x80 != 0)) {
    tempAll = ~tempAll + 1;
    sig = -1;
  }

  tempAll = tempAll >> 5;
  temp = tempAll * 0.125 * sig;

  return temp;
}
/****************************************温度传感模块结束*******************************************************/

/****************************************人体检测模块开始*******************************************************/
//初始化板上LED灯数据[发送]io口
var led = gpio.open({
  id: "USER_LED",
});
// 初始化人体检测传感器数据[接收]io口
var sensor = gpio.open({
  id: "D4",
});
//初始化LED灯状态值
var value = 0;
var last_value = 0;
/****************************************人体检测模块结束*******************************************************/

/****************************************GPS模块开始*******************************************************/
//打开并初始化UART1 用于连接GNSS模块
var uart1 = uart.open({
  id: "UART1",
});
//创建GNSS解析器
var gnss = new GNSS();
//初始化地理位置信息
var geoLocation_data = { lat: 0, lon: 0, alt: 0 };
//初始化GGA数据
var GGA;
//GNSS解析器 监听data事件
gnss.on("data", function (parsed) {
  geoLocation_data["lat"] = parsed["lat"];
  geoLocation_data["lon"] = parsed["lon"];
  geoLocation_data["alt"] = parsed["alt"];
});
//获取UART1串口数据 把数据转换成字符串 解析成GGA数据 然后上传至GNSS解析器
uart1.on("data", function (data) {
  var aaa = ArrayToString(data);
  var bbb = aaa.split("$");
  GGA = "$" + bbb[1];
  gnss.update(GGA);
});
//定义函数 [数组转字符串]
function ArrayToString(fileData) {
  var dataString = "";
  for (var i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }
  return dataString;
}
/****************************************GPS模块结束*******************************************************/

/****************************************摄像头模块开始*******************************************************/
//打开并初始化UART2
var uart2 = uart.open({
  id: "UART2",
});
//初始化摄像头指令控制数据
var commandData = [];
//初始化图片数据
var photoData = "";
//定义函数 [摄像头指令写入及读取]
function writeAndRead() {
  //摄像头指令写入
  uart2.write(commandData);
  //摄像头指令读取
  uart2.on("data", function (data) {
    var aaa = ArrayToString(data);
    console.log(aaa);
  });
}
//定义函数 [获取版本号]
function getVision() {
  commandData = [0x56, 0x00, 0x11, 0x00];
  uart2.write(commandData);
  uart2.on("data", function (data) {
    photoData = ArrayToString(data);
    console.log(photoData);
  });
}
//定义函数 [复位]
function reset() {
  commandData = [0x56, 0x00, 0x26, 0x00];
  writeAndRead();
  console.log("reset");
}
//定义函数 [拍照]
function take() {
  commandData = [0x56, 0x00, 0x36, 0x01, 0x00];
  writeAndRead();
  console.log("take");
}
//定义函数 [读取长度]
function readlenth() {
  commandData = [0x56, 0x00, 0x34, 0x01, 0x00];
  writeAndRead();
  console.log("readlenth");
}
//定义函数 [读数]
function readnum() {
  commandData = [
    0x56, 0x00, 0x32, 0x0c, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    0x4b, 0xc6, 0x00, 0xff,
  ];
  uart2.write(commandData);
  uart2.on("data", function (data) {
    photoData = ArrayToString(data);
    console.log(photoData);
  });
  console.log("readnum");
}
//定义函数 [停止拍照]
function stop() {
  commandData = [0x56, 0x00, 0x36, 0x01, 0x03];
  writeAndRead();
  console.log("stop");
}
//定义函数 [拍一次照片]
function takephoto() {
  take();
  readlenth();
  readnum();
  stop();
  console.log("done!");
}

/****************************************摄像头模块结束*******************************************************/

/****************************************磁力锁模块开始*******************************************************/
//初始化磁力锁上电状态
var lock;
/****************************************磁力锁模块结束*******************************************************/

/****************************************业务逻辑编写开始*******************************************************/
//函数定义 [数据上传至阿里云]
function uploadData(iotdev) {
  // 收到物联网下发的服务调用消息
  iotdev.onService(function (service) {
    console.log("received cloud service id " + service.service_id);
    console.log("received cloud service param  " + service.params);
    console.log("received cloud service param len  " + service.params_len);
  });

  // 收到物联网平台下发的属性控制消息
  iotdev.onProps(function (properity) {
    console.log("received cloud properity param " + properity.params);
    console.log("received cloud properity param len " + properity.params_len);
  });

  // 定时检测 将数据保存到iotdev
  setInterval(function () {
    //更新GPS数据
    gnss.update(GGA);
    console.log(
      "location: " +
        geoLocation_data["lat"] +
        "," +
        geoLocation_data["lon"] +
        "," +
        geoLocation_data["alt"]
    );
    //更新温度数据
    temperature = lm75tmpGet();
    console.log("temperature: " + temperature);
    //更新LED灯状态值
    value = sensor.readValue();
    if (value != last_value) {
      led.writeValue(value);
      console.log("gpio: led set value " + value);
      //更新图片数据
      takephoto();
      console.log("photodata=" + photoData);
      last_value = value;
    }

    //将数据保存到iotdev
    iotdev.postProps(
      JSON.stringify({
        LEDSwitch: value,
        ImgHex: photoData,
        CurrentTemperature: temperature,
        GeoLocation: {
          Longitude: geoLocation_data["lon"],
          Latitude: geoLocation_data["lat"],
          Altitude: geoLocation_data["alt"],
          CoordinateSystem: 1,
        },
        LockSwitch: lock,
      })
    );
  }, 5000);
}

//函数定义 [创建物联网设备]
function iotDeviceCreate() {
  //初始化设备三元组
  const productKey = "a1mrB2wyKr6";
  const deviceName = "SAZGtcVUlMClGBcPGeGN";
  const deviceSecret = "81af76416445865193e20e23ed65c9c1";
  // 初始化IoT连接
  let iotdev = iot.device({
    productKey: productKey,
    deviceName: deviceName,
    deviceSecret: deviceSecret,
  });
  // IoT连接成功事件的回调函数注册
  iotdev.on("connect", function () {
    console.log("success connect to aliyun iot server");
    // 上报数据
    uploadData(iotdev);
  });

  // IoT重新连接成功的回调函数注册
  iotdev.on("reconnect", function () {
    console.log("success reconnect to aliyun iot server");
  });

  // IoT断开连接事件的回调函数注册
  iotdev.on("disconnect", function () {
    console.log("aliyun iot server disconnected");
  });
}

//初始化网络模块
var networkClient = network.openNetWorkClient();
//获取网络连接状态
var netStatus = networkClient.getStatus();
//网络注册连接的判断业务
if (netStatus == "connect") {
  console.log("network connected, create iot connection");
  iotDeviceCreate(); // 网络连接成功后，连接物联网平台
} else {
  // 如果网络当前连线状态为未联网状态则注册连接成功的回调函数，一旦连接成功则连接物联网平台
  networkClient.on("connect", function () {
    console.log("network connected, create iot connection");
    iotDeviceCreate();
  });
}
/****************************************业务逻辑编写结束*******************************************************/
