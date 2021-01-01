
declare function batchMapper<T, R>(arr: T[], threadCount: number, cancellationToken: {isCancellationRequested: boolean}, callback: (input: T) => Promise<R>): Promise<R[]>;

export = batchMapper;
