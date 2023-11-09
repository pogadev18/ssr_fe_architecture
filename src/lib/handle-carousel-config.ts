import type { CarouselConfig } from '../types/shared';

// todo: error handling
export const getCarouselConfig = async (
  carouselPath: string | undefined,
  baseUrl: string | undefined
): Promise<CarouselConfig> => {
  //   const prefix = baseUrl?.includes('.at') ? 'webshop30_at' : 'webshop30_de';
  const endpoint = `${baseUrl}/servlets/carousel.json?path=${carouselPath}`;

  // used to connect to AEM endpoints
  const encodedCredentials = Buffer.from(
    `${process.env.AEM_DEV_ENV_USER}:${process.env.AEM_DEV_ENV_PASS}`
  ).toString('base64');

  const requestHeaders = { Authorization: `Basic ${encodedCredentials}` };
  const carouselConfig = await fetch(endpoint, { headers: requestHeaders });

  return JSON.parse(await carouselConfig.text()); // This will fail if not valid JSON
};
