const request = require('request');
const async = require('async');
const sthjs = require('sthjs');

var network = null,
    server = null;

const networks = {
    devnet: {
        name: "devnet",
        nethash: "3a6d2bec6798dedea99a1e6c64120a3876781b85e46bb75908aba07ffda61360",
        slip44: 1,
        version: 30,
        peers: [
            "88.198.67.196:6101",
            "80.211.38.83:6101",
            "213.239.207.170:6101"
        ]
    },
    mainnet: {
        name: "mainnet",
        nethash: "fc46bfaf9379121dd6b09f5014595c7b7bd52a0a6d57c5aff790b42a73c76da7",
        slip44: 255,
        version: 63,
        peers: [
            "88.198.67.196:6100",
            "213.239.207.170:6100",
            "194.87.146.50:6100",
            "195.133.144.10:6100",
            "194.87.146.109:6100"
        ]
    }
};

function getFromNode(url, cb) {

    let nethash = network ? network.nethash : "";

    if (!url.startsWith("http")) {
        url = `http://${server}${url}`;
    }
    request(
        {
            url,
            headers: {
                nethash,
                version: '1.0.0',
                port: 1
            },
            timeout: 5000
        },
        function (error, response, body) {
            if (error) {
                server = network.peers[Math.floor(Math.random() * 1000) % network.peers.length];
            }
            cb(error, response, body);
        }
    );
}

function findEnabledPeers(cb) {
    let peers = [];
    getFromNode('/peer/list', function (err, response, body) {
        if (err || body === "undefined") {
            cb(peers);
        }
        var respeers = JSON.parse(body).peers.filter(function (peer) {
            return peer.status === "OK";
        }).map(function (peer) {
            return `${peer.ip}:${peer.port}`;
        });
        async.each(respeers, function (peer, eachcb) {
            getFromNode(`http://${peer}/api/blocks/getHeight`, function (error, res, body2) {
                if (!error && body2 !== "Forbidden") {
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
                version: '1.0.0',
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
    network.peers.slice(0, 10).forEach(function (peer) {
        // Console.log("sending to", peer);
        request({
            url: `http://${peer}/peer/transactions`,
            headers: {
                nethash: network.nethash,
                version: '1.0.0',
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
    console.log('connect2network', server);
    findEnabledPeers(function (peers) {
        if (peers.length > 0) {
            // console.log(peers);
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
    if (!server || !network || network.name !== req.params.network) {
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
