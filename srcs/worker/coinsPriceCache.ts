import { factory } from "../logger"
import { config } from "../config"
import Web3 from "web3"
import { getConnection } from "typeorm";
import { ChainId, Token, WETH, Fetcher, Route, TokenAmount, TradeType, Trade } from '@uniswap/sdk'

interface PriceCoin {
    coin: string,
    price: number
}

const log = factory.getLogger("oracle");
class CoinsPriceCache
{
    public web3: any
    public contract: any

    public prices: PriceCoin[] = []
    constructor()
    {
        this.web3 = new Web3(config.EthereumNode);
        this.prices.push({
            coin:"USDT",
            price: 1
        })
        this.loopRequest()
    }

    private async refreshLOCCPrice(): Promise<boolean>
    {
        const netId = await this.web3.eth.net.getId();
        const LOCC = await Fetcher.fetchTokenData(netId, this.web3.utils.toChecksumAddress(config.EthereumAsset));
        const WETH = await Fetcher.fetchTokenData(netId, this.web3.utils.toChecksumAddress(config.EthWethContract));
        
        const pair = await Fetcher.fetchPairData(LOCC, WETH);
        const route = new Route([pair], WETH)
        const result: number = parseFloat(parseFloat((parseFloat(route.midPrice.toSignificant(6)) * 1) as any).toFixed(8));
        
        const coinPrice = this.prices.find(x => x.coin === "LOCC")
        if (coinPrice !== undefined) {
            coinPrice.price = result
        } else {
            this.prices.push({
                coin: "LOCC",
                price: result
            })
        }
        return true
    }

    private async refreshWethPrice(): Promise<boolean>
    {
        const netId = await this.web3.eth.net.getId();
        const LOCC = await Fetcher.fetchTokenData(netId, this.web3.utils.toChecksumAddress(config.EthUsdtContract));
        const USDT = await Fetcher.fetchTokenData(netId, this.web3.utils.toChecksumAddress(config.EthWethContract));
        
        const pair = await Fetcher.fetchPairData(LOCC, USDT);
        const route = new Route([pair], USDT)
        const result: number = parseFloat(parseFloat((parseFloat(route.midPrice.toSignificant(6)) * 1) as any).toFixed(8));
        const coinPrice = this.prices.find(x => x.coin === "WETH")
        if (coinPrice !== undefined) {
            coinPrice.price = result
        } else {
            this.prices.push({
                coin: "WETH",
                price: result
            })
        }
        return true
    }


    async refreshPrices()
    {
        try {
            await this.refreshWethPrice()
            await this.refreshLOCCPrice()
        } catch (e) { console.error(e) }
    }

    async loopRequest()
    {
        setInterval(async () => {
            try {
                await this.refreshPrices()
            } catch (e) { }
        }, (2 * 1000) * 60)// 1mins
    }
}

export let coinPriceCache = new CoinsPriceCache();