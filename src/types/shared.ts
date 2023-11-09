import { FilterOptions } from '../constants';

export type CarouselConfig = {
  layout: string;
  source: FilterOptions;
  limit: number;
  headline?: string;
  categories?: string[];
  filter?: string;
  phrase?: string;
  limitArtikelgruppe?: number;
  limitWarengruppe?: number;
  products?: string[];
  manufacturers?: string[];
  sort?: Sort[];
  error?: string;
};

type Sort = {
  sortType: string;
};

export type MinimalProductInformation = {
  titleLong: string;
  retailPriceNet_DE: number;
  assets: [{ url: string; purpose: string }];
};
