# UNO R3 + 10k 电位器：淋浴控制器

## 方案

USB → 串口（115200 baud）→ 浏览器 Web Serial → 现有 `SHOWER_START` / `SHOWER_STOP` 事件 → 网页统一计时、扣费和账单。

先使用本地网页和桌面 Chrome / Edge，无需 Node 串口中转服务或 Arduino 网络模块。以后可将网站部署至 GitHub Pages（HTTPS），电脑上的浏览器仍直接访问插在该电脑上的 USB 设备。GitHub 服务器不参与串口传输。不要用 Codex 内置预览、Safari 或 Firefox 进行硬件连接；使用完整的桌面 Chrome / Edge。Web Serial 需要安全上下文（localhost 或 HTTPS）和用户主动点击连接授权。

## 接线（普通三脚 10k 线性电位器，UNO R3）

接线时先断开 USB。

| 电位器引脚 | UNO R3 |
| --- | --- |
| 外侧脚 1 | 5V |
| 中间滑动端 | A0 |
| 外侧脚 2 | GND |

电位器两外脚可对调，会反转旋转方向。希望顺时针增大读数时，连接后看网页 A0 读数；方向相反就断电后交换两外脚。中间脚始终接 A0。旋钮自带模块时，按模块标识接 VCC→5V、GND→GND、SIG/OUT→A0，不能仅凭物理排列判断。

使用支持数据传输的 USB A–B 线连接 UNO R3 和电脑（必要时使用 USB 转接器）。不需要外接电源、电阻、额外按钮或外接 LED。板载 L LED 表示旋钮的开/关状态；网页的三灯继续表示淋浴时间。当前固件不驱动三颗外部 LED，也不控制实际水阀。

Arduino 官方接线示例：https://docs.arduino.cc/built-in-examples/basics/AnalogReadSerial/

## 上传和运行

1. Arduino IDE 打开 `shower/shower.ino`。
2. 开发板选择 **Arduino AVR Boards → Arduino Uno**；若缺失，在 Boards Manager 安装 Arduino AVR Boards。
3. 选择 USB 插入后新增的串口（macOS 常见 `/dev/cu.usbmodem…`，兼容板可能为 `/dev/cu.usbserial…` 或 `/dev/cu.wchusbserial…`）。
4. 上传固件。可以先用 Serial Monitor、115200 baud 查看 `STATE,读数,0或1`，确认旋钮读数能在约 0–1023 之间变化。
5. **关闭 Serial Monitor 和 Serial Plotter**，让网页独占串口。Arduino IDE 本身可以保持打开。
6. 旋钮先扭到低位。在项目根目录运行 `npm install`（首次），然后 `npm run dev`。
7. 使用桌面 Chrome / Edge 打开 `http://localhost:5173/`（若 Vite 使用其他端口，以终端输出为准）。
8. 点击页面顶部 **CONNECT ARDUINO**，在浏览器设备选择器里选择 Arduino 对应串口，点击连接。
9. 等待板子自动复位约 1–2 秒，网页应显示 CONNECTED 和实时 A0 读数。
10. 扭到 A0 > 800 并保持约 80ms，网页自动开始。扭到 A0 < 760 并保持约 80ms，网页自动停止并生成摘要。

## 阈值与行为

`shower.ino` 顶部配置：

```cpp
const int START_THRESHOLD = 800;
const int STOP_THRESHOLD = 760;
```

UNO R3 使用 10 位 ADC，满量程 1023。800 约对应行程 78%，760 约为 74%；这是电压读数比例，旋钮机械行程与电位器型号有关。760–800 内保持原状态。这种迟滞防止临界值附近连续启停；另有四次采样平均和 80ms 稳定确认。需要更靠近尽头才启动，可以改成 900 和 860，保持停止阈值小于启动阈值，重新上传。

- 首次连接时，如果旋钮已经在高位，会自动开始；操作前建议先扭低。
- 手动网页停止后，高位心跳不会自动重启。需要先扭低，再扭高。
- Reset Demo 和余额耗尽同样需要先低后高，避免持续高位覆盖停止状态。
- 切换两个页面不会断开串口或停止淋浴。网页按钮仍可独立启停。
- 主动断开、拔掉 USB 或 3 秒收不到合法心跳时，网页结束当前淋浴，生成摘要。后台标签页可能被浏览器节流，展示时应保持网页在前台、电脑不休眠。
- 刷新网页后，账户记录仍在本地存储，但串口需要重新点击连接。使用同一浏览器、同一地址保存演示状态；从 localhost 换到 GitHub Pages 是不同存储空间。
- 关闭整个网页后程序不能继续读取旋钮。重新打开时，现有账户逻辑会结算上次活动期间经过的时间；完整演示请保持网页打开，关闭前先停止淋浴。
- 不要同时在两个标签页连接控制器。

## 协议与代码位置

Arduino 每 250ms 发送一行，状态变化立即发送，使用 CRLF 换行：

```text
STATE,532,0
STATE,901,1
```

第二字段是 A0 原始读数；第三字段是经过迟滞和防抖后的开关状态。网页不重复判断阈值，避免两边逻辑冲突。

- `src/serialProtocol.ts`：行解析、边沿检测、Reset/强制停止后的重新启动约束。
- `src/serial.ts`：Web Serial 连接、流式分行、断线处理、信号超时、硬件事件派发。
- `src/ArduinoControl.tsx`：连接按钮、连接状态、实时 A0 读数。
- `src/hardware.ts` / `src/store.ts`：现有事件总线与账户逻辑，旋钮和网页共用。
- `src/serialProtocol.test.ts`：协议与账户交互测试；运行 `npm test`。

固件只发送物理旋钮状态，不保存 WT 或计算时间。停止后网页计时归零/摘要等行为由现有控制器统一处理。无需额外 npm 串口依赖。

## 排查

- 没有串口：检查 USB 是否是数据线、换 USB 接口、检查 IDE 的板卡和端口。兼容板若使用 CH340 USB 芯片且系统未识别，按板卡厂商说明安装其驱动。
- 连接失败：关闭串口监视器、绘图器和其他正在使用该端口的软件，重新连接。
- A0 不随旋钮变化：检查中间滑动端、GND、5V 接线和面包板是否同排短接。
- 网页提示浏览器不支持：改用桌面 Chrome / Edge，并确认是 localhost 或 HTTPS。
- 上传失败：先在网页点击 DISCONNECT ARDUINO，然后上传；上传完成再连接网页。

Web Serial 官方文档：https://developer.chrome.com/docs/capabilities/serial

## 验证范围

网页构建与自动化逻辑测试可在没有 Arduino 的情况下运行。需要真实 UNO R3 完成 IDE 编译上传、A0 全行程读数和 USB 连线测试；仓库不包含 AVR 编译工具链。
