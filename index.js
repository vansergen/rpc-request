let request = require('request-promise-native');

class Client {
  /**
   * @params {Object} [options={}]
   */
  constructor({ ...options } = {}) {
    request = request.defaults(options);
  }

  /**
   * @params {Object} options
   */
  async request(options) {
    return request(options);
  }

  /**
   * @param {string} key
   * @param {string} value
   * @description Create a new cookie.
   */
  static cookie(key, value) {
    return request.cookie(key + '=' + value);
  }

  /**
   * @description Create a new cookie jar.
   */
  static jar() {
    return request.jar();
  }
}

module.exports = Client;
