# @hotora/core

## 2.0.2

### Patch Changes

- Cnahge package.json

## 2.0.1

### Patch Changes

- fix

## 2.0.0

### Major Changes

- ### Major Changes
  - Refactored step handling API:
    - Introduced `addStep` for step registration
    - Replaced `emitStep` with `process` for state evaluation

  ***

  #### Breaking Changes
  - `emitStep` method has been removed
  - Step emission is no longer implicit — use `addStep` explicitly before calling `process`

## 1.0.1

### Patch Changes

- Ts improvements
