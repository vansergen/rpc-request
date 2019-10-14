import * as request from 'request-promise-native';

export type RPCOtpions = request.RequestPromiseOptions | request.Options;

export class RPC {
  _rpoptions: RPCOtpions;
  /**
   * @params {Object} [options]
   */
  constructor(options: RPCOtpions = {}) {
    this._rpoptions = options;
  }

  /**
   * @params {Object} [options]
   */
  async get(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'GET' });
  }

  /**
   * @params {Object} [options]
   */
  async post(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'POST' });
  }

  /**
   * @params {Object} [options]
   */
  async put(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'PUT' });
  }

  /**
   * @params {Object} [options]
   */
  async patch(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'PATCH' });
  }

  /**
   * @params {Object} [options]
   */
  async delete(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'DELETE' });
  }

  /**
   * @params {Object} [options]
   */
  async head(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'HEAD' });
  }

  /**
   * @params {Object} [options]
   */
  async options(options: RPCOtpions = {}) {
    return this.request({ ...options, method: 'OPTIONS' });
  }

  /**
   * @params {Object} [options]
   */
  async request(options: RPCOtpions = {}) {
    return this.defaults(RPC.prepareOptions(options, this._rpoptions));
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
   * @params {Object} [options]
   */
  static defaults(
    options: request.RequestPromiseOptions = {}
  ): request.RequestPromiseAPI {
    return request.defaults(options);
  }

  /**
   * @params {Object} options
   * @params {Object} rpoptions
   */
  static prepareOptions(
    options: RPCOtpions,
    rpoptions: RPCOtpions
  ): request.Options {
    if (!('url' in options || 'uri' in options)) {
      if (!('url' in rpoptions || 'uri' in rpoptions)) {
        throw new Error('options.uri is a required argument');
      }
      if ('uri' in rpoptions) {
        return { ...options, uri: rpoptions.uri };
      }
      return { ...options, uri: rpoptions.url };
    }
    return options;
  }

  get defaults(): request.RequestPromiseAPI {
    return RPC.defaults(this._rpoptions);
  }
}
