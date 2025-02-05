import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { mockWindowLocations, renderWithRouter } from '../tests/testUtils';
import CatalogPage from './CatalogPage';
import selectionCardMessage from '../catalogSelectionDeck/CatalogSelectionDeck.messages';

// all we are testing is routes, we don't need InstantSearch to work here
jest.mock('react-instantsearch-dom', () => ({
  ...jest.requireActual('react-instantsearch-dom'),
  InstantSearch: () => <div>SEARCH</div>,
  Index: () => <div>SEARCH</div>,
}));

// Catalog Page loads the CTA button link which expects a config value.
// Thus we're mocking the config here.
const mockConfig = () => ({
  HUBSPOT_MARKETING_URL: 'http://bobsdooremporium.com',
  EDX_FOR_BUSINESS_TITLE: 'ayylmao',
  EDX_FOR_ONLINE_EDU_TITLE: 'foo',
  EDX_ENTERPRISE_ALACARTE_TITLE: 'baz',
});

jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: () => mockConfig(),
}));

mockWindowLocations();

describe('CatalogPage', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });
  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });
  it('renders a catalog page component', () => {
    const { container } = renderWithRouter(<CatalogPage />);
    expect(container.querySelector('.hero')).toBeInTheDocument();
  });
  it('renders the catalog search component', () => {
    renderWithRouter(<CatalogPage />);
    expect(screen.getByText('SEARCH')).toBeInTheDocument();
  });
  it('renders with catalog selection cards', () => {
    renderWithRouter(<CatalogPage />);
    expect(
      screen.getByText(
        selectionCardMessage['catalogSelectionDeck.edxForBusiness.label']
          .defaultMessage,
      ),
    ).toBeInTheDocument();
  });
  it('properly handles empty query params', () => {
    const location = {
      ...window.location,
      search: '?q=',
    };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location,
    });
    expect(window.location.search).toEqual('?q=');
    renderWithRouter(<CatalogPage />);
    expect(window.location.search).toEqual(
      'enterprise_catalog_query_titles=baz&availability=Available+Now&availability=Starting+Soon&availability=Upcoming',
    );
  });
  it('accounts for exec ed inclusion feature flag', () => {
    process.env.EXEC_ED_INCLUSION = false;
    const location = {
      ...window.location,
      search: '?learning_type=executive-education-2u',
    };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location,
    });
    expect(window.location.search).toEqual('?learning_type=executive-education-2u');
    renderWithRouter(<CatalogPage />);
    // Assert we've removed the exec ed learning type because the feature flag was disabled
    expect(window.location.search).toEqual(
      'enterprise_catalog_query_titles=baz&availability=Available+Now&availability=Starting+Soon&availability=Upcoming',
    );
  });
  it('accounts for exec ed disclusion when not a la carte is selected', () => {
    process.env.EXEC_ED_INCLUSION = true;
    const location = {
      ...window.location,
      search: '?learning_type=executive-education-2u&learning_type=ayylmao&enterprise_catalog_query_titles=foobar',
    };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location,
    });
    expect(window.location.search).toEqual('?learning_type=executive-education-2u&learning_type=ayylmao&enterprise_catalog_query_titles=foobar');
    renderWithRouter(<CatalogPage />);
    // Assert learning type: exec ed has been removed but not learning type `ayylmao`
    expect(window.location.search).toEqual(
      'enterprise_catalog_query_titles=foobar&learning_type=ayylmao',
    );
  });
});
