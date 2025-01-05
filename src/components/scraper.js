const puppeteer = require('puppeteer');

async function scrapeShopDetails(shopName, address) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        // Search for the business on Google Maps
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(shopName + ' ' + address)}`);
        await page.waitForSelector('.section-result-title', { timeout: 5000 });

        // Get shop details
        const details = await page.evaluate(() => {
            const phone = document.querySelector('[data-tooltip="Copy phone number"]')?.textContent || null;
            const website = document.querySelector('[data-tooltip="Open website"]')?.href || null;
            const hours = Array.from(document.querySelectorAll('.section-open-hours-row'))
                .map(row => row.textContent.trim())
                .join(', ');
            
            return { phone, website, hours };
        });

        await browser.close();
        return details;

    } catch (error) {
        console.error('Scraping error:', error);
        await browser.close();
        return null;
    }
}

async function scrapeJustDialDetails(shopName, city) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        // Navigate directly to the shop's detail page if you have exact URL
        // Otherwise, you can first land on the search page, then click on the shop link
        const searchUrl = `https://www.justdial.com/${city}/${encodeURIComponent(shopName)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        // Wait for a key detail element on the shop's main page
        // (e.g., `.heading-container`, `.container`, or `.store-name` - adjust if needed)
        await page.waitForSelector('.heading-container, .store-details, .container', { timeout: 8000 });

        // Extract relevant info
        const details = await page.evaluate(() => {
            const name = document.querySelector('.container h1')?.textContent?.trim()
                || document.querySelector('.store-name')?.textContent?.trim()
                || null;
            const rating = document.querySelector('.green-box, .rating-value')?.textContent?.trim() || null;
            const reviews = document.querySelector('.rating_count, .total-reviews')?.textContent?.trim() || null;
            const contact = document.querySelector('.telnowpr, .contact-info')?.getAttribute('data-phone') || null;
            const openUntil = document.querySelector('.schedule-text, .business-timing')?.textContent?.trim() || null;

            let address = document.querySelector('.address, .loc-info')?.textContent?.trim() || null;
            if (!address) {
                // Try to capture any alternate address field
                const altAddressEl = document.querySelector('address') || document.querySelector('.shop-address');
                address = altAddressEl?.textContent?.trim() || null;
            }

            return {
                name, rating, reviews, contact, openUntil, address
            };
        });

        await browser.close();
        return details;

    } catch (error) {
        console.error('JustDial scraping error:', error);
        await browser.close();
        return null;
    }
}

async function scrapeJustDialByUrl(jdUrl) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        await page.goto(jdUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.heading-container, .store-details, .container', { timeout: 8000 });

        const details = await page.evaluate(() => {
            const name = document.querySelector('.container h1')?.textContent?.trim()
                || document.querySelector('.store-name')?.textContent?.trim()
                || null;
            const rating = document.querySelector('.green-box, .rating-value')?.textContent?.trim() || null;
            const reviews = document.querySelector('.rating_count, .total-reviews')?.textContent?.trim() || null;
            const contact = document.querySelector('.telnowpr, .contact-info')?.getAttribute('data-phone') || null;
            const openUntil = document.querySelector('.schedule-text, .business-timing')?.textContent?.trim() || null;
            let address = document.querySelector('.address, .loc-info')?.textContent?.trim() || null;
            if (!address) {
                const altAddressEl = document.querySelector('address') || document.querySelector('.shop-address');
                address = altAddressEl?.textContent?.trim() || null;
            }
            return { name, rating, reviews, contact, openUntil, address };
        });

        await browser.close();
        return details;

    } catch (error) {
        console.error('scrapeJustDialByUrl error:', error);
        await browser.close();
        return null;
    }
}

module.exports = { scrapeShopDetails, scrapeJustDialDetails, scrapeJustDialByUrl };
