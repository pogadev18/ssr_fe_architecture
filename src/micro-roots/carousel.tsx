import { GetStaticPropsParams } from '../..';

import type { MinimalProductInformation } from '../types/shared';
import { getCarouselConfig } from '../lib/handle-carousel-config';
import { getProductsFromAlgolia } from '../lib/handle-algolia-api';
import ProductHit from '../components/ProductHit';

import './carousel.css';
import './carousel-test-if-multiple-bundles-get-created.css';

// mark this component as server only, so no React hydration
// happens for it
export const islandType = 'server-only'

function Carousel(props: {
  id: string;
  carouselProducts?: MinimalProductInformation[];
}) {
  return (
    <div className="carousel-wrapper">
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
    },
  };
};

export default Carousel;
