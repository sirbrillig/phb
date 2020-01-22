const init = require('../src/basic');

describe('getActiveRevision', () => {
	it('returns null when no revision is saved', async () => {
		const { getActiveRevision } = init({
			readRevision: async () => null,
		});
		const id = await getActiveRevision();
		expect(id).toBeNull();
	});

	it('returns the active revision id when a revision is saved', async () => {
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

describe('getActiveDiff', () => {
	it('returns null when no revision is saved', async () => {
		const { getActiveDiff } = init({
			readRevision: async () => null,
			readDiff: async () => '321',
			readAllDiffs: async () => ['111', '222', '444'],
		});
		const id = await getActiveDiff();
		expect(id).toBeNull();
	});

	it('returns null when a revision is saved but the diff id is not in the revision', async () => {
		const revisionId = 'D1234';
		const { getActiveDiff } = init({
			readRevision: async () => revisionId,
			readDiff: async () => '321',
			readAllDiffs: async revision =>
				revision === revisionId ? ['111', '222', '444'] : ['443'],
		});
		const id = await getActiveDiff();
		expect(id).toBeNull();
	});

	it('returns null when a revision is saved but no diff id is saved', async () => {
		const revisionId = 'D1234';
		const { getActiveDiff } = init({
			readRevision: async () => revisionId,
			readDiff: async () => null,
			readAllDiffs: async revision =>
				revision === revisionId ? ['111', '222', '444'] : ['443'],
		});
		const id = await getActiveDiff();
		expect(id).toBeNull();
	});

	it('returns the diff id when a revision is saved and the diff id is in the revision', async () => {
		const revisionId = 'D1234';
		const { getActiveDiff } = init({
			readRevision: async () => revisionId,
			readDiff: async () => '222',
			readAllDiffs: async revision =>
				revision === revisionId ? ['111', '222', '444'] : ['443'],
		});
		const id = await getActiveDiff();
		expect(id).toBe('222');
	});
});
