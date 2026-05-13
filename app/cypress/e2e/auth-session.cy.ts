const workConfig = {
  expectedWeeklyHours: 40,
  expectedMonthlyHours: 160,
  trackLunchBreak: true,
  defaultLunchBreakMinutes: 30,
  workDays: '1,2,3,4,5',
  state: 'NATIONAL',
  showHolidays: true,
}

function seedAuthStorage(win: Window, username = 'e2e-user') {
  win.localStorage.setItem('token', 'stale-access-token')
  win.localStorage.setItem('refreshToken', 'stale-refresh-token')
  win.localStorage.setItem('username', username)
}

function stubProtectedRequests() {
  cy.intercept('GET', '**/api/v1/work/entries', {
    statusCode: 200,
    body: [],
  }).as('workEntries')

  cy.intercept('GET', '**/api/v1/work/config', {
    statusCode: 200,
    body: workConfig,
  }).as('workConfig')

  cy.intercept('GET', '**/api/v1/holiday/state/**', {
    statusCode: 200,
    body: [],
  }).as('holidays')
}

describe('Auth session persistence', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('keeps the user logged in when validation and refresh fail temporarily on app startup', () => {
    cy.intercept('GET', '**/api/v1/auth/validate', {
      statusCode: 503,
      body: { error: 'temporary error' },
    }).as('validate')

    cy.intercept('POST', '**/api/v1/auth/refresh', {
      statusCode: 503,
      body: { error: 'temporary error' },
    }).as('refresh')

    stubProtectedRequests()

    cy.visit('/', {
      onBeforeLoad: (win) => {
        seedAuthStorage(win)
      },
    })

    cy.wait('@validate')
    cy.wait('@refresh')

    cy.url().should('eq', `${Cypress.config('baseUrl')}/`)
    cy.contains('h1', 'Work Time Tracker').should('be.visible')
    cy.contains('Welcome back, e2e-user!').should('be.visible')
  })

  it('redirects to login when refresh token is unauthorized on app startup', () => {
    cy.intercept('GET', '**/api/v1/auth/validate', {
      statusCode: 401,
      body: { valid: false, error: 'Invalid token' },
    }).as('validate')

    cy.intercept('POST', '**/api/v1/auth/refresh', {
      statusCode: 401,
      body: { error: 'Invalid token' },
    }).as('refresh')

    cy.visit('/', {
      onBeforeLoad: (win) => {
        seedAuthStorage(win)
      },
    })

    cy.wait('@validate')
    cy.wait('@refresh')

    cy.url().should('include', '/login')
    cy.contains('h2', 'Welcome Back').should('be.visible')
    cy.contains('button', 'Sign in').should('be.visible')
  })
})
