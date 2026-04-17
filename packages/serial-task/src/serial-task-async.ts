import { $define } from '@shared';

import type { Fn, SerialTaskOptions, TaskifyAsync, TaskReturn } from './global.js';
import { normalize } from './common.js';

/**
 * ## Usage
 * Use this when you have async functions in tasks, conditions or result wrapper
 *
 * Creates an async serial task function that executes a series of functions in order
 * - all given functions(`options.tasks`) will be called in order
 * - generated task function will have the same length as the first task function
 * - you can appoint generated task function's name by `options.name`
 * - **Strongly Recommended**: all task functions have same input type and output type
 *   - returned function.length will be the same as the first task function's length
 * @param opts Options for creating a serial task, details in `SerialTaskOptions`
 * @returns a funtcion that executes the tasks in order, returns `TaskReturn<OriginalReturn>`
 *
 * __PKG_INFO__
 */
export function createSerialTaskAsync<F extends Fn>(opts: SerialTaskOptions<F>): TaskifyAsync<F> {
  type R = ReturnType<F>;

  const { name, tasks, breakCondition, skipCondition, resultWrapper } = normalize(opts);

  if (tasks.length === 0) {
    const fn = () =>
      ({
        value: undefined,
        results: [],
        trivial: true,
        breakAt: -1,
        skipped: [],
      }) as TaskReturn<undefined>;
    $define(fn, 'name', { value: name, configurable: true });
    return fn as unknown as TaskifyAsync<F>;
  }

  // & creating the task
  const fn = async function (...args: Parameters<F>): Promise<TaskReturn<R>> {
    let last = undefined as R;

    const results = new Array<R>(tasks.length);

    let breakAt = -1;
    const skipped: number[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i] as F;

      const input = (await Promise.try(resultWrapper as any, task, i, tasks, args, last)) as Parameters<F>;

      const toBreak = await Promise.try(breakCondition as any, task, i, tasks, args, last);
      if (toBreak) {
        breakAt = i;
        break; // end this task
      }

      const toSkip = await Promise.try(skipCondition as any, task, i, tasks, args, last);
      if (toSkip) {
        skipped.push(i);
        continue; // skip this task
      }

      last = (await Promise.try(task as (...args: Parameters<F>) => R, ...input)) as R;
      results[i] = last;
    }

    return { value: last, results, trivial: false, breakAt, skipped };
  };

  if (name) {
    $define(fn, 'name', { value: name, configurable: true });
  }
  $define(fn, 'length', { value: tasks[0].length, configurable: true });
  return fn;
}
