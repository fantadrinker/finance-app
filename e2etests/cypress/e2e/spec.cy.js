describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://fantadrinker.github.io/finance-app').toMatchImageSnapshot()
  })
})