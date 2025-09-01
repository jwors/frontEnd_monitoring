# 前端监控系统时序图

## 系统架构概述

这是一个前端错误收集监控系统，主要包含以下组件：

- **ErrorMonitor**: 主监控类，负责初始化和协调各个模块
- **ErrorTracker**: 错误追踪器，负责捕获各种类型的错误
- **Report**: 错误上报器，负责将错误数据发送到服务器
- **Helper**: 辅助工具，负责获取设备信息

## 时序图

```mermaid
sequenceDiagram
    participant User as 用户/浏览器
    participant EM as ErrorMonitor
    participant ET as ErrorTracker
    participant R as Report
    participant H as Helper
    participant Server as 服务器

    Note over User,Server: 1. 系统初始化阶段
    User->>EM: new ErrorMonitor(options)
    EM->>EM: 设置配置项(dsn, appId等)
    EM->>R: new Report({url: dsn})
    R->>R: 初始化队列和发送状态
    EM->>EM: init()
    EM->>ET: new ErrorTracker({onError})
    ET->>ET: initErrorTracking()
    ET->>User: addEventListener('error')
    ET->>User: addEventListener('unhandledrejection')
    opt 启用console错误监控
        ET->>ET: overrideConsoleError()
    end
    opt 启用性能监控
        EM->>EM: initPerformance()
    end
    opt 启用XHR监控
        EM->>EM: initXHRMonitoring()
    end

    Note over User,Server: 2. 错误捕获阶段
    alt JavaScript运行时错误
        User->>ET: window.error事件触发
        ET->>ET: handleWindowError()
        ET->>ET: 构造errorData{type:'window_error'}
    else Promise未处理拒绝
        User->>ET: unhandledrejection事件触发
        ET->>ET: handleUnhandledRejection()
        ET->>ET: 构造errorData{type:'unhandled_rejection'}
    else Console错误
        User->>ET: console.error()调用
        ET->>ET: overrideConsoleError触发
        ET->>ET: 构造errorData{type:'console_error'}
    end

    Note over User,Server: 3. 错误处理阶段
    ET->>EM: onError(errorData)回调
    EM->>EM: handleError(errorData)
    EM->>H: getDeviceInfo()
    H->>H: 检测设备类型、浏览器、操作系统等
    H->>EM: 返回设备信息
    EM->>EM: 构造完整错误数据
    Note right of EM: 包含：错误信息+appId+设备信息+位置+userAgent
    EM->>R: reporter.send(fullData)

    Note over User,Server: 4. 错误上报阶段
    R->>R: 将数据加入队列
    alt 当前未在发送
        R->>R: processQueue()
        R->>R: 设置isSending=true
        R->>R: 从队列取出数据
        R->>R: sendRequest(data)
        R->>Server: fetch POST请求
        alt 请求成功
            Server->>R: 响应成功
            R->>R: 继续处理队列
        else 请求失败
            Server->>R: 响应失败/超时
            R->>R: 检查重试次数
            alt 未达到最大重试次数
                R->>R: 重新加入队列头部
                R->>R: 延时1秒后重试
            else 达到最大重试次数
                R->>R: 放弃该数据，继续处理队列
            end
        end
    else 当前正在发送
        Note right of R: 数据加入队列等待
    end

    Note over User,Server: 5. 队列处理循环
    loop 直到队列为空
        R->>R: processQueue()
        R->>Server: 发送下一个错误数据
    end
    R->>R: 设置isSending=false
```

## 关键流程说明

### 1. 初始化流程

- 用户创建ErrorMonitor实例并传入配置
- 系统初始化Report实例用于错误上报
- 创建ErrorTracker实例并绑定错误处理回调
- ErrorTracker注册各种错误监听器
- 根据配置启用性能监控和XHR监控

### 2. 错误捕获机制

- **JavaScript错误**: 通过window.error事件捕获
- **Promise拒绝**: 通过unhandledrejection事件捕获
- **Console错误**: 通过重写console.error方法捕获

### 3. 错误数据增强

- 原始错误信息 + 应用ID + 设备信息 + 页面位置 + 用户代理
- 设备信息包括：设备类型、浏览器、操作系统、屏幕信息等

### 4. 可靠的错误上报

- 队列机制确保错误按顺序上报
- 重试机制处理网络失败情况
- 超时控制避免长时间等待
- 并发控制确保同时只有一个请求在发送

### 5. 容错设计

- 最大重试次数限制避免无限重试
- 队列机制确保错误不丢失
- 异步处理不阻塞主线程

## 技术特点

1. **全面的错误捕获**: 覆盖JavaScript错误、Promise拒绝、Console错误
2. **丰富的上下文信息**: 自动收集设备、浏览器、页面等环境信息
3. **可靠的数据传输**: 队列+重试机制确保数据可靠上报
4. **模块化设计**: 各组件职责清晰，易于维护和扩展
5. **配置灵活**: 支持自定义DSN、应用ID等配置项
