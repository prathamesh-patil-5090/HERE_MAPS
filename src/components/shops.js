const { scrapeJustDialDetails } = require('./scraper');

async function getJustDialContacts(shopName, city) {
  try {
    const data = await scrapeJustDialDetails(shopName, city);
    console.log('JustDial results:', data);
    // ...handle or return the data...
    return data;
  } catch (error) {
    console.error('Error fetching JustDial contacts:', error);
    return null;
  }
}

module.exports = { getJustDialContacts };
