const init = require('../src/basic');

describe('getActiveRevision', () => {
	it('returns null when no revision is saved', () => {
		const { getActiveRevision } = init({
			readRevision: async () => null,
		});
		return expect(getActiveRevision()).resolves.toBeNull();
	});

	it('returns the active id when a revision is saved', () => {
		const revisionId = 'D1234';
		const { getActiveRevision } = init({
			readRevision: async () => revisionId,
		});
		return expect(getActiveRevision()).resolves.toBe(revisionId);
	});
});
