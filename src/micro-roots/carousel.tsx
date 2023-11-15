import { GetStaticPropsParams } from '../..';

import type { MinimalProductInformation } from '../types/shared';
import { getCarouselConfig } from '../lib/handle-carousel-config';
import { getProductsFromAlgolia } from '../lib/handle-algolia-api';
import ProductHit from '../components/ProductHit';

import './carousel.css';
import './carousel-test-if-multiple-bundles-get-created.css';

// mark this component as server only, so no React hydration
// happens for it
export const islandType = 'client-htmx';

export const htmxActions = {
  'more-products': async () => {
    // Simulate a delay of 400ms
    await new Promise((resolve) => setTimeout(resolve, 400));

    // todo: fetch real products
    // array of 10 fake products
    const fakeProducts = Array.from({ length: 10 }, (_, i) => ({
      titleLong: `Fake Product ${i + 1}`,
      retailPriceNet_DE: Math.random() * 100,
      assets: [
        {
          url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845699311',
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
    <div className="carousel-wrapper" id={`carousel-${props.uniqueIdentifier}`}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>
        Carousel {props.id}: {props.id}
      </h1>
      <ul
        className="products-wrapper"
        style={{
          display: 'flex',
          gap: '40px',
          width: '1400px',
          listStyle: 'none',
          overflowX: 'scroll',
        }}
      >
        {props.carouselProducts?.map((product) => (
          <ProductHit key={product.titleLong} product={product} />
        ))}
      </ul>
      <button
        hx-get="/htmx/carousel/more-products"
        hx-target={`#carousel-${props.uniqueIdentifier} .products-wrapper`}
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
