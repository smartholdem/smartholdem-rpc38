var sthjs = require('sthjs');
var bip39 = require('bip39');
var bip38 = require('bip38');
var BigInteger = require('bigi');
var network = require('./network');
var leveldb = require('./leveldb');


function generate(req, res, next) {

    if (req.params["network"] === "devnet") {
        sthjs.crypto.setNetworkVersion(0x1e); //set net version: 0x1e - devnet
    } else {
        sthjs.crypto.setNetworkVersion(0x3f); //set net version: mainnet
    }


    let result = [];
    let count = req.params["count"];
    if (count > 1000) {
        count = 1000;
    }

    if (count < 1) {
        count = 1;
    }

    for (let i=0; i < count; i++) {
        let PASSPHRASE = bip39.generateMnemonic();
        let PUB_KEY = sthjs.crypto.getKeys(PASSPHRASE).publicKey;
        let ADDR = sthjs.crypto.getAddress(PUB_KEY);

        result.push({
            "address": ADDR,
            "pubkey": PUB_KEY,
            "pass": PASSPHRASE
        });

    }

    res.json(result);
    // res.send(result);
    next();
}

function get(req, res, next) {
  network.getFromNode(`/api/accounts?address=${req.params.address}`, function (err, response, body) {
    if(err) next();
    else {
      body = JSON.parse(body);
      res.send(body);
      next();
    }
  });
}

function getTransactions(req, res, next) {
  const offset = req.query.offset || 0;
  network.getFromNode(`/api/transactions?offset=${offset}&orderBy=timestamp:desc&senderId=${req.params.address}&recipientId=${req.params.address}`, function(err, response, body) {
    if(err) next();
    else {
      body = JSON.parse(body);
      res.send(body);
      next();
    }
  });
}

function getBip38Account(req, res, next){
  leveldb.
    getUTF8(sthjs.crypto.sha256(Buffer.from(req.params.userid)).toString('hex')).
    then(function(wif){
      res.send({
        success: true,
        wif
      });
      next();
    }).
    catch(function (err) {
      res.send({
        success: false,
        err
      });
      next();
    });
}

function getBip38Keys(userid, bip38password){
  return leveldb.
    getUTF8(sthjs.crypto.sha256(Buffer.from(userid)).toString('hex')).
    then(function(wif){
      if(wif){
        var decrypted = bip38.decrypt(wif.toString('hex'), bip38password + userid);
        var keys = new sthjs.ECPair(BigInteger.fromBuffer(decrypted.privateKey), null);

        return Promise.resolve({
          keys,
          wif
        });
      }

      return Promise.reject(new Error("Could not founf WIF"));
    });
}

function createBip38(req, res, next) {
  var keys = null;
  // console.log(req.params);
  if(req.params.bip38 && req.params.userid){
    getBip38Keys(req.params.userid, req.params.bip38).
      catch(function(){
        keys = sthjs.crypto.getKeys(bip39.generateMnemonic());
        var encryptedWif = bip38.encrypt(keys.d.toBuffer(32), true, req.params.bip38 + req.params.userid);
        leveldb.setUTF8(sthjs.crypto.sha256(Buffer.from(req.params.userid)).toString("hex"), encryptedWif);

        return Promise.resolve({
          keys,
          wif: encryptedWif
        });
      }).
      then(function(account){
        res.send({
          success: true,
          publicKey: account.keys.getPublicKeyBuffer().toString("hex"),
          address: account.keys.getAddress(),
          wif: account.wif
        });
        next();
      }).
      catch(function (err) {
        if(err){
          res.send({
            success: false,
            err
          });
        }
        next();
      });
  } else {
    res.send({
      success: false,
      err: "Wrong parameters"
    });
    next();
  }
}

function create(req, res, next) {
  let account = null;
  if(req.params.passphrase){
    account = sthjs.crypto.getKeys(req.params.passphrase);
    res.send({
      success: true,
      account: {
        publicKey: account.publicKey,
        address: sthjs.crypto.getAddress(account.publicKey)
      }
    });
    next();
  } else {
    res.send({
      success: false,
      err: "Wrong parameters"
    });
    next();
  }
}

module.exports = {
  generate,
  get,
  getBip38Account,
  getBip38Keys,
  getTransactions,
  create,
  createBip38
};
