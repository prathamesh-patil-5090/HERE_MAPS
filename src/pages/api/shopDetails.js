import { scrapeShopDetails, scrapeJustDialDetails } from '../../components/scraper';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, address, city } = req.body;

    try {
        const [googleDetails, justDialDetails] = await Promise.all([
            scrapeShopDetails(name, address),
            scrapeJustDialDetails(name, city)
        ]);

        // Merge and deduplicate results
        const mergedDetails = {
            ...googleDetails,
            justdial: justDialDetails,
        };

        res.status(200).json(mergedDetails);
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Failed to fetch shop details' });
    }
}
