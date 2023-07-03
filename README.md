# GEM backend

An Enonic XP application for headless use, consumed by the **Next.JS** project `internal-gem-frontend`.

## Test

To run this locally you need:

1. Start Enonic XP
2. Clone this Github project: `git clone ...`
3. From project directory: `enonic project deploy`
4. Add this App to a new Project and Site
5. Install app **Enonic.XP** from Market
6. Add the unique app key from `internal-gem-frontend/.env`-file on Next.XP config
7. Save and publish
8. Front-end should update as you save, but backend needs a new `...deploy` and reload


