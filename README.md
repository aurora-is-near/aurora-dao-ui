# Aurora DAO ui

Frontend for Aurora DAO smart contract.

## Requirements
* Node.js 14+

## How to

### Deploy & initialize Aurora DAO
Clone contract, deploy and initialize it.
```shell
$ git clone https://github.com/near-daos/sputnik-dao-contract.git
$ cd sputnik-dao-contract/sputnikdao-factory2/
$ CONTRACT_ID="aurora-dao.testnet"
$ near deploy $CONTRACT_ID res/sputnikdao_factory2.wasm 
$ near call $CONTRACT_ID new '{}' --accountId $CONTRACT_ID  
```

### Create DAO
Set councils for the DAO. Set DAO arguments
```shell
$ COINSILS=["council-acc1.testnet", "council-acc2.testnet"]
$ ARGS=`echo '{"purpose": "Aurora test DAO", "council": '$COINSILS', "bond": "1000000000000000000000000", "vote_period": "1800000000000", "grace_period": "1800000000000"}' | base64`
$ near call $CONTRACT_ID create "{\"name\": \"dao1\", \"public_key\": null, \"args\": \"$ARGS\"}"  --accountId $CONTRACT_ID --amount 30 --gas 100000000000000
```
