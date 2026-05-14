import React from 'react';
import VisualPageEditor from '../components/VisualEditor/VisualPageEditor';
import { PageStructure } from '../types/editor';

const INITIAL_STRUCTURE: PageStructure = {
  sections: [
    { id: 'hero-1', type: 'hero', props: { isVisible: true } },
    { id: 'search-1', type: 'search', props: { isVisible: true } },
    { id: 'stores-1', type: 'stores', props: { title: 'МАГАЗИНЫ-ПАРТНЕРЫ', isVisible: true } },
    { id: 'products-1', type: 'products', props: { title: 'ПОПУЛЯРНЫЕ ТОВАРЫ', limit: 8, filter: 'popular', isVisible: true } },
    { id: 'discount-1', type: 'products', props: { title: 'ЛУЧШИЕ ПРЕДЛОЖЕНИЯ', limit: 8, filter: 'sale', isVisible: true } },
  ]
};

const Home: React.FC = () => {
  return <VisualPageEditor pageId="home" initialStructure={INITIAL_STRUCTURE} />;
};

export default Home;
