const Web3 = require('web3');
const web3 = new Web3('wss://mainnet.infura.io/ws/v3/83ac3df3ed834757a50ae96eeaa28152');


let options = {
    topics: [
        web3.utils.sha3('Transfer(address,address,uint256)')
    ],
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    fromBlock:  15817488,
    toBlock: "latest",
};


const abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
let subscription = web3.eth.subscribe('logs', options);
async function collectData(contract) {
    const [decimals, symbol] = await Promise.all([
        contract.methods.decimals().call(),
        contract.methods.symbol().call()
    ]);
    return { decimals, symbol };
}
subscription.on('data', event => {
    if (event.topics.length == 3) {
        let transaction = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'from',
            indexed: true
        }, {
            type: 'address',
            name: 'to',
            indexed: true
        }, {
            type: 'uint256',
            name: 'value',
            indexed: false
        }],
            event.data,
            [event.topics[1], event.topics[2], event.topics[3]]);
    
        const contract = new web3.eth.Contract(abi, event.address)
        collectData(contract).then(contractData => {
            const unit = Object.keys(web3.utils.unitMap).find(key => web3.utils.unitMap[key] === web3.utils.toBN(10).pow(web3.utils.toBN(contractData.decimals)).toString());
            console.log(`Transfer of ${web3.utils.fromWei(transaction.value, unit)} ${contractData.symbol} from ${transaction.from} to ${transaction.to}`) 

            if (transaction.from == '0x28C6c06298d514Db089934071355E5743bf21d60') { console.log('Specified address sent an ERC-20 token!') };
            if (transaction.to == '0x28C6c06298d514Db089934071355E5743bf21d60') { console.log('Specified address received an ERC-20 token!') };
        })
    }
});
