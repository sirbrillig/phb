const init = require('../src/basic');

const runArcConduitCommand = jest.fn((command, jsonData) => {
	if (command !== 'differential.query' || jsonData.ids[0] !== '111') {
		return '';
	}
	return {
		error: null,
		errorMessage: null,
		response: [
			{
				id: '38040',
				phid: 'PHID-DREV-vfr6npam4evwszcx5742',
				title: 'Test: please ignore',
				uri: 'https://foo.bar/D111',
				dateCreated: '1579737848',
				dateModified: '1579737893',
				authorPHID: 'PHID-USER-gfvuj2mzypkxkkob5xkk',
				status: '0',
				statusName: 'Needs Review',
				properties: {
					'draft.broadcast': true,
					'lines.added': 1,
					'lines.removed': 0,
					buildables: {
						'PHID-HMBB-nswgn5jtooq65l6qxbj6': {
							status: 'passed',
						},
					},
				},
				branch: '/trunk',
				summary: 'Test: please ignore',
				testPlan: 'Test: please ignore',
				lineCount: '1',
				activeDiffPHID: 'PHID-DIFF-txwzq47lyai7hnreazpg',
				diffs: ['424'],
				commits: [],
				reviewers: [],
				ccs: [],
				hashes: [],
				auxiliary: {
					'phabricator:projects': [],
					'phabricator:depends-on': [],
				},
				repositoryPHID: 'PHID-REPO-ize2tghjqyxkkvaa5pjr',
				sourcePath: '/home/public_html_svn/',
			},
		],
	};
});

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

describe('setActiveDiff', () => {
	it('saves the diff id', async () => {
		let savedDiff;
		const { setActiveDiff, getActiveDiff } = init({
			readRevision: async () => 'D111',
			readDiff: async () => savedDiff,
			writeDiff: async id => (savedDiff = id),
			readAllDiffs: async revision =>
				revision === 'D111' ? ['111', '222', '444'] : ['443'],
		});
		await setActiveDiff('222');
		const id = await getActiveDiff();
		expect(id).toBe('222');
	});
});

describe('createNewRevision', () => {
	describe('with no files', () => {
		it('calls arc diff --create', async () => {
			let savedRevision;
			let savedDiff;
			const runArcCommand = jest.fn(
				() => 'Revision URI: https://foo.bar/D111'
			);

			const { createNewRevision } = init({
				readRevision: async () => savedRevision,
				writeRevision: async id => (savedRevision = id),
				readDiff: async () => savedDiff,
				writeDiff: async id => (savedDiff = id),
				readAllDiffs: async revision =>
					revision === savedRevision ? [savedDiff] : [],
				runArcCommand,
				runArcConduitCommand,
			});
			await createNewRevision();
			expect(runArcCommand).toHaveBeenCalledWith(
				expect.stringContaining('diff --create')
			);
		});

		it('saves the newly created revision id', async () => {
			let savedRevision;
			let savedDiff;
			const runArcCommand = jest.fn(command => {
				if (command !== 'diff --create') {
					return '';
				}
				return `
Created a new Differential revision:
        Revision URI: https://foo.bar/D111

Included changes:
  M     testfile.php
				`;
			});

			const { createNewRevision } = init({
				readRevision: async () => savedRevision,
				writeRevision: async id => (savedRevision = id),
				readDiff: async () => savedDiff,
				writeDiff: async id => (savedDiff = id),
				readAllDiffs: async revision =>
					revision === savedRevision ? [savedDiff] : [],
				runArcCommand,
				runArcConduitCommand,
			});
			await createNewRevision();
			expect(savedRevision).toBe('D111');
		});

		it('saves the newly created diff id', async () => {
			let savedRevision;
			let savedDiff;
			const runArcCommand = jest.fn(command => {
				if (command !== 'diff --create') {
					return '';
				}
				return `
Created a new Differential revision:
        Revision URI: https://foo.bar/D111

Included changes:
  M     testfile.php
				`;
			});

			const { createNewRevision } = init({
				readRevision: async () => savedRevision,
				writeRevision: async id => (savedRevision = id),
				readDiff: async () => savedDiff,
				writeDiff: async id => (savedDiff = id),
				readAllDiffs: async revision =>
					revision === savedRevision ? [savedDiff] : [],
				runArcCommand,
				runArcConduitCommand,
			});
			await createNewRevision();
			expect(savedDiff).toBe('424');
		});
	});
});
