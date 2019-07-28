const request = require('request-promise-native');

class Client {
  /**
   * @params {Object} options
   * @params {string} options.url
   * @params {number} options.port
   * @params {string} options.user
   * @params {string} options.pass
   * @params {number} [options.timeout=10000]
   * @params {string} [options.type='text/plain']
   */
  constructor({
    url,
    port,
    user,
    pass,
    timeout = 10000,
    type = 'text/plain'
  } = {}) {
    this.url = url;
    this.port = port;
    this.user = user;
    this.pass = pass;
    this.timeout = timeout;
    this.type = type;
  }

  /**
   * @params {Object} options
   */
  async request(options) {
    return await request({
      uri: this.url + ':' + this.port + '/',
      method: 'POST',
      headers: { 'content-type': this.type },
      auth: { user: this.user, pass: this.pass },
      timeout: this.timeout,
      body: JSON.stringify(options)
    });
  }
}

module.exports = Client;
