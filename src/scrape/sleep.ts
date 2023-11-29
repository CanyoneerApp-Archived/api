import {clearTimeout} from 'timers';

export function sleep(milliseconds: number): CancelablePromise<void> {
  const promise = new CancelablePromise<void>(resolve => {
    const timeout = setTimeout(resolve, milliseconds);
    return () => clearTimeout(timeout);
  });

  return promise;
}

class CancelablePromise<T> implements PromiseLike<T> {
  cancel: () => void = () => {
    throw new Error('Cancel not set');
  };
  promise: Promise<T>;

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void,
    ) => () => void,
  ) {
    this.promise = new Promise((resolve, reject) => {
      this.cancel = executor(resolve, reject);
    });
  }

  then: Promise<T>['then'] = (...args) => this.promise.then(...args);
}
