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
  const isDesktop = !isMobile && !isTablet;
  
  // 浏览器检测
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Browser';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) browser = 'Opera';
  else if (userAgent.includes('Trident/')) browser = 'IE';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  
  // 操作系统检测
  let os = 'Unknown';
  if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) os = 'iOS';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X')) os = 'Mac OS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  
  // 屏幕方向
  const orientation = screen.orientation ? screen.orientation.type : 
                     (screen.height > screen.width ? 'portrait' : 'landscape');
  
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

export {
	getDeviceInfo
}