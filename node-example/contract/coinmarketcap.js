'use strict'

module.exports = async (apiKey, currencySlug) => {
    const rp = require('request-promise');
    const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
        'slug': currencySlug
    },
    headers: {
        'X-CMC_PRO_API_KEY': apiKey
    },
    json: true,
    gzip: true
    };

    return rp(requestOptions);
}