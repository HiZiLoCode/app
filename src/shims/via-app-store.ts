import type { StoreData } from '../types/types'; // 导入 StoreData 类型
import defaultsDeep from 'lodash.defaultsdeep'; // 导入 lodash 的 defaultsDeep 函数

export class Store {
  store: StoreData; // 存储数据的属性

  // 构造函数，初始化 store 属性
  constructor(defaults: StoreData) {
    // 从 localStorage 中获取存储的数据
    const store = localStorage.getItem('via-app-store');
    
    // 如果 store 存在，则将其与 defaults 合并，否则使用 defaults
    
    this.store = store ? defaultsDeep(JSON.parse(store), defaults) : defaults;
  }

  // 获取存储中的数据
  get<K extends keyof StoreData>(key: K): StoreData[K] {
    return this.store[key];
  }

  // 设置存储中的数据
  set<K extends keyof StoreData>(key: K, value: StoreData[K]) {
    // 创建新的存储数据对象，其中包含更新后的键值对
    const newStoreData = {
      ...this.store,
      [key]: { ...value },
    };
    
    // 更新 store 属性
    this.store = newStoreData;

    // 使用 setTimeout 将数据保存到 localStorage
    // 将保存操作延迟到当前事件循环结束后执行，避免 JSON.stringify 在异步函数内触发错误
    setTimeout(() => {
      localStorage.setItem('via-app-store', JSON.stringify(newStoreData));
    }, 0);
  }
}
