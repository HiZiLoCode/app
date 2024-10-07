import type {
  AuthorizedDevice,
  ConnectedDevice,
  WebVIADevice,
} from '../types/types';

// 全局缓冲区，用于存储设备数据
const globalBuffer: {
  [path: string]: {currTime: number; message: Uint8Array}[];
} = {};

// 事件等待缓冲区，用于存储设备事件回调
const eventWaitBuffer: {
  [path: string]: ((a: Uint8Array) => void)[];
} = {};

// 过滤HID设备的方法，只保留符合特定条件的设备
const filterHIDDevices = (devices: HIDDevice[]) =>
  devices.filter((device) =>
    device.collections?.some(
      (collection) =>
        collection.usage === 0x61 && collection.usagePage === 0xff60,
    ),
  );

// 获取VIA的标识符
const getVIAPathIdentifier = () =>
  // 使用 randomUUID 生成一个随机的、长度为 36 字符的第四版 UUID 字符串
  (self.crypto && self.crypto.randomUUID && self.crypto.randomUUID()) ||
  `via-path:${Math.random()}`;

// 标记设备，以便唯一标识
const tagDevice = (device: HIDDevice): WebVIADevice => {
  // 这是为了稳定地识别已经扫描的设备
  // 有点非法入侵，但 https://github.com/WICG/webhid/issues/7 说明了这个问题
  const path = (device as any).__path || getVIAPathIdentifier();
  (device as any).__path = path;
  
  // 创建一个包含设备信息的对象
  const HIDDevice = {
    _device: device,
    usage: 0x61,
    usagePage: 0xff60,
    interface: 0x0001,
    vendorId: device.vendorId ?? -1,
    productId: device.productId ?? -1,
    path,
    productName: device.productName,
  };
  
  return (ExtendedHID._cache[path] = HIDDevice);
};

// 尝试忘记设备
export const tryForgetDevice = (device: ConnectedDevice | AuthorizedDevice) => {
  const cachedDevice = ExtendedHID._cache[device.path];
  if (cachedDevice) {
    return cachedDevice._device.forget();
  }
};

const ExtendedHID = {
  _cache: {} as {[key: string]: WebVIADevice},
  
  // 请求设备
  requestDevice: async () => {
    const requestedDevice = await navigator.hid.requestDevice({
      filters: [
        {
          usagePage: 0xff60,
          usage: 0x61,
        },
      ],
    });
    requestedDevice.forEach(tagDevice);
    
    return requestedDevice[0];
  },
  
  // 获取过滤后的设备列表
  getFilteredDevices: async () => {
    try {
      // 获取 HID 设备列表
      const hidDevices = filterHIDDevices(await navigator.hid.getDevices());      
      return hidDevices;
    } catch (e) {
      return [];
    }
  },
  
  // 获取设备列表
  devices: async (requestAuthorize = false) => {
    let devices = await ExtendedHID.getFilteredDevices();
    
    // TODO: 这是一个 hack，避免频繁弹出请求设备的对话框
    if (devices.length === 0 || requestAuthorize) {
      try {
        await ExtendedHID.requestDevice();
      } catch (e) {
        // 当最后一个授权设备被断开连接时，请求可能会失败
        return [];
      }
      devices = await ExtendedHID.getFilteredDevices();
    }
    
    return devices.map(tagDevice);
  },
  
  // HID 类
  HID: class HID {
    _hidDevice?: WebVIADevice;
    interface: number = -1;
    vendorId: number = -1;
    productId: number = -1;
    productName: string = '';
    path: string = '';
    openPromise: Promise<void> = Promise.resolve();
    
    constructor(path: string) {
      this._hidDevice = ExtendedHID._cache[path];
      // TODO: 将打开设备的尝试从构造函数中分离出来，因为它是异步的
      // 尝试连接到设备

      if (this._hidDevice) {
        this.vendorId = this._hidDevice.vendorId;
        this.productId = this._hidDevice.productId;
        this.path = this._hidDevice.path;
        this.interface = this._hidDevice.interface;
        this.productName = this._hidDevice.productName;
        globalBuffer[this.path] = globalBuffer[this.path] || [];
        eventWaitBuffer[this.path] = eventWaitBuffer[this.path] || [];
        
        if (!this._hidDevice._device.opened) {
          this.open();
        }
      } else {
        throw new Error('缓存中缺少 HID 设备');
      }
    }
   
    // 打开设备
    async open() {
      if (this._hidDevice && !this._hidDevice._device.opened) {
        this.openPromise = this._hidDevice._device.open();
        this.setupListeners();
        await this.openPromise;
      }
      return Promise.resolve();
    }

    // 设置事件监听器
    setupListeners() {
      if (this._hidDevice) {
        this._hidDevice._device.addEventListener('inputreport', (e) => {
          if (eventWaitBuffer[this.path].length !== 0) {
            // 应该不可能有一个处理程序在缓冲区中
            // 时间戳在当前消息到达后
            (eventWaitBuffer[this.path].shift() as any)(new Uint8Array(e.data.buffer));
            // console.log(new Uint8Array(e.data.buffer), eventWaitBuffer[this.path].length !== 0);
          } else {
            globalBuffer[this.path].push({
              currTime: Date.now(),
              message: new Uint8Array(e.data.buffer),
            });
            // console.log('globalBuffer', globalBuffer);
          }
        });
      }
    }

    // 读取数据
    read(fn: (err?: Error, data?: ArrayBuffer) => void) {
      this.fastForwardGlobalBuffer(Date.now());
      if (globalBuffer[this.path].length > 0) {
        // 这个操作应该是无效的
        fn(undefined, globalBuffer[this.path].shift()?.message as any);
      } else {
        eventWaitBuffer[this.path].push((data) => fn(undefined, data));
      }
    }

    // 使用 Promisify 封装读取操作
    readP = promisify((arg: any) => this.read(arg));

    // 快进全局缓冲区
    fastForwardGlobalBuffer(time: number) {
      let messagesLeft = globalBuffer[this.path].length;
      while (messagesLeft) {
        messagesLeft--;
        // 缓冲区中的消息发生在请求时间之前
        if (globalBuffer[this.path][0].currTime < time) {
          globalBuffer[this.path].shift();
        } else {
          break;
        }
      }
    }

    // 写入数据
    async write(arr: number[]) {
      await this.openPromise;
      const data = new Uint8Array(arr.slice(1));
      // console.log('', data);
      
      await this._hidDevice?._device.sendReport(0, data);
    }
  },
};

// 将回调函数转换为返回 Promise 的函数
const promisify = (cb: Function) => () => {
  return new Promise((res, rej) => {
    cb((e: any, d: any) => {
      if (e) rej(e);
      else res(d);
    });
  });
};

export const HID = ExtendedHID;
