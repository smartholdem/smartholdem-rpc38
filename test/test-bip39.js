const sth = require("sthjs");
const bip39 = require("bip39");
sth.crypto.setNetworkVersion(0x1e); //set net version: 0x1e - devnet

let countAddrs = 10;


for (let i=0; i < countAddrs; i++) {
    let PASSPHRASE = bip39.generateMnemonic();
    let PUB_KEY = sth.crypto.getKeys(PASSPHRASE).publicKey;
    let ADDR = sth.crypto.getAddress(PUB_KEY);

    console.log('PASSPHRASE:', PASSPHRASE);
    console.log('PUB_KEY:', PUB_KEY);
    console.log('ADDR:', ADDR);
    console.log('-------:');
}
