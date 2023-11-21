import { GetStaticPropsParams } from '../..';

import type { MinimalProductInformation } from '../types/shared';
import { getCarouselConfig } from '../lib/handle-carousel-config';
import { getProductsFromAlgolia } from '../lib/handle-algolia-api';
import ProductHit from '../components/product-hit';

import styles from './carousel.module.css';
import './carousel-test-if-multiple-bundles-get-created.css';

export const islandType = 'client-htmx'; // todo: rename to 'server-only'??

export const htmxActions = {
  'more-products': async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    // todo: fetch real products
    const fakeProducts = Array.from({ length: 10 }, (_, i) => ({
      titleLong: `Apple iPhone 13 Pro Max 128 GB Gold MLL83ZD/A ${i + 1}`,
      retailPriceNet_DE: Math.random() * 100,
      assets: [
        {
          url: 'https://im.cyberport.de/is/image/cyberport/210916081458800301900053I',
          purpose: 'MAIN',
        },
      ],
    }));

    return fakeProducts.map((product) => (
      <ProductHit key={product.titleLong} product={product} />
    ));
  },
};

function Carousel(props: {
  id: string;
  carouselProducts?: MinimalProductInformation[];
  uniqueIdentifier: string;
}) {
  return (
    <div
      className={styles.carouselWrapper}
      id={`carousel-${props.uniqueIdentifier}`}
    >
      <ul className={styles.productsWrapper}>
        {props.carouselProducts?.map((product) => (
          <ProductHit key={product.titleLong} product={product} />
        ))}
      </ul>
      <button
        className={styles.loadMoreButton}
        hx-get="/htmx/carousel/more-products"
        hx-target={`#carousel-${props.uniqueIdentifier} .${styles.productsWrapper}`}
        hx-swap="beforeend"
        hx-trigger="click"
      >
        Load More products
      </button>
    </div>
  );
}

// we don't have an opinon on the structure of the params
// it is the responsability of the component to validate that
// these params are correct and valid
export const getStaticProps = async (ctx: GetStaticPropsParams) => {
  const carouselConfig = await getCarouselConfig(
    ctx.query.path as string,
    ctx.query.baseUrl as string
  );

  // mocked product search query that comes from <esi:include /> - just for testing purposes
  const mockedProductSearchQuery: string = ctx.query.productSearchQuery;

  const carouselProducts = await getProductsFromAlgolia(
    carouselConfig,
    mockedProductSearchQuery
  );

  return {
    props: {
      id: ctx.query.path,
      carouselProducts,
      uniqueIdentifier: ctx.query.uniqueIdentifier,
    },
  };
};

export default Carousel;
