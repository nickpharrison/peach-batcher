'use strict';

const test = require('tape');
const batchMapper = require('./');

test((t) => {

	t.test('mapping batches', async (t) => {

		// Normal example
		const a = await batchMapper([1, 3, 4, 5, 4, 7], 2, async input => input + 2);
		t.deepEqual(a, [3, 5, 6, 7, 6, 9]);

		// Normal example
		const b = await batchMapper(['foo', 'bar', 'yes', 'no'], 20, async input => `1${input}2`);
		t.deepEqual(b, ['1foo2', '1bar2', '1yes2', '1no2']);

		// Even when resolving in different orders
		const c = await batchMapper([3000, 100, 40, 50, 1000, 30], 3, input => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(input);
				}, input);
			});
		});
		t.deepEqual(c, [3000, 100, 40, 50, 1000, 30]);

		// Using cancellation
		const cancellationToken = {isCancellationRequested: false};
		const d = await batchMapper([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, cancellationToken, async (input) => {
			if (input === 4) {
				cancellationToken.isCancellationRequested = true;
			}
			return input;
		});
		t.deepEqual(d, [1, 2, 3, 4]);

		// Throwing an error inside
		let e;
		try {
			await batchMapper([1, 2, 3, 4], 3, async (input) => {
				if (input === 2) {
					throw 'foobar';
				}
				return input;
			});
		} catch (err) {
			e = err;
		}
		t.deepEqual(e, 'foobar');

		t.end();

	});

});