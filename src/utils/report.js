export class Report { 
	constructor(options) { 
		this.options = {
			url: '', // 上传log的服务器地址
			maxRetry: 3, // 上传错误之后,重新上传的次数,
			timeOut: 3000,
			...options
		}
		this.queue = []; // 需要上传的队列
		this.isSending = false; // 是否在发送
	}

	send (data) { 
		this.queue.push(data);
		// 如果不在发送状态，就开发发送
		if (!this.isSending) { 

		}
	}

	async processQueue () { 
		if (this.queue.length === 0) { 
			this.isSending = false;
			return
		}
		this.isSending = true;
		const data = this.queue.shift();
		try { 
			await this.sendRequest(data);
			this.processQueue();
		} catch (e) { 
			console.error('Report Error',e)
	   // 重试逻辑
		 if (data.retryCount < this.options.maxRetry) {
			data.retryCount = (data.retryCount || 0) + 1;
			this.queue.unshift(data);
			 let queueTimeOut = setTimeout(() => {
				 clearTimeout(queueTimeOut)
				 this.processQueue()
			 }, 1000);
		} else {
			this.processQueue();
		}
		}
	}

	sendRequest (data) { 
		return new Promise((resolve, reject) => { 
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				this.options.timeout
			);
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
				resolve()
			}).catch(error => {
				clearTimeout(timeoutId);
				reject(error);
			})
		})
	}
}