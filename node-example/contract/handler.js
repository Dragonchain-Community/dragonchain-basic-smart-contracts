'use strict'

module.exports = async (input, callback) => {
    const dcsdk = require("dragonchain-sdk");
    const getprice = require("./coinmarketcap");

    // This is where we do stuff //
    try {
        // Create the Dragonchain client //
        const client = await dcsdk.createClient();

        // Fetch our coinmarketcap API key from secrets (only works after deploying the smart contract!) //
        const apiKey = await client.getSmartContractSecret({"secretName":"cmcapikey"});
        
        // To test our contract code BEFORE deploying the contract for the first time, I'll just hard code the apiKey here //
        // Note: Just be careful (talking to myself here) about accidentally git committing with secret info in the source code... //
        //const apiKey = "YOURAPIKEYHERE";

        // Parse the request //
        let inputObj = JSON.parse(input);

        if (inputObj.payload.method == "create_price_snapshot")
        {
            getprice(apiKey, inputObj.payload.parameters.currencySlug)
                .then(response => {
                    // Get the numeric cryptocurrencyId from the response object
                    const keys = Object.keys(response.data);
                    const cryptocurrencyId = keys[0];

                    // Pass the price quote object back to the callback function //
                    callback(undefined, {
                        snapshot: {
                            slug: response.data[cryptocurrencyId].slug, 
                            quote: response.data[cryptocurrencyId].quote.USD
                        }
                    });

                }).catch(err => {

                    // Pass the error back to our callback function //
                    callback(err, undefined);

                })            

        } else if (inputObj.payload.method == "record_current_diff")
        {         
            // Get current price //
            getprice(apiKey, inputObj.payload.parameters.currencySlug)
                .then(async (response) => { // Gotta make it an async since we'll be awaiting the DC SDK client //
                    
                    const keys = Object.keys(response.data);
                    const cryptocurrencyId = keys[0];
                    
                    const currentPrice = response.data[cryptocurrencyId].quote.USD.price;

                    // Look up last recorded price //
                    const lastTransaction = await client.queryTransactions(
                        {
                            transactionType: "node_example", 
                            redisearchQuery: `@snapshot_slug:${inputObj.payload.parameters.currencySlug}`,
                            limit: 1,
                            sortBy: "timestamp",
                            sortAscending: false
                        })

                    if (lastTransaction.response.results && lastTransaction.response.results.length > 0)
                    {
                        // Get the last price recorded out of the result object //
                        const lastRecordedPrice = lastTransaction.response.results[0].payload.snapshot.quote.price;

                        // Calculate differences //
                        const priceDiff = currentPrice - lastRecordedPrice;
                        const percentDiff = ((lastRecordedPrice-currentPrice)/lastRecordedPrice) * -100;

                        // Call the callback with a price diff object payload //
                        callback(undefined, {
                            diff_snapshot: {
                                slug: response.data[cryptocurrencyId].slug, 
                                diff: {
                                    price_diff: priceDiff,
                                    percent_diff: percentDiff
                                }
                            }
                        });
                    } else {
                        // No previous transaction was found //
                        // Do something neat: log the error AND prevent an extra transaction from getting created for nothing //
                        console.error(`No previous transaction found for slug ${inputObj.payload.parameters.currencySlug}`);
                        callback(undefined, {"OUTPUT_TO_CHAIN":false});
                    }

                    
                }).catch(err => {

                    // Pass the error back to our callback function //
                    callback(err, undefined);

                })                  
        } else {
            callback("Invalid method or no method specified", undefined);
        }
    } catch (exception)
    {
        callback(exception,undefined);
    }
    
}
