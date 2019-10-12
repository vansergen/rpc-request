import * as request from 'request-promise-native';

export class RPC {
  _rpoptions: request.RequestPromiseOptions;
  /**
   * @params {Object} [options]
   */
  constructor({ ...options }: request.RequestPromiseOptions) {
    this._rpoptions = options;
  }

  /**
   * @params {Object} options
   */
  async get({ ...options }: request.Options) {
    return this.request({ ...options, method: 'GET' });
  }

  /**
   * @params {Object} options
   */
  async post({ ...options }: request.Options) {
    return this.request({ ...options, method: 'POST' });
  }

  /**
   * @params {Object} options
   */
  async put({ ...options }: request.Options) {
    return this.request({ ...options, method: 'PUT' });
  }

  /**
   * @params {Object} options
   */
  async patch({ ...options }: request.Options) {
    return this.request({ ...options, method: 'PATCH' });
  }

  /**
   * @params {Object} options
   */
  async delete({ ...options }: request.Options) {
    return this.request({ ...options, method: 'DELETE' });
  }

  /**
   * @params {Object} options
   */
  async head({ ...options }: request.Options) {
    return this.request({ ...options, method: 'HEAD' });
  }

  /**
   * @params {Object} options
   */
  async options({ ...options }: request.Options) {
    return this.request({ ...options, method: 'OPTIONS' });
  }

  /**
   * @params {Object} options
   */
  async request({ ...options }: request.Options) {
    return this.defaults(options);
  }

  /**
   * @param {string} key
   * @param {string} value
   * @description Create a new cookie.
   */
  static cookie(key: string, value: string) {
    return request.cookie(key + '=' + value);
  }

  /**
   * @description Create a new cookie jar.
   * @param [cookieStore]
   */
  static jar(cookieStore?: any) {
    return request.jar(cookieStore);
  }

  /**
   * @params {Object} options
   */
  static defaults(
    options: request.RequestPromiseOptions
  ): request.RequestPromiseAPI {
    return request.defaults(options);
  }

  get defaults(): request.RequestPromiseAPI {
    return RPC.defaults(this._rpoptions);
  }
}
