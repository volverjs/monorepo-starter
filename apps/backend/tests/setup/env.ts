// The suite never reaches a database or a mail server: these values only let
// the modules that read the environment at import time load. postgres() does
// not connect until the first query, and no test runs one.
process.env.DATABASE_URL = 'postgres://postgres@127.0.0.1:1/unused'
process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-characters'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.FRONTEND_URL = 'http://localhost:8080'
