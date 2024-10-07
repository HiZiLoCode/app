type USBMonitorEvent = 'remove' | 'change';

export class usbDetect {
  // 事件监听器，存储 'change' 和 'remove' 事件的回调函数
  static _listeners: {change: Function[]; remove: Function[]} = {
    change: [],
    remove: [],
  };

  // 是否应该监视设备连接状态
  static shouldMonitor = false;
  
  // 是否已经开始监视
  static hasMonitored = false;

  // 开始监视 USB 设备
  static startMonitoring() {
    this.shouldMonitor = true;

    // 如果还没有开始监视，并且浏览器支持 navigator.hid
    if (!this.hasMonitored && navigator.hid) {
      // 添加设备连接和断开事件的监听器
      navigator.hid.addEventListener('connect', usbDetect.onConnect);
      navigator.hid.addEventListener('disconnect', usbDetect.onDisconnect);
      
      // 标记为已经开始监视
      this.hasMonitored = true;
    }
  }

  // 停止监视 USB 设备
  static stopMonitoring() {
    this.shouldMonitor = false;
  }

  // 处理设备连接事件
  private static onConnect = ({device}: HIDConnectionEvent) => {
    console.log('检测到连接');
    if (usbDetect.shouldMonitor) {
      console.log(usbDetect._listeners.change);
      
      // 执行所有 'change' 事件的回调函数
      usbDetect._listeners.change.forEach((f) => f(device));
    }
  };

  // 处理设备断开事件
  private static onDisconnect = ({device}: HIDConnectionEvent) => {
    console.log('检测到断开');
    if (usbDetect.shouldMonitor) {
      console.log(usbDetect._listeners);
      
      // 执行所有 'change' 和 'remove' 事件的回调函数
      usbDetect._listeners.change.forEach((f) => f(device));
      usbDetect._listeners.remove.forEach((f) => f(device));
    }
  };

  // 添加事件回调函数
  static on(eventName: USBMonitorEvent, cb: () => void) {
    this._listeners[eventName] = [...this._listeners[eventName], cb];
    console.log(this._listeners[eventName]);
  }

  // 移除事件回调函数
  static off(eventName: USBMonitorEvent, cb: () => void) {
    this._listeners[eventName] = this._listeners[eventName].filter(
      (f) => f !== cb,
    );
  }
}
