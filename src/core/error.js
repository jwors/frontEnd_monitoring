export class ErrorTracker {
	constructor(options) { 
		this.options = options;
		this.initErrorTracking();
	}

	initErrorTracking () { 
		// 1. 捕捉常规js错误
		window.addEventListener("error",this.handleWindowError.bind(this),true)
		
		// 2. 捕捉未处理的 Promise rejection
		window.addEventListener("unhandledrejection",this.handleUnhandledRejection.bind(this),true)
	
		// 3. 捕捉 console.error()
		if (this.options.consoleError) { 
			this.overrideConsoleError()
		}
	}
	// 1.2 捕捉常规js错误
	handleWindowError (event) { 
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
	handleUnhandledRejection (event) { 
		const errorData = {
      type: 'unhandled_rejection',
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString()
    };
    
    this.options.onError(errorData);
	}

	// 3.2 覆盖 console.error()
	overrideConsoleError () { 
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