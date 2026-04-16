# deburst-func

[![npm version](https://img.shields.io/npm/v/deburst-func.svg?style=flat-square)](https://www.npmjs.com/package/deburst-func)
[![npm downloads](https://img.shields.io/npm/dm/deburst-func.svg?style=flat-square)](https://www.npmjs.com/package/deburst-func)
[![bundle size](https://img.shields.io/bundlephobia/minzip/deburst-func?style=flat-square)](https://bundlephobia.com/package/deburst-func)
[![license](https://img.shields.io/npm/l/deburst-func.svg?style=flat-square)](./LICENSE.md)
[![types](https://img.shields.io/npm/types/deburst-func.svg?style=flat-square)](https://www.typescriptlang.org/)

> Trailing-edge debounce with a hard time ceiling. Collapses bursts of calls into a single invocation, but guarantees the callback still fires within a bounded delay even when triggers keep coming.

## Why

A standard debounce will never fire while triggers keep arriving faster than the interval — useful for "wait until the user stops typing," painful for "I need this to run at least every N milliseconds." A throttle fires at a fixed cadence but doesn't collapse trailing triggers cleanly.

`deburst` is the mix: it waits out quiet gaps like a debounce, but if triggers keep arriving in one continuous burst it caps the wait at a `burstLimit` ceiling and fires anyway.

## Installation

```sh
npm install deburst-func
# or
pnpm add deburst-func
# or
yarn add deburst-func
# or
bun add deburst-func
```

## Usage

### ESM

```js
import { deburst } from 'deburst-func'

const save = deburst(() => console.log('saved'), 200, 1000)

save() // schedules
save() // resets the 200ms quiet-gap timer
save() // …but after 1000ms of continuous triggering it fires anyway

save.cancel() // abort any pending invocation
```

### CommonJS

```js
const { deburst } = require('deburst-func')

const save = deburst(() => console.log('saved'), 200, 1000)
save()
```

### TypeScript

```ts
import { deburst } from 'deburst-func'

const update: { (): void; cancel: () => void } = deburst(
  () => refreshView(),
  200,  // burstInterval — fire after this many ms of silence
  1000, // burstLimit    — …but never wait longer than this
)
```

## API

```ts
deburst(
  callback: () => void,
  burstInterval: number,
  burstLimit: number,
): { (): void; cancel: () => void }
```

| Parameter       | Type         | Description                                                                                                                                               |
| --------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `callback`      | `() => void` | The function to invoke on the trailing edge of a burst.                                                                                                   |
| `burstInterval` | `number` ms  | Quiet-gap threshold. If no triggers arrive for this long, the callback fires.                                                                             |
| `burstLimit`    | `number` ms  | Hard ceiling. If triggers keep arriving continuously, the callback still fires once this much time has passed since the first trigger of the burst.       |

**Returns** — a function that:

- When called, registers a trigger event.
- Exposes `.cancel()` to clear any pending scheduled invocation.

## Module formats

This package ships:

- **ESM** (`dist/index.mjs`) — for `import` in modern Node, bundlers, and browsers.
- **CommonJS** (`dist/index.cjs`) — for `require` in Node CJS code.
- **TypeScript declarations** — `.d.mts` for ESM and `.d.cts` for CJS, resolving correctly under every `moduleResolution` setting (verified with [`are-the-types-wrong`](https://arethetypeswrong.github.io/)).

Runtime support: Node 18+, all evergreen browsers. No runtime dependencies.

## License

[Blue Oak Model License 1.0.0](./LICENSE.md)

## AI Disclosure

I wrote this function for another project and wanted to publish it. Claude Code set up the publishing infrastructure and found a bug through automated testing.
