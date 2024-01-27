import axios from 'axios'
import * as cheerio from 'cheerio'
import { extractCurrency, extractPrice } from '../utils';

export async function scrapeAmazonProduct(url:string) {
    if(!url) return;

    // curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_182c2f1a-zone-unblocker:zn0acv3g7y74 -k https://lumtest.com/myip.json

    // BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        }, 
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }

    try {
        // Fetch the product page
        const response = await axios.get(url, options);
        const $ = cheerio.load(response.data);

        // Extract product title
        const title = $('#productTitle').text().trim()
        // The values in currentPrice can change according to the change of the 
        // page that is scraped
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
            // $('.a-price.a-text.price.a-size-medium.apexPriceToPay'),
        );

        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price'),
            // $('.a-price.a-text-price.a-size-base')
        );

        const outOfStock = $('#availability span').text().trim().toLowerCase
        () === 'currently unavailable';

        const images = 
        $('#imgBlkFont').attr('data-a-dynamic-image') ||
        $('#landingImage').attr('data-a-dynamic-image') || 
        '{}';

        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency($('.a-price-symbol'));
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

        // console.log({title, currentPrice, originalPrice, outOfStock, imageUrls, currency, discountRate})
        const data = {
            url,
            currency: currency || '$',
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice),
            originalPrice: Number(originalPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            category: 'category',
            reviewsCount: 100,
            starts: 4.5,
            isOutOfStock: outOfStock,
        }

        console.log(data);
    } catch (error: any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}