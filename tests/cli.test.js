/**
 * GBSE CLI smoke tests — zero API calls.
 *
 * Tests validate argument parsing and guard-rail behavior only.
 * No live Anthropic API calls are made.
 *
 * Usage: npm test
 */

import { spawnSync } from 'child_process';
import { describe, test, expect } from '@jest/globals';

function runCLI(args = [], envOverrides = {}) {
  return spawnSync(process.execPath, ['bin/gbse.js', ...args], {
    env: {
      ...process.env,
      GBSE_DISABLE_DOTENV: '1',
      ANTHROPIC_API_KEY: '',
      ...envOverrides,
    },
    encoding: 'utf8',
  });
}

describe('GBSE CLI smoke tests (no API calls)', () => {

  test('--help exits 0 and prints usage', () => {
    const result = runCLI(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('GBSE Quick Run');
    expect(result.stdout).toContain('Quick-run output is not an ATTA benchmark affirmation');
  });

  test('no arguments exits 1 and prints usage', () => {
    const result = runCLI([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GBSE Quick Run');
  });

  test('missing API key exits 1 with clear error message', () => {
    const result = runCLI(['Test claim']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ANTHROPIC_API_KEY');
  });

  test('argument parsing does not crash on multi-word claim', () => {
    const result = runCLI(['The', 'Eiffel', 'Tower', 'was', 'built', 'in', '1952']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ANTHROPIC_API_KEY');
    expect(result.stderr).not.toContain('TypeError');
    expect(result.stderr).not.toContain('SyntaxError');
  });

});
