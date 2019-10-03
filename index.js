let request = require('request-promise-native');

class Client {
  /**
   * @params {Object} [options={}]
   */
  constructor({ ...options } = {}) {
    request = request.defaults(options);
  }

  /**
   * @params {Object} [options={}]
   */
  async get({ ...options } = {}) {
    return this.request({ ...options, method: 'GET' });
  }

  /**
   * @params {Object} [options={}]
   */
  async post({ ...options } = {}) {
    return this.request({ ...options, method: 'POST' });
  }

  /**
   * @params {Object} [options={}]
   */
  async put({ ...options } = {}) {
    return this.request({ ...options, method: 'PUT' });
  }

  /**
   * @params {Object} [options={}]
   */
  async patch({ ...options } = {}) {
    return this.request({ ...options, method: 'PATCH' });
  }

  /**
   * @params {Object} [options={}]
   */
  async delete({ ...options } = {}) {
    return this.request({ ...options, method: 'DELETE' });
  }

  /**
   * @params {Object} [options={}]
   */
  async head({ ...options } = {}) {
    return this.request({ ...options, method: 'HEAD' });
  }

  async options({ ...options } = {}) {
    return this.request({ ...options, method: 'OPTIONS' });
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
   * @param cookieStore
   */
  static jar(cookieStore) {
    return request.jar(cookieStore);
  }
}

module.exports = Client;
