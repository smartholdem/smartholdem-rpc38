var request = require('request');
var async = require('async');
var sthjs = require('sthjs');

var network = null,
    server = null;

var networks = {
    testnet: {
        name: "testnet",
        nethash: "e1882350a56f22a79d62b903dc2d0fc03c6aae88c6f09908ee3e2d6f1da7e2b3",
        slip44: 186,
        version: 66,
        peers: [
            "195.133.197.97:4100",
            "195.133.147.131:4100",
        ]
    },
    mainnet: {
        name: "mainnet",
        nethash: "fc46bfaf9379121dd6b09f5014595c7b7bd52a0a6d57c5aff790b42a73c76da7",
        slip44: 255,
        version: 63,
        peers: [
            "88.198.67.196:6100",
            "195.133.197.97:6100",
            "194.87.109.123:6100",
            "195.133.144.144:6100",
            "194.87.146.50:6100",
            "195.133.197.108:6100",
            "195.133.147.131:6100",
            "194.87.145.149:6100"
        ]
    }
};



function getFromNode(url, cb) {
    var nethash = network ? network.nethash : "";
    if (!url.startsWith("http")) {
        url = `http://${server}${url}`;
    }
    request(
        {
            url,
            headers: {
                nethash,
                version: '0.0.2',
                port: 1
            },
            timeout: 5000
        },
        function(error, response, body){
            if(error){
                server = network.peers[Math.floor(Math.random() * 1000) % network.peers.length];
            }
            cb(error, response, body);
        }
    );
}

function findEnabledPeers(cb) {
    var peers = [];
    getFromNode('/peer/list', function (err, response, body) {
        if (err || body == "undefined") {
            cb(peers);
        }
        var respeers = JSON.parse(body).peers.
        filter(function (peer) {
            return peer.status == "OK";
        }).
        map(function (peer) {
            return `${peer.ip}:${peer.port}`;
        });
        async.each(respeers, function (peer, eachcb) {
            getFromNode(`http://${peer}/api/blocks/getHeight`, function (error, res, body2) {
                if (!error && body2 != "Forbidden") {
                    peers.push(peer);
                }
                eachcb();
            });
        }, function (error) {
            if (error) return cb(error);

            return cb(peers);
        });

    });
}

function postTransaction(transaction, cb) {
    request(
        {
            url: `http://${server}/peer/transactions`,
            headers: {
                nethash: network.nethash,
                version: '0.0.2',
                port: 1
            },
            method: 'POST',
            json: true,
            body: {transactions: [transaction]}
        },
        cb
    );
}

function broadcast(transaction, callback) {
    network.peers.slice(0, 7).forEach(function (peer) {
        Console.log("sending to", peer);
        request({
            url: `http://${peer}/peer/transactions`,
            headers: {
                nethash: network.nethash,
                version: '0.0.2',
                port: 1
            },
            method: 'POST',
            json: true,
            body: {transactions: [transaction]}
        });
    });
    callback();
}


function connect2network(netw, callback) {
    network = netw;
    server = netw.peers[Math.floor(Math.random() * 1000) % netw.peers.length];
    findEnabledPeers(function (peers) {
        if (peers.length > 0) {
            [server] = peers;
            netw.peers = peers;
        }
        callback();
    });
    getFromNode('/api/loader/autoconfigure', function (err, response, body) {
        if (err) return;
        if (!body || !body.startsWith("{"))
            connect2network(netw, callback);
        else {
            netw.config = JSON.parse(body).network;
        }
    });
}

function connect(req, res, next) {
    if (!server || !network || network.name != req.params.network) {
        if (networks[req.params.network]) {
            sthjs.crypto.setNetworkVersion(networks[req.params.network].version);
            connect2network(networks[req.params.network], next);
        } else {
            res.send({
                success: false,
                error: `Could not find network ${req.params.network}`
            });
            res.end();
        }
    } else {
        next();
    }
}


module.exports = {
    broadcast,
    connect,
    getFromNode,
    postTransaction
};