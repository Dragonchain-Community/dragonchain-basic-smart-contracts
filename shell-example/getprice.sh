#!/bin/sh

#Get the current $DRGN price using the CoinMarketCap API
#Note: we'll pass in our CoinMarketCap API key as an argument ($1)
#Note: CoinMarketCap's internal ID for Dragonchain is 2243

DRGN_DATA=$(curl -s -H "X-CMC_PRO_API_KEY: $1" -H "Accept: application/json" -d "id=2243" -G https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest)

#Parse out the price with jq and echo a JSON object as the payload for the response from our smart contract
DRGN_PRICE_DATA=$(echo $DRGN_DATA | jq -c '.data."2243".quote.USD')
echo "{\"drgn_price_data_usd\":$DRGN_PRICE_DATA}"
