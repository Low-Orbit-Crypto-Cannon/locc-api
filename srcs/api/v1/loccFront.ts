const router = require('express').Router();

import { factory } from "./../../logger"
import { etherScan } from "../../worker/etherScanInfos";
import { coinPriceCache } from "../../worker/coinsPriceCache";

router.get('/token', async (_: any, result: any) => {
    try {
        const datas: any = {}
        datas.ethPrice = coinPriceCache.prices.find(x => x.coin === "WETH")?.price
        const locc = coinPriceCache.prices.find(x => x.coin === "LOCC")?.price
        datas.loccPrice = datas.ethPrice / locc

        return result.send({result: true, uni: datas, etherscan: {price: etherScan.price, supply: etherScan.supply, addresses: etherScan.addresses}});
    } catch(e) {
        console.error(e)
    }
});

router.get('/chain/supply', async (_: any, result: any) => {
    result.type('text/plain');
    result.send("800") 
})

module.exports = router;