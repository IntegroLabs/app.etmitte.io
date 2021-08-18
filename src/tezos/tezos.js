import { BeaconWallet } from '@taquito/beacon-wallet';
import { TezosToolkit } from '@taquito/taquito';
//import { hex2buf } from '@taquito/utils';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';
//import { TaquitoTezosDomainsClient } from '@taquito/michelson-encoder';
import { tzip12 } from '@taquito/tzip12';
//import { tzip16 } from '@taquito/tzip16';
import axios from 'axios';

const applied = "applied";

const Tzip12Module = require('@taquito/tzip12').Tzip12Module;
const Tzip16Module = require('@taquito/tzip16').Tzip16Module;

const tezos = new TezosToolkit(process.env.VUE_APP_TEZOS_RPC_URL);

tezos.addExtension(new Tzip12Module());
tezos.addExtension(new Tzip16Module());

const contractAddress = process.env.VUE_APP_TEDDY_MESSENGER;
const unstakeWrapper = process.env.VUE_APP_TEDDY_UNSTAKEWRAPPER;
const networkName = process.env.VUE_APP_TEZOS_NETWORK;

const wallet = new BeaconWallet({
  name: process.env.VUE_APP_TEZOS_DAPP_NAME,
  preferredNetwork: networkName,
  colorMode: 'dark'
});

//tezos.setWalletProvider(wallet);
tezos.setProvider({ wallet });

const tezdomainClient = new TaquitoTezosDomainsClient({ tezos, network: process.env.VUE_APP_TEZOS_NETWORK, caching: { enabled: true } });

const network = {
  type: process.env.VUE_APP_TEZOS_NETWORK,
  rpcUrl: process.env.VUE_APP_TEZOS_RPC_URL
};

const clearActiveAccount = () => {
  wallet.clearActiveAccount();
};

const disconnect = () => {
  wallet.disconnect();
};

const getActiveAccount = async () => {
  return await wallet.client.getActiveAccount();
};

const getNetworkPermission = async () => {
  var activeAccount = await getActiveAccount();

  if (!activeAccount) {
    await wallet.requestPermissions({network});
    activeAccount = getActiveAccount();
  }

  return activeAccount;
}

const getTezDomain = async(address) => {
  if (!address) {
    return;
  }

  var domain = await tezdomainClient.resolver.resolveAddressToName(address);
  return domain;
}

const sendMessage = async(recipients, subject, body) => {
  getNetworkPermission();
  var to = recipients.split(',');

  console.log(to, subject, body);

  const userAddress = await wallet.getPKH();

  console.log(userAddress);

  tezos.wallet
  .at(contractAddress)
  .then((sc) => sc.methods.entrypoint_0(to, subject, body).send({ amount: 30000, mutez: true }))
  .then((op) => {
    console.log(`Awaiting for ${op.opHash} to be confirmed...`);
    return op.opHash;
  })
  .then((hash) => {
    console.log(`Operation injected: https://edo.tzstats.com/${hash}`)

  })
  .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

const stake = async(amount, callback) => {
  var raw = getRaw(amount);
  tezos.wallet
  .at(contractAddress)
  .then((sc) => sc.methods.stake(raw).send({ amount: 0, mutez: false }))
  .then((op) => {
    console.log(`Awaiting for ${op.opHash} to be confirmed...`);
    return op.opHash;
  })
  .then((hash) => {
    console.log(`Operation injected: https://edo.tzstats.com/${hash}`)
    watchForOp(hash, callback);
  })
  .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

const unstake = async(amount, callback) => {
  var raw = getRaw(amount);
  tezos.wallet
  .at(unstakeWrapper)
  .then((sc) => sc.methods.unstake_wrapper(raw).send({ amount: 0, mutez: false }))
  .then((op) => {
    console.log(`Awaiting for ${op.opHash} to be confirmed...`);
    return op.opHash;
  })
  .then((hash) => {
    console.log(`Operation injected: https://edo.tzstats.com/${hash}`)
    watchForOp(hash, callback);
  })
  .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

const watchForOp = async(hash, callback, block) => {
  var currentblock = await getCurrentBlock();

  if (block && block.hash != currentblock.hash) {
    watchForOpGroup(hash, callback);
    return;
  }

  window.setTimeout(() => watchForOp(hash, callback, block || currentblock), 2000);
  return;
}

const watchForOpGroup = async(hash, callback) => {
  var opg = await  getOperationGroup(hash);
  [0].status
  if (opg 
    && opg.length == 3
    && opg[0].status
    && opg[0].status == applied
    && opg[1].status
    && opg[1].status == applied
    && opg[2].status
    && opg[2].status == applied) {
    callback();
    return;
  }

  if (opg) {
    // TODO ERROR ROUTE 
    return;
  }

  window.setTimeout(() => watchForOpGroup(hash, callback), 5000);
  return;
}

const getCurrentBlock = async() => {
  var uri = `https://api.teztools.io/v1/blocks-live`;
  const result = await axios.get(uri);

  return result.data;
}

const getOperationGroup = async(hash) => {
  try {
    var uri = `https://api.better-call.dev/v1/opg/${hash}`;
    const result = await axios.get(uri);

    return result.data != "" ? result.data : undefined;
  } catch (err) {
    console.log('No data...')
  }

  return;
}

const getRaw = (dbl) => {
  var raw = Math.trunc(dbl * Math.pow(10, 5));

  return raw;
}

const claim = async() => {
  tezos.wallet
  .at(contractAddress)
  .then((sc) => sc.methods.claim([['unit']]).send({ amount: 0, mutez: false }))
  .then((op) => {
    console.log(`Awaiting for ${op.opHash} to be confirmed...`);
    return op.opHash;
  })
  .then((hash) => {
    console.log(`Operation injected: https://edo.tzstats.com/${hash}`)

  })
  .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

const getStake = async() => {
  var acct = await getActiveAccount();
  var uri = `https://api.better-call.dev/v1/contract/${networkName}/${contractAddress}/storage`;
  const results = await axios.get(uri);

  if (!results) {
    return;
  }

  var maps = results.data[0].children;
  var gs = getMap(maps, "governable_storage");
  var map = getMap(gs.children, "stake_map");
  //var stakeData = JSON.parse(map.value);
  var stakeData = map.value;

  stakeData = stakeData.replace('{ { Elt ', '');
  stakeData = stakeData.replace(' } }', '');
  var stakes = stakeData.split(' ; Elt ');

  var stakeMap = [];
  for (var i in stakes) {
    var s = stakes[i];
    s = s.replace("\"", '');
    s = s.replace("\"", '');

    var stake = s.split(' ');
    stake[1] = parseInt(stake[1]) / 100000;
    stakeMap[i] = stake;

    if (acct.address === stake[0]) {
      return stake[1];
    }
  }

  return 0;

  /*return await tezos.wallet
  .at(contractAddress)
  .then((sc) => sc.storage()
    .then((storage) => {
      var gs = storage.governable_storage;
      var smap = gs.get("stake_map");
      //var isMap = MichelsonMap.isMichelsonMap(smap);

      var decoded = shorter.decompress();

      console.log(decoded);

      smap.forEach((key, val) => {
        console.log(key);
        console.log(val);
      });


  }))
  .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));*/
}

const getMap = (maps, name) => {
  for (var i in maps) {
    var map = maps[i];

    if (map.name === name) {
      return map;
    }
  }

  return;
}

const getTokenContract = async (contractAddress) => {
  return await tezos.contract.at(contractAddress, tzip12);
}

const getTokenMetadata = async (tokenContract, tokenId) => {
  return await tokenContract.tzip12().getTokenMetadata(tokenId)
    .then (tokenMetadata => {
      // let token = JSON.stringify(tokenMetadata, null, 2);
      return tokenMetadata;
    })
    .catch(error => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

const getWalletAssets = async (address) => {
  if (address === null || address === '') { return []; }

  const network = 'mainnet';
  let balances = [];
  let page = 0;
  let size = 10;
  let url = `https://api.better-call.dev/v1/account/${network}/${address}/token_balances`;
  const results = await axios.get(url);
  balances.push(...results.data.balances);
  while (results.data.total > balances.length) {
    page += 1;
    url = `https://api.better-call.dev/v1/account/${network}/${address}/token_balances?offset=${page * size}`;
    console.log(url);
    const results = await axios.get(url);
    balances.push(...results.data.balances);
  }

  return balances;
}

export {
  tezos,
  wallet,
  clearActiveAccount,
  disconnect,
  getActiveAccount,
  getNetworkPermission,
  getTezDomain,
  getTokenContract,
  getTokenMetadata,
  getWalletAssets,
  sendMessage, 
  getStake,
  stake,
  unstake,
  claim
};
