// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const sthjs = require('sthjs');
const bip39 = require('bip39');

chai.should();
chai.use(chaiHttp);

describe('Accounts', () => {

  describe('/GET account', () => {
    it('it should GET account with a given address on mainnet', (done) => {
      chai.request(server).
      get('/mainnet/account/SVx2j3NdZbDLfZ9HWS57NvqYg4c9grQLnx').
      end((err, res) => {
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.account.address.should.be.equal("SVx2j3NdZbDLfZ9HWS57NvqYg4c9grQLnx");
        done();
      });
    });

    it('it should GET account with a given address on testnet', (done) => {
      chai.request(server).
      get('/testnet/account/Tkx2APX2LjSpkuMWTELDi5tFjQQHdbF5bw').
      end((err, res) => {
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.account.address.should.be.equal("Tkx2APX2LjSpkuMWTELDi5tFjQQHdbF5bw");
        done();
      });
    });

    // it('STRESSTEST: it should GET 50000 accounts on testnet', (done) => {
    //   for(var i=0; i<50000; i++){
    //     var address = sthjs.crypto.getKeys(bip39.generateMnemonic()).getAddress();
    //     chai.request(server).
    //     get('/testnet/account/'+address).
    //     end((err, res) => {
    //       res.should.have.status(200);
    //       res.body.success.should.be.equal(true);
    //       res.body.account.address.should.be.equal(address);
    //       done();
    //     });
    //   }
      
    // });
  });

  describe('/POST account', () => {
    it('it should create an account on mainnet', (done) => {
      chai.request(server).
      post('/mainnet/account').
      send({
        passphrase: "this is a test"
      }).
      end((err, res) => {
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.account.address.should.be.equal("Sa9JKodiNeM7tbYjxwEhvvG1kBczhQxTN3");
        res.body.account.publicKey.should.be.equal("03675c61dcc23eab75f9948c6510b54d34fced4a73d3c9f2132c76a29750e7a614");
        done();
      });
    });

    var bip38address = null;
    var bip38backup = null;
    var userid = require('crypto').randomBytes(32).toString("hex");
    console.log(userid);

    it('it should create an account on mainnet using bip38 encryption', (done) => {
      chai.request(server).
      post('/mainnet/account/bip38').
      send({
        bip38: "master password",
        userid
      }).
      end((err, res) => {
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.should.have.property('address');
        res.body.should.have.property('wif');
        bip38address = res.body.address;
        bip38backup = res.body.wif;
        done();
      });
    });

    it('it should find bip38 backup from userid', (done) => {
      chai.request(server).
      get(`/mainnet/account/bip38/${userid}`).
      end((err, res) => {
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.should.have.property('wif');
        bip38backup = res.body.wif.should.equal(bip38backup);
        done();
      });
    });

    it('it should create transaction from bip38 backup using userid', (done) => {
      chai.request(server).
      post('/mainnet/transaction/bip38').
      send({
        bip38: "master password",
        userid,
        amount: 1000000000,
        recipientId: "Sa9JKodiNeM7tbYjxwEhvvG1kBczhQxTN3"
      }).
      end((err, res) => {
        process.stdout.write(".");
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.transaction.recipientId.should.equal("Sa9JKodiNeM7tbYjxwEhvvG1kBczhQxTN3");
        sthjs.crypto.verify(res.body.transaction).should.be.equal(true);
        done();
      });
    });

    it('it should create an account on testnet', (done) => {
      chai.request(server).
      post('/testnet/account').
      send({
        passphrase: "this is a test"
      }).
      end((err, res) => {
        res.should.have.status(200);
        res.body.success.should.be.equal(true);
        res.body.account.address.should.be.equal("TnA7H8XaWBjkLty13CEfPJ5NdhPprxGKnP");
        res.body.account.publicKey.should.be.equal("03675c61dcc23eab75f9948c6510b54d34fced4a73d3c9f2132c76a29750e7a614");
        done();
      });
    });
  });

});