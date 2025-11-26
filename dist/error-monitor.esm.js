class ErrorTracker {
  constructor(options) {
    this.options = options;
    this.initErrorTracking();
  }
  initErrorTracking() {
    // 1. 捕捉常规js错误
    window.addEventListener("error", this.handleWindowError.bind(this), true);

    // 2. 捕捉未处理的 Promise rejection
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection.bind(this), true);

    // 3. 捕捉 console.error()
    if (this.options.consoleError) {
      this.overrideConsoleError();
    }
  }
  // 1.2 捕捉常规js错误
  handleWindowError(event) {
    const errorData = {
      type: 'window_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    };
    this.options.onError(errorData);
  }

  // 2.2 捕捉未处理的 Promise rejection
  handleUnhandledRejection(event) {
    const errorData = {
      type: 'unhandled_rejection',
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString()
    };
    this.options.onError(errorData);
  }

  // 3.2 覆盖 console.error()
  overrideConsoleError() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      const errorData = {
        type: 'console_error',
        messages: args,
        timestamp: new Date().toISOString()
      };
      this.options.onError(errorData);
    };
  }

  // 
}

class Report {
  constructor(options) {
    this.options = {
      url: '',
      // 上传log的服务器地址
      maxRetry: 3,
      // 上传错误之后,重新上传的次数,
      timeOut: 3000,
      ...options
    };
    this.queue = []; // 需要上传的队列
    this.isSending = false; // 是否在发送
  }

  // 上报数据
  send(data) {
    this.queue.push(data);
    // 如果不在发送状态，就开发发送
    if (!this.isSending) {
      this.processQueue();
    }
  }

  // 处理队列
  async processQueue() {
    if (this.queue.length === 0) {
      this.isSending = false;
      return;
    }
    this.isSending = true;
    const data = this.queue.shift();
    try {
      await this.sendRequest(data);
      this.processQueue();
    } catch (e) {
      console.error('Report Error', e);
      // 重试逻辑
      if (data.retryCount < this.options.maxRetry) {
        data.retryCount = (data.retryCount || 0) + 1;
        this.queue.unshift(data);
        let queueTimeOut = setTimeout(() => {
          clearTimeout(queueTimeOut);
          this.processQueue();
        }, 1000);
      } else {
        this.processQueue();
      }
    }
  }
  sendRequest(data) {
    return new Promise((resolve, reject) => {
      // 创建一个
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
      fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      }).then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        // 关键改动：调用 response.json() 来读取和解析响应体
        return response.json(); 
      }).then(responseData => {
        // 关键改动：将解析后的数据通过 resolve 传递出去
        resolve(responseData); 
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
}

/**
 * 获取当前设备信息
 * @returns {Object} 包含设备信息的对象
 */
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const screen = window.screen;

  // 设备类型检测
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android|Tablet/i.test(userAgent) && !isMobile;

  // 浏览器检测
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) browser = 'Firefox';else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Browser';else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) browser = 'Opera';else if (userAgent.includes('Trident/')) browser = 'IE';else if (userAgent.includes('Edge')) browser = 'Edge';else if (userAgent.includes('Chrome')) browser = 'Chrome';else if (userAgent.includes('Safari')) browser = 'Safari';

  // 操作系统检测
  let os = 'Unknown';
  if (userAgent.includes('Android')) os = 'Android';else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) os = 'iOS';else if (userAgent.includes('Windows')) os = 'Windows';else if (userAgent.includes('Mac OS X')) os = 'Mac OS';else if (userAgent.includes('Linux')) os = 'Linux';

  // 屏幕方向
  const orientation = screen.orientation ? screen.orientation.type : screen.height > screen.width ? 'portrait' : 'landscape';
  return {
    // 设备基本信息
    deviceType: isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop',
    browser: browser,
    browserVersion: userAgent.match(/(Firefox|Chrome|Safari|Opera|Edge|IE|Version)[\/\s](\d+)/i)?.[2] || 'Unknown',
    os: os,
    osVersion: userAgent.match(/(Windows NT|Android|iPhone OS|Mac OS X|Linux)[\s\/](\d+[._]\d+)/i)?.[2] || 'Unknown',
    // 屏幕信息
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    orientation: orientation,
    // 其他信息
    language: navigator.language || navigator.userLanguage || 'Unknown',
    online: navigator.onLine,
    userAgent: userAgent,
    // CPU核心数（通过逻辑处理器数估算）
    cpuCores: navigator.hardwareConcurrency || 'Unknown',
    // 内存信息（仅限部分浏览器支持）
    deviceMemory: navigator.deviceMemory || 'Unknown',
    // 触摸支持
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
}

class ErrorMonitor {
  constructor(options = {}) {
    this.options = {
      dsn: '',
      // 数据接受地址
      appId: '',
      // 应用id
      enablePerformance: true,
      // 是否开启性能监控
      enableXHRMonitoring: true,
      // 是否开启请求监控
      ...options
    };
    this.reporter = new Report({
      /*
      	上报数据格式
      */
      url: this.options.dsn
    });
    this.init();
  }
  init() {
    // 初始化错误监控
    new ErrorTracker({
      onError: this.handleError.bind(this)
    });
    // 初始化性能监控
    if (this.options.enablePerformance) {
      this.initPerformance();
    }

    // 初始化请求监控
    if (this.options.enableXHRMonitoring) {
      this.initXHRMonitoring();
    }
  }
  handleError(errorData) {
    const fullData = {
      ...errorData,
      appId: this.options.appId,
      deviceInfo: getDeviceInfo(),
      location: window.location.href,
      userAgent: navigator.userAgent
    };
    this.reporter.send(fullData);
  }
  initPerformance() {
    // 性能监控实现
    // ...
  }
  initXHRMonitoring() {
    // 请求监控实现
    // ...
  }
}

export { ErrorMonitor as default };
