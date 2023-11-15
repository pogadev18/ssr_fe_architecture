import type { CarouselConfig, MinimalProductInformation } from '../types/shared';

const ALGOLIA_ENDPOINT = `https://${process.env.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/DEV_products_main/query?X-Algolia-API-Key=${process.env.ALGOLIA_API_KEY}&X-Algolia-Application-Id=${process.env.ALGOLIA_APP_ID}`;

export const getProductsFromAlgolia = async (
  carouselConfig: CarouselConfig,
  productSearchQuery: string
): Promise<MinimalProductInformation[]> => {
  /*
 TODO for the "carouselConfig" paramater:
 - after this PoC, the carouselConfig will be used to construct the search params.
 - more info on how to do this here (see section 8) https://devconfluence.cyberport.de/display/EC/Technical++Documentation .

 !! for the sake of this POC, doing this now it is not relevant.
*/

  const searchParams = {
    params: `query=${productSearchQuery}`, // "dynamic" search query that comes from <esi:include/> (for testing purposes)
    hitsPerPage: 32,
    facets: ['*'],
    clickAnalytics: true,
    filters: 'status:ACTIVE',
  };

  try {
    const data = await fetch(ALGOLIA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!data.ok) {
      throw new Error(`HTTP error! status: ${data.status}`);
    }

    const algoliaResponse = await data.json();

    const products: MinimalProductInformation[] = algoliaResponse.hits.map(
      (hit: MinimalProductInformation) => ({
        titleLong: hit.titleLong,
        retailPriceNet_DE: hit.retailPriceNet_DE,
        assets: hit.assets.filter((asset) => asset.purpose === 'MAIN'),
      })
    );

    return products;
  } catch (error) {
    console.error('Error fetching data from Algolia:', error);
    throw error; // Rethrow the error if you want the caller to handle it
  }
};
