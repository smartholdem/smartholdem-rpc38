
// Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const sthjs = require('sthjs');
chai.should();

chai.use(chaiHttp);

describe('Transactions', () => {

  describe('/GET transaction', () => {
    it('it should GET last account transactions on mainnet', (done) => {
      chai.request(server).
        get('/mainnet/transactions/SVx2j3NdZbDLfZ9HWS57NvqYg4c9grQLnx').
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.count.should.be.above(3);
          res.body.transactions.length.should.be.above(3);
          done();
        });
    });

    it('it should GET last account transactions on testnet', (done) => {
      chai.request(server).
        get('/testnet/transactions/Tkx2APX2LjSpkuMWTELDi5tFjQQHdbF5bw').
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.count.should.be.above(30);
          res.body.transactions.length.should.be.above(30);
          done();
        });
    });

  });

  describe('/POST transaction', () => {
    let mainnettx = null;
    it('it should create tx on mainnet and tx should verify', (done) => {
      chai.request(server).
        post('/mainnet/transaction').
        send({
          amount: 100000000,
          recipientId: "Sa9JKodiNeM7tbYjxwEhvvG1kBczhQxTN3",
          passphrase: "This is a test"
        }).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.transaction.recipientId.should.equal("SVx2j3NdZbDLfZ9HWS57NvqYg4c9grQLnx");
          mainnettx = res.body.transaction;
          sthjs.crypto.verify(mainnettx).should.be.equal(true);
          done();
        });
    });

    it('it should broadcast tx on mainnet', (done) => {
      chai.request(server).
        post('/mainnet/broadcast').
        send(mainnettx).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          done();
        });
    });

    let testnettx = null;
    it('it should create tx on testnet and tx should verify', (done) => {
      chai.request(server).
        post('/testnet/transaction').
        send({
          amount: 100000000,
          recipientId: "Tkx2APX2LjSpkuMWTELDi5tFjQQHdbF5bw",
          passphrase: "This is a test"
        }).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.transaction.recipientId.should.equal("Tkx2APX2LjSpkuMWTELDi5tFjQQHdbF5bw");
          testnettx = res.body.transaction;
          sthjs.crypto.verify(testnettx).should.be.equal(true);
          done();
        });
    });

    it('it should broadcast tx on testnet', (done) => {
      chai.request(server).
        post('/testnet/broadcast').
        send(testnettx).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          done();
        });
    });

    it('it should broadcast tx on testnet the old way', (done) => {
      chai.request(server).
        post('/testnet/broadcast').
        send({
          transactions: [testnettx]
        }).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.transactionIds[0].should.be.equal(testnettx.id);
          done();
        });
    });


  });

});