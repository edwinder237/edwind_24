class EmailQueue {
  constructor(rateLimit = 2, rateLimitWindow = 1000) {
    this.queue = [];
    this.processing = false;
    this.rateLimit = rateLimit;
    this.rateLimitWindow = rateLimitWindow;
    this.requestsInWindow = 0;
    this.windowStartTime = Date.now();
  }

  async add(emailTask) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task: emailTask, resolve, reject });
      if (!this.processing) {
        this.process();
      }
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const currentTime = Date.now();
      
      if (currentTime - this.windowStartTime >= this.rateLimitWindow) {
        this.requestsInWindow = 0;
        this.windowStartTime = currentTime;
      }

      if (this.requestsInWindow >= this.rateLimit) {
        const waitTime = this.rateLimitWindow - (currentTime - this.windowStartTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const { task, resolve, reject } = this.queue.shift();

      try {
        const result = await task();
        this.requestsInWindow++;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }
}

const emailQueue = new EmailQueue(2, 1000);

export default emailQueue;