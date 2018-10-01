[![Build Status](https://travis-ci.org/smartholdem/smartholdem-rpc.svg?branch=master)](https://travis-ci.org/smartholdem/smartholdem-rpc)
# RPC server implementation to easily connect to SmartHoldem Platform

# Security Warning
All calls should be made from the server where RPC is running at ( i.e., `localhost` or `127.0.0.1` ). The RPC server should never be publicly accessible. If you wish to access smartholdem-rpc from a remote address, you can whitelist the address with `--allow <address>`. Addresses allow you to use wildcards, eg. `192.168.1.*` or `10.0.*.*`.

If you do want to allow access from all remotes, start smartholdem-rpc with the `--allow-remote` commandline switch. This can be dangerous.

# How To Use It
- install Node.JS ( https://nodejs.org/en/download/package-manager/)
- install forever `npm install -g forever`
- install smartholdem-rpc:
> `git clone https://github.com/smartholdem/smartholdem-rpc.git`
> `cd smartholdem-rpc`
> `npm install`

- start RPC server: `smartholdem-rpc --port 8000` (default port is 8282)
- or forever start server

## API
Supported networks are `mainnet` and `testnet` all calls should start with the network you want to address, for instance,  `/mainnet/account/SVx2j3NdZbDLfZ9HWS57NvqYg4c9grQLnx` we call it `:network` in the API description.

## Accounts
- Get account balance from `address`: `GET /:network/account/:address`
- Create account from `passphrase`: `POST /:network/account` params: `passphrase`
- Create (or get if already existing) account and encrypt using bip38: `POST /:network/account/bip38` params: `bip38` (password for encrypted WIF), `userid` (to identify a user)
- Get backup from `userid`: `GET /:network/account/bip38/:userid`
- Generate BIP39 accounts: `GET /:network/account/generate/:count`

If you want to create several accounts for one user, you need to use a different userid.

## Transactions
- Get last 50 transactions from `address`: `GET /:network/transactions/:address`
- Create a transaction: `POST /:network/transaction` params: `recipientId`, `amount` in satoshis, `passphrase`
- Create a transaction using `bip38` for `userid`: `POST /:network/transaction/bip38` params: `recipientId`, `amount` in satoshis, `bip38` (password to encode wif), `userid`
- Broadcast transaction: `POST /:network/broadcast` params: `id` of the transaction

Note that if the transaction has been created via the RPC it has been stored internally, as such only the transaction `id` is needed to broadcast/rebroadcast it. Otherwise if created outside of this RPC server, pass the whole transaction body as the POST payload.


