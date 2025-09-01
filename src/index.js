import { ErrorTracker } from "./core/error";
import { Report } from "./utils/report";
import { getDeviceInfo } from "./utils/helper";

export default class ErrorMonitor {

	constructor(options = {}) {
		this.options = {
			dsn: '', // 数据接受地址
			appId: '', // 应用id
			enablePerformance: true, // 是否开启性能监控
			enableXHRMonitoring: true, // 是否开启请求监控
			...options
		};
		this.reporter = new Report({
			/*
				上报数据格式
			*/
			url: this.options.dsn,
		});

		this.init()
	}
	init () {
		// 初始化错误监控
		new ErrorTracker({
			onError: this.handleError.bind(this),
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
	handleError (errorData) {
		const fullData = {
			...errorData,
			appId: this.options.appId,
			deviceInfo: getDeviceInfo(),
			location: window.location.href,
			userAgent: navigator.userAgent
		};

		this.reporter.send(fullData);
	}

	initPerformance () {
		// 性能监控实现
		// ...
	}

	initXHRMonitoring () {
		// 请求监控实现
		// ...
	}
}