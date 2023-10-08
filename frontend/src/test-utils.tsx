import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { render, RenderOptions } from '@testing-library/react'


const renderApp = ({ children }: { children: React.ReactNode }) => {
  return (<Router>{children}</Router>)
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'queries'>) =>
  render(ui, { wrapper: renderApp, ...options })

export * from '@testing-library/react'

export { customRender as render }

