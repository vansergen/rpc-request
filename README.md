# rpc-request

## Installation

```bash
npm install rpc-request
```

## Usage

```javascript
const url = 'http://localhost';
const port = 8332;
const user = 'rpcuser';
const pass = 'rpcpass';
const timeout = 12000;
const type = 'text/plain';

const Client = require('rpc-request');
const client = new Client({ url, port, user, pass, timeout, type });
```

- `request`

```javascript
const method = 'getnewaddress';
const label = 'SomeLabel';
const address_type = 'bech32';
const params = [label, address_type];
const jsonrpc = '1.0';
const id = 'rpc-request';

await client.request({ method, label, address_type, params, jsonrpc, id });
```
