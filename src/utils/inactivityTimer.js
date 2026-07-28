export class InactivityTimer {
  constructor(timeout, onTimeout) {
    this.timeout = timeout;
    this.onTimeout = onTimeout;
    this.timer = null;
    this.events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    this.resetTimer = this.resetTimer.bind(this);
  }

  start() {
    this.events.forEach(event => {
      document.addEventListener(event, this.resetTimer, true);
    });
    this.resetTimer();
  }

  stop() {
    this.events.forEach(event => {
      document.removeEventListener(event, this.resetTimer, true);
    });
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  resetTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(this.onTimeout, this.timeout);
  }
}
