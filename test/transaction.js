
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

    it('it should GET last account transactions on devnet', (done) => {
      chai.request(server).
        get('/devnet/transactions/DDvQP9DznpeENdA7BQ6nYZgYwHmnbmWXS5').
        end((err, res) => {
          console.log('res.body.count', res.body.count);
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
          recipientId: "SgfSC4H3AViZHwf1MeXaThsvJBThwV1AS9",
          passphrase: "this is a test"
        }).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.transaction.recipientId.should.equal("SgfSC4H3AViZHwf1MeXaThsvJBThwV1AS9");
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

    let devnettx = null;
    it('it should create tx on devnet and tx should verify', (done) => {
      chai.request(server).
        post('/devnet/transaction').
        send({
          amount: 10000000,
          recipientId: "DHzPqDoCwh4CuHwtA6FBvnH3yY7sJmZ54P",
          passphrase: "this is a test"
        }).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.transaction.recipientId.should.equal("DHzPqDoCwh4CuHwtA6FBvnH3yY7sJmZ54P");
          devnettx = res.body.transaction;
          sthjs.crypto.verify(devnettx).should.be.equal(true);
          done();
        });
    });

    it('it should broadcast tx on devnet', (done) => {
      chai.request(server).
        post('/devnet/broadcast').
        send(devnettx).
        end((err, res) => {
          console.log(res.body);
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          done();
        });
    });

    it('it should broadcast tx on devnet the old way', (done) => {
      chai.request(server).
        post('/devnet/broadcast').
        send({
          transactions: [devnettx]
        }).
        end((err, res) => {
          res.should.have.status(200);
          res.body.success.should.be.equal(true);
          res.body.transactionIds[0].should.be.equal(devnettx.id);
          done();
        });
    });


  });

});
