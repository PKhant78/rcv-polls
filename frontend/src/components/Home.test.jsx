import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders the expected welcome text', () => {
    render(<Home />);
    
    expect(screen.getByText('Welcome to the TTP Winter Frontend!')).toBeInTheDocument();
    expect(screen.getByText('Edit this file (frontend/src/components/Home.jsx) to get started!')).toBeInTheDocument();
  });
});

