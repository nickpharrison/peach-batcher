

/**
 * Generates (and caches) speech synthesis after constructing a Google TTS request object
 * @param {T[]} arr Input array containing inputs to be passed to the callback in sequential order
 * @param {number} threadCount A positive integer corresponding to how many batches of the callback can be running concurrently
 * @param {{isCancellationRequested: boolean}} cancellationToken An object containing a single property the will change to something truthy when a request to cancel the batch is made
 * @param {(input: T) => Promise<R>} callback The function to be run for each item in arr
 * @returns {Promise<R[]>} A promise that resolves to an array of all the responses of the callback. The order of the results is guaranteed to be in the same order as the inputs supplied in arr. If the batch is cancelled part way through, the promise will still resolve but will only be of a length corresponding to the number of inputs processed before being cancelled.
 * @typedef T
 * @typedef R
 */
const batchMapper = (arr, threadCount, cancellationToken, callback) => {
	if (typeof cancellationToken === 'function') {
		callback = cancellationToken;
		cancellationToken = undefined;
	}
	return new Promise((resolve, reject) => {
		const newArr = arr.map(x => x);
		const originalArrLength = newArr.length;
		if (!Number.isInteger(threadCount) || threadCount < 1) {
			reject('threadCount must be a positive integer');
			return;
		}
		const output = [];
		let cancel = false;
		const func = async (thing, itemOrder) => {
			if (cancel || (cancellationToken != null && cancellationToken.isCancellationRequested)) {
				cancel = true;
				return;
			}
			try {
				const outt = await callback(thing);
				output.push({item: outt, order: itemOrder});
			} catch (err) {
				cancel = true;
				reject(err);
				return;
			}
			if (newArr.length === 0) {
				return;
			}
			const nextThing = newArr.shift();
			await func(nextThing, originalArrLength - newArr.length);
		};
		const promises = [];
		for (let i = 0; i < threadCount; i++) {
			if (newArr.length === 0) {
				break;
			}
			const nextThing = newArr.shift();
			promises.push(func(nextThing, originalArrLength - newArr.length));
		}
		Promise.all(promises).then(() => {
			resolve(output.sort((a, b) => a.order - b.order).map(x => x.item));
		});
	});
}

module.exports = batchMapper;
