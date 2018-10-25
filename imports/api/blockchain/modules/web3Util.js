import { Meteor } from 'meteor/meteor';
import Web3 from 'web3';
import abi from 'human-standard-token-abi';
import { BigNumber } from 'bignumber.js';
import { token } from '/lib/token';

// Set web3 provider
let web3;
const provider = Meteor.settings.public.web3.network.testnet;

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(provider));
}

/**
* @summary adjusts decimals of supported tokens
* @param {value} raw value in lowest decimal
* @param {number} decimals
* @return {number} equivalent with decimals accounted for
*/
const _adjustDecimal = (value, decimals) => {
  const decimalsBN = new BigNumber(decimals);
  const valueBN = new BigNumber(value);
  const divisor = new BigNumber(10).pow(decimalsBN);
  const beforeDecimal = valueBN.div(divisor);

  return beforeDecimal;
};

/**
* @summary converts wei to eth
* @param {string} value in wei
* @return {number} equivalent in eth
*/
const _wei2eth = (value) => {
  return web3.utils.fromWei(value, 'ether');
};

/**
* @summary gets eth balance from given public address
* @param {string} publicAddress
* @return {object} bigNumber eth balance
*/
const _getEthBalance = (publicAddress) => {
  const balance = web3.eth.getBalance(publicAddress);
  const ethBalance = web3.utils.fromWei(balance, 'ether');
  return ethBalance;
};

/**
* @summary gets wei balance from given public address
* @param {string} publicAddress
* @return {object} bigNumber wei balance
*/
const _getWeiBalance = (publicAddress) => {
  const balance = web3.eth.getBalance(publicAddress);
  return balance;
};

/**
* @summary gets token symbol/code from given public address
* @param {string} publicAddress, contractAddress
* @return {string} symbol
*/
const _getTokenSymbol = (publicAddress, contractAddress) => {
  return new Promise(
    (resolve, reject) => {
      const tokenInstance = new web3.eth.Contract(abi, contractAddress);

      tokenInstance.methods.symbol.call({ from: publicAddress }, (err, symbol) => {
        if (err) { reject(err); }
        if (symbol) { resolve(symbol); }
      });
    }
  );
};

/**
* @summary gets token balance from given public address
* @param {string} publicAddress, contractAddress
* @return {number} balance
*/
const _getTokenBalance = (publicAddress, contractAddress) => {
  return new Promise(
    (resolve, reject) => {
      const tokenInstance = new web3.eth.Contract(abi, contractAddress);

      tokenInstance.methods.balanceOf.call(publicAddress, (err, balance) => {
        if (err) { reject(err); }
        if (balance) { resolve(balance); }
      });
    }
  );
};

/**
* @summary constructs tokenData object based on given _publicAddress
* @param {string} _publicAddress
* @return {object} tokenData should only contain tokens associated with _publicAddress
*/
const _getTokenData = async (_publicAddress) => {
  const tokenData = [];
  let _balance;

  for (let i = 0; i < token.coin.length; i++) {
    _balance = await _getTokenBalance(_publicAddress, token.coin[i].contractAddress);
    if (_balance.toNumber() !== 0) {
      const adjustedBalance = _adjustDecimal(_balance.toNumber(), token.coin[i].decimals);
      const tokenObj = {
        balance: adjustedBalance.toNumber(),
        placed: 0,
        available: adjustedBalance.toNumber(),
        token: token.coin[i].code,
        publicAddress: _publicAddress,
      };

      tokenData.push(tokenObj);
    }
  }
  return tokenData;
};

/**
* @summary WIP
* @param
* @return
*/
const _sendToken = (contractAddress, _to, _from, value) => {
  console.log('DEBUG - web3Util.js - _sendToken() - contractAddress, _to, _from, value', contractAddress, _to, _from, value);
  const contract = new web3.eth.Contract(abi, contractAddress);
  // const count = web3.eth.getTransactionCount(_from);
  // const gasPrice = web3.eth.gasPrice;
  // const gasLimit = 90000;

  // const rawTransaction = {
  //   from: _from,
  //   to: contractAddress,
  //   value: 0,
  //   data: contract.transfer.getData(_to, value),
  //   gas: 200000,
  //   chainId: 4,
  // };

  // web3.eth.sendTransaction(rawTransaction, (error, receipt) => {
  //   if (error) {
  //     console.log('DEBUG - error in _sendToken ', error);
  //   }
  //   console.log(receipt);
  // });

  contract.methods.transfer(_to, value).send({ from: _from }, function (err, txHash) {
    if (err) console.error(err);

    if (txHash) {
      console.log('Transaction sent!');
      console.dir(txHash);
    }
  });
};

export const wei2eth = _wei2eth;
export const getEthBalance = _getEthBalance;
export const getWeiBalance = _getWeiBalance;
export const getTokenSymbol = _getTokenSymbol;
export const getTokenBalance = _getTokenBalance;
export const adjustDecimal = _adjustDecimal;
export const getTokenData = _getTokenData;
export const sendToken = _sendToken;