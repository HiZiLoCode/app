type USBMonitorEvent = 'remove' | 'change';
export class usbDetect {
  static _listeners: {change: Function[]; remove: Function[]} = {
    change: [],
    remove: [],
  };
  static shouldMonitor = false;x
  static hasMonitored = false;
  // 
  static startMonitoring() {
    this.shouldMonitor = true;
    if (!this.hasMonitored && navigator.hid) {
      navigator.hid.addEventListener('connect', usbDetect.onConnect);
      navigator.hid.addEventListener('disconnect', usbDetect.onDisconnect);
    }
  }
  static stopMonitoring() {
    this.shouldMonitor = false;
  }
  private static onConnect = ({device}: HIDConnectionEvent) => {
    console.log('Detected Connection');
    if (usbDetect.shouldMonitor) {
      console.log(usbDetect._listeners.change);
      
      usbDetect._listeners.change.forEach((f) => f(device));
    }
  };
  private static onDisconnect = ({device}: HIDConnectionEvent) => {
    console.log('Detected Disconnection');
    if (usbDetect.shouldMonitor) {
      console.log(usbDetect._listeners);
      
      usbDetect._listeners.change.forEach((f) => f(device));
      usbDetect._listeners.remove.forEach((f) => f(device));
    }
  };
  static on(eventName: USBMonitorEvent, cb: () => void) {
    this._listeners[eventName] = [...this._listeners[eventName], cb];
    console.log( this._listeners[eventName]);
    
  }
  static off(eventName: USBMonitorEvent, cb: () => void) {
    this._listeners[eventName] = this._listeners[eventName].filter(
      (f) => f !== cb,
    );  }
}
