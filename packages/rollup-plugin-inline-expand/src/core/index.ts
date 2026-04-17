import MagicString from 'magic-string';
import { createFilter } from '@rollup/pluginutils';
import type { Plugin } from 'rollup';
import type { RollupInlineFunctionOptions } from '../types/common.js';
import type { FunctionCandidate } from './types.js';
import { collectBindings, collectMutatedBindings } from './bindings.js';
import { collectCandidates } from './candidates.js';
import { collectCallSites } from './call-sites.js';
import { expandAtCallSite } from './expand.js';
import { collectImportedCandidates } from './import-candidates.js';
import { normalizeOptions } from './options.js';
import { safeParse } from './parse.js';
import { collectRemovableCandidates, isRangeInsideAny, toRemovalRanges } from './removals.js';

/**
 * Expand target function calls at usage sites like macro replacement.
 *
 * The replacement strategy:
 * - expression-body functions are expanded directly as expression
 * - block-body functions are expanded as raw statement fragments (macro style)
 *
 * __PKG_INFO__
 */
export function inlineFunction(options: Partial<RollupInlineFunctionOptions> = {}): Plugin {
  const opts = normalizeOptions(options);
  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: '__KEBAB_NAME__',
    transform(code: string, id: string) {
      if (!filter(id) || opts.names.length === 0) {
        return null;
      }

      const ast = safeParse(code);
      if (!ast) {
        return null;
      }

      const bindings = collectBindings(ast);
      const mutatedBindings = collectMutatedBindings(ast);
      const localCandidates = collectCandidates(ast, opts, bindings, mutatedBindings, code);
      const importedCandidates = collectImportedCandidates(ast, id, opts.names);

      const candidates = new Map<string, FunctionCandidate>();
      for (const [name, candidate] of importedCandidates.entries()) {
        candidates.set(name, candidate);
      }
      for (const [name, candidate] of localCandidates.entries()) {
        candidates.set(name, candidate);
      }

      if (candidates.size === 0) {
        return null;
      }

      const callSites = collectCallSites(ast, candidates);
      if (callSites.length === 0) {
        return null;
      }

      const localCallSites = callSites.filter((callSite) => localCandidates.has(callSite.name));
      const removableCandidates = collectRemovableCandidates(ast, localCandidates, localCallSites);
      const removalRanges = toRemovalRanges(localCandidates, removableCandidates);
      const effectiveCallSites =
        removalRanges.length > 0
          ? callSites.filter((callSite) => !isRangeInsideAny(callSite.start, callSite.end, removalRanges))
          : callSites;

      if (effectiveCallSites.length === 0 && removalRanges.length === 0) {
        return null;
      }

      const MagicStringCtor = MagicString as unknown as typeof import('magic-string').default;
      const magicString = new MagicStringCtor(code);
      let changed = false;

      for (let i = effectiveCallSites.length - 1; i >= 0; i--) {
        const callSite = effectiveCallSites[i];
        const candidate = candidates.get(callSite.name);
        if (!candidate) {
          continue;
        }

        const replacement = expandAtCallSite(code, callSite, candidate);
        magicString.overwrite(callSite.replaceStart, callSite.replaceEnd, replacement);
        changed = true;
      }

      for (let i = removalRanges.length - 1; i >= 0; i--) {
        const removalRange = removalRanges[i];
        magicString.remove(removalRange.start, removalRange.end);
        changed = true;
      }

      if (!changed) {
        return null;
      }

      return {
        code: magicString.toString(),
        map: null,
      };
    },
  };
}
