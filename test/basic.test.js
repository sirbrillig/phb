const init = require('../src/basic');

describe('getActiveRevision', () => {
	it('returns null when no revision is saved', async () => {
		const { getActiveRevision } = init({
			readRevision: async () => null,
		});
		const id = await getActiveRevision();
		expect(id).toBeNull();
	});

	it('returns the active id when a revision is saved', async () => {
		const revisionId = 'D1234';
		const { getActiveRevision } = init({
			readRevision: async () => revisionId,
		});
		const id = await getActiveRevision();
		expect(id).toBe(revisionId);
	});
});

describe('setActiveRevision', () => {
	it('saves the revision id', async () => {
		const revisionId = 'D1234';
		let activeId = null;
		const { setActiveRevision, getActiveRevision } = init({
			readRevision: async () => activeId,
			writeRevision: async id => (activeId = id),
		});
		await setActiveRevision(revisionId);
		const id = await getActiveRevision();
		expect(id).toBe(revisionId);
	});
});
