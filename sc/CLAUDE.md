# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Foundry-based Solidity smart contract project for supply chain product tracking. The main contract is `ProductTracker.sol`, which enables organizations to record and track events for products throughout the supply chain using blockchain technology.

## Core Architecture

### ProductTracker Contract (`src/ProductTracker.sol`)

The primary contract implementing a product traceability system with:

- **Event Structure**: Stores organization address, timestamp, and digital signature for each event
- **Storage Pattern**: Uses `mapping(string => Event[])` to map product labels to arrays of events
- **Key Functions**:
  - `addEvent()`: Records a single event for a product label
  - `addEvents()`: Batch records events for multiple product labels
  - `getEvents()`: Retrieves all events for a specific product label
  - `getEvent()`: Gets a specific event by label and index
  - `getEventCount()`: Returns the number of events for a label

### Testing Strategy (`test/ProductTracker.t.sol`)

Comprehensive test suite including:
- Happy path tests for all functions
- Input validation tests (empty labels, invalid timestamps, empty signatures)
- Boundary condition tests (out of bounds access, nonexistent labels)
- Fuzz testing for `addEvent()` with random inputs

All tests inherit from `forge-std/Test.sol` and use Foundry's testing utilities including `vm.expectRevert()` and `vm.expectEmit()`.

## Development Commands

### Build
```shell
forge build
```

### Test
```shell
# Run all tests
forge test

# Run tests with verbose output
forge test -vv

# Run tests with very verbose output (shows stack traces)
forge test -vvv

# Run a specific test
forge test --match-test test_AddEvent

# Run tests in a specific contract
forge test --match-contract ProductTrackerTest
```

### Format
```shell
forge fmt
```

### Gas Analysis
```shell
# Generate gas snapshot
forge snapshot

# Show gas report during tests
forge test --gas-report
```

### Coverage
```shell
forge coverage
```

### Local Development
```shell
# Start local Ethereum node
anvil
```

### Deployment
```shell
# Deploy script example (adapt for your deployment script)
forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## Project Structure

- `src/`: Solidity smart contracts
  - `ProductTracker.sol`: Main supply chain tracking contract
  - `Counter.sol`, `HolaMundo.sol`: Example/template contracts
- `test/`: Test files (`.t.sol` suffix)
  - Each source file has a corresponding test file
- `script/`: Deployment and interaction scripts
- `lib/`: External dependencies (managed via git submodules)
  - `forge-std`: Foundry standard library for testing
- `out/`: Compilation artifacts (generated)
- `cache/`: Build cache (generated)

## Solidity Version

Contracts use `pragma solidity ^0.8.19` (ProductTracker) and `^0.8.13` (Counter).

## Dependencies

The project uses `forge-std` as the testing framework, installed as a git submodule:
```shell
# Initialize/update dependencies
forge install
```

## Writing Tests

Tests should:
- Import `forge-std/Test.sol` and the contract under test
- Inherit from `Test` contract
- Include a `setUp()` function to initialize the test environment
- Use descriptive test names with the `test_` prefix
- Test failure cases with `test_FailCondition` naming pattern
- Include fuzz tests for functions with complex inputs (prefix with `test_Fuzz_`)
- Use Foundry's cheatcodes (`vm.*`) for advanced testing scenarios
