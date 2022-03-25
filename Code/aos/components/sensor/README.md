@page sensor sensor

# 概述
uData 框架设计思想是基于传统 sensorhub 概念基础之上的，结合IoT的业务场景和 AliOS  Things 物联网操作系统的特点设计而成的一个面对 IoT 的感知设备处理框架。为了能更好的提供每个开发者极简开发，uData 已将驱动相关的 OS 调用，比如中断注册接口，设备硬件配置接口等都抽象到了sensor hal 实现。每一个设备驱动程序，只需一个 .c文件中，通过 BUS 总线如 I2C，对设备进行读写和配置操作，就能实现全部的功能，同时也减少了开发者调试工作时间。可以方便地开发传感器驱动程序。

sensor 组件是 udata 组件的 Sensor Driver 部分，可单独提供 sensor hal 接口给外部模块使用，而无需使用 udata 组件全部功能。
## 组件支持以下功能：
- 传感器的硬件抽象层；
- 统一的I2C和SPI总线驱动程序；
- 支持modbus和CANbus传感器；
- 已集成100多个传感器驱动；

## 版权信息
> Apache license v2.0

## 目录结构
```sh
.
├── drv                             #已集成的Sensor设备驱动程序
│   ├── drv_acc_adi_adxl345.c
│   ├── ...
│   └── drv_temp_humi_si_si7006.c
├── example
│   ├── sensor_cloud_demo.c         #示例，获取传感器数据并在本地进行打印；
│   └── sensor_local_demo.c         #示例，获取传感器数据并通过linkkit上传到云端；
├── hal
│   ├── gps_parse.c                 #gps数据处理分析
│   ├── sensor_drv_api.c            #提供给外部模块使用的Sensor Hal接口
│   ├── sensor_hal.c                #传感器驱动调用接口
│   └── sensor_static_calibrate.c   #静态校准配置接口
├── include                         #头文件
│   ├── gps_parse.h
│   ├── sensor
│   │   └── sensor.h
│   ├── sensor_drv_api.h
│   ├── sensor_hal.h
│   └── sensor_static_calibrate.h
├── package.yaml                    #编译配置文件
└── README.md
```

## 依赖组件
* ulog
* vfs
* i2c
* spi

# 常用配置
系统中相关配置已有默认值，如需修改配置，统一在yaml中**def_config**节点修改，具体如下：
> Sensor 的设备驱动程序默认不编译, 可在yaml中添加驱动对应的宏进行配置，如添加温度传感器驱动 SI7006
```sh
def_config:
  AOS_SENSOR_TEMP_SI_SI7006: 1
```

# API说明
@ref sensor_hal_init()
传感器器驱动初始化

@ref sensor_hal_open()
打开传感器，即让指定的传感器进入工作状态

@ref sensor_hal_read()
读取传感器数据

@ref sensor_hal_write()
向传感器发送数据，暂时未使用

@ref sensor_hal_ioctl()
对传感器的参数进行设置

@ref sensor_hal_close()
关闭指定的传感器

# 使用示例 -- Sensor hal 本地演示
基于 Sensor Hal 接口获取传感器数据，并在本地进行打印，参考 example/sensor_local_demo.c

以运行 helloworld_demo 为例，具体步骤如下：

## 1. 选择要使用的开发板
> solutions/helloworld_demo/package.yaml 基础信息 solution 中配置要使用的开发板，默认是 haas100，如果使用 haaseduk1，修改如下
```sh
solution:
  cpu_id: cpu0
  board_name: haaseduk1
```

## 2. 添加示例代码
> solutions/helloworld_demo/package.yaml 配置信息 def_config 中添加要运行的 example 示例代码和 Sensor 设备驱动的宏。例如温湿度传感器 si7006 数据并在本地进行打印：
```sh
def_config:
  AOS_SENSOR_LOCAL_DEMO_ENABLE: 1
  AOS_SENSOR_HUMI_SI_SI7006: 1
  AOS_SENSOR_TEMP_SI_SI7006: 1
```

## 3. 添加 sensor 组件
> solutions/helloworld_demo/package.yaml 依赖信息 depends 中添加 sensor 组件
```sh
depends:
  - cli: dev_aos
  - osal_aos: dev_aos
  - haaseduk1: dev_aos
  - sensor: dev_aos
```

## 4. 编译
```sh
cd solutions/helloworld_demo && aos make
```

## 5. 烧录固件
> 参考具体板子的快速开始文档。

## 6. 示例测试
> CLI命令行输入：
```sh
sensor_local_test
```

## 7. 关键日志
> CLI日志：
```sh
Temperature value :
Humidity value :
```

# 使用示例 -- Sensor hal 连云演示
基于 Sensor Hal 接口获取传感器数据，并通过 linkkit 上传到云端，参考 example/sensor_cloud_demo.c

以运行 linksdk_demo 为例，具体步骤如下：

## 1. 选择要使用的开发板
> solutions/linksdk_demo/package.yaml 基础信息 solution 中配置要使用的开发板，默认是 haas100，如果使用 haaseduk1，修改如下
```sh
solution:
  cpu_id: cpu0
  board_name: haaseduk1
```

## 2. 添加示例代码
> 2.1 solutions/linksdk_demo/package.yaml 配置信息 def_config 中添加要运行的 example 示例代码和 Sensor 设备驱动的宏。例如温湿度传感器 si7006 数据并通过 linkkit 上传到云端：
```sh
def_config:
  AOS_SENSOR_CLOUD_DEMO_ENABLE: 1
  AOS_SENSOR_HUMI_SI_SI7006: 1
  AOS_SENSOR_TEMP_SI_SI7006: 1
```
> 2.2 solutions/linksdk_demo/main.c 添加 sensor_cloud_test_init（） 函数调用
```
extern void sensor_cloud_test_init(void);
int application_start(int argc, char *argv[])
{
    aos_set_log_level(AOS_LL_DEBUG);
    sensor_cloud_test_init();
    event_service_init(NULL);
    ...
}
```
> 2.3 solutions/linksdk_demo/data_model_basic_demo.c 的 demo_main() 函数中
- 替换你自己在阿里云物联网平台上创建设备的三元组信息，下面三元组仅本示例测试所用
```
extern void sensor_cloud_test_start(void *dm_handle);
int demo_main(int argc, char *argv[])
{
    ...
    aiot_sysdep_network_cred_t cred; /* 安全凭据结构体, 如果要用TLS, 这个结构体中配置CA证书等参数 */

    /* TODO: 替换为自己设备的三元组 */
    char *product_key       = "a1eykua9RBq";
    char *device_name       = "haas-edu-k1-calon";
    char *device_secret     = "589bb9ff1d55675096ba6ba2e0d52392";

    /* 配置SDK的底层依赖 */
    aiot_sysdep_set_portfile(&g_aiot_sysdep_portfile);
    ...
}
```
- 注释掉其它属性上报和事件上报，添加 sensor_cloud_test_start() 函数调用,
```sh
extern void sensor_cloud_test_start(void *dm_handle);
int demo_main(int argc, char *argv[])
{
    ...

    /* 主循环进入休眠 */
    while (1) {
        /* TODO: 以下代码演示了简单的属性上报和事件上报, 用户可取消注释观察演示效果 */
        // demo_send_property_post(dm_handle, "{\"LightSwitch\": 0}");
        // demo_send_event_post(dm_handle, "Error", "{\"ErrorCode\": 0}");

        sensor_cloud_test_start(dm_handle);
        aos_msleep(1000);
    }

    ...
}
```
## 3. 添加 sensor 组件
> solutions/linksdk_demo/package.yaml 依赖信息 depends 中添加 sensor 组件
```sh
depends:
  - linksdk: dev_aos
  - haaseduk1: dev_aos
  - sensor: dev_aos
  - mbedtls: dev_aos
  - netmgr: dev_aos
```

## 4. 编译
```sh
cd solutions/linksdk_demo && aos make
```

## 5. 烧录固件
> 参考具体板子的快速开始文档。

## 6. 示例测试
### 设备联网
> CLI命令行输入：打开连网成功后会自动保存AP信息的功能
```sh
netmgr -t wifi -b 1
```
> CLI命令行输入：netmgr -t wifi -c {ssid} {password} 连接名为ssid的路由器AP，其中 {ssid} {password}替换为自己的路由器配网信息
```sh
netmgr -t wifi -c my_wifi 12345678
```
> 设备在联网成功后会自动读取 Sensor 数据并上报到云端，同时可以看到设备在阿里云物联网平台处于在线状态，在日志服务中能查看设备上传到云端的日志信息

## 7. 关键日志
> CLI日志：
```sh
AIOT_MQTTEVT_CONNECT
Humidity value : 15.3 H
[LK-0309] pub: /sys/a1eykua9RBq/haas-edu-k1-calon/thing/event/property/post
Temperature value : 42.0 centidegree
[LK-0309] pub: /sys/a1eykua9RBq/haas-edu-k1-calon/thing/event/property/post
[LK-0309] pub: /sys/a1eykua9RBq/haas-edu-k1-calon/thing/event/property/post_reply
[LK-0A08] DM recv generic reply
demo_dm_recv_handler, type = 0
msg_id = 1, code = 200, data = {}, message = success
```

# 注意事项
sensor设备驱动 components/sensor/drv/drv_####_####_####.c 中 i2c_dev_t 结构体成员 port 要与 sensor_i2c_init() 初始化中的 port 相同。
```
void i2c_init(void)
{
    i2c_dev_t i2c_dev;
    i2c_dev.port                 = 1;
    i2c_dev.config.address_width = I2C_HAL_ADDRESS_WIDTH_7BIT;
    i2c_dev.config.freq          = I2C_BUS_BIT_RATES_100K;
    i2c_dev.config.mode          = I2C_MODE_MASTER;

    sensor_i2c_init(&i2c_dev);
}

i2c_dev_t ####_ctx = {
    .port                 = 1,
    .config.address_width = I2C_HAL_ADDRESS_WIDTH_7BIT,
    .config.freq          = I2C_BUS_BIT_RATES_100K,
    .config.mode          = I2C_MODE_MASTER,
    .config.dev_addr      = SI7006_I2C_ADDRESS,
};
```

# FAQ
Q1： 怎么自己添加特定型号的传感器驱动程序？
> 1. 参考 components/sensor/drv/drv_####_####_####.c 已集成的传感器设备驱动编写驱动文件；

> 2. components/sensor/drv/drv_init.c 中添加驱动程序的宏开关, 如
```sh
#if AOS_SENSOR_TEMP_SI_SI7006
    drv_temp_si_si7006_init();
#endif
```
> 3. components/sensor/package.yaml 中添加参与编译的源代码文件
```
source_file:
  - drv/drv_temp_humi_si_si7006.c ? <AOS_SENSOR_TEMP_SI_SI7006>
```
更具体的操作可以参考下面链接：
- [AliOS Things uData Sensor Driver Porting Guide](https://github.com/alibaba/AliOS-Things/wiki/AliOS-Things-uData-Sensor-Driver-Porting-Guide)