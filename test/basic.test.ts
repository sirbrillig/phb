import init from '../src/basic';
import {
	FileReadPromise,
	FileReadArrayPromise,
	FileWritePromise,
	FileInterface,
	ArcInterface,
	ArcConduitCommandResult,
} from '../src/types';

const runArcConduitCommand = jest.fn(
	async (command, jsonData): Promise<ArcConduitCommandResult> => {
		if (command !== 'differential.query' || jsonData.ids[0] !== '111') {
			return {};
		}
		return {
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
	}
);

const defaultFileInterface: FileInterface = {
	readRevision: async () => null,
	writeRevision: async () => undefined,
	readDiff: async () => null,
	writeDiff: async () => undefined,
	readAllDiffs: async () => [],
};

const defaultArcInterface: ArcInterface = {
	runArcCommand: async () => '',
	runArcConduitCommand: async () => ({}),
};

describe('getActiveRevision', () => {
	it('returns null when no revision is saved', async () => {
		const { getActiveRevision } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => null,
			},
			arcInterface: defaultArcInterface,
		});
		const id = await getActiveRevision();
		expect(id).toBeNull();
	});

	it('returns the active revision id when a revision is saved', async () => {
		const revisionId = 'D1234';
		const { getActiveRevision } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => revisionId,
			},
			arcInterface: defaultArcInterface,
		});
		const id = await getActiveRevision();
		expect(id).toBe(revisionId);
	});
});

describe('setActiveRevision', () => {
	it('saves the revision id', async () => {
		const revisionId = 'D1234';
		let activeId: string | null = null;
		const { setActiveRevision, getActiveRevision } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => activeId,
				writeRevision: async (id: string): FileWritePromise => {
					activeId = id;
				},
			},
			arcInterface: defaultArcInterface,
		});
		await setActiveRevision(revisionId);
		const id = await getActiveRevision();
		expect(id).toBe(revisionId);
	});
});

describe('getActiveDiff', () => {
	it('returns null when no revision is saved', async () => {
		const { getActiveDiff } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => null,
				readDiff: async (): FileReadPromise => '321',
				readAllDiffs: async (): FileReadArrayPromise => [
					'111',
					'222',
					'444',
				],
			},
			arcInterface: defaultArcInterface,
		});
		const id = await getActiveDiff();
		expect(id).toBeNull();
	});

	it('returns null when a revision is saved but the diff id is not in the revision', async () => {
		const revisionId = 'D1234';
		const { getActiveDiff } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => revisionId,
				readDiff: async (): FileReadPromise => '321',
				readAllDiffs: async (revision: string): FileReadArrayPromise =>
					revision === revisionId ? ['111', '222', '444'] : ['443'],
			},
			arcInterface: defaultArcInterface,
		});
		const id = await getActiveDiff();
		expect(id).toBeNull();
	});

	it('returns null when a revision is saved but no diff id is saved', async () => {
		const revisionId = 'D1234';
		const { getActiveDiff } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => revisionId,
				readDiff: async (): FileReadPromise => null,
				readAllDiffs: async (revision: string): FileReadArrayPromise =>
					revision === revisionId ? ['111', '222', '444'] : ['443'],
			},
			arcInterface: defaultArcInterface,
		});
		const id = await getActiveDiff();
		expect(id).toBeNull();
	});

	it('returns the diff id when a revision is saved and the diff id is in the revision', async () => {
		const revisionId = 'D1234';
		const { getActiveDiff } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => revisionId,
				readDiff: async (): FileReadPromise => '222',
				readAllDiffs: async (revision: string): FileReadArrayPromise =>
					revision === revisionId ? ['111', '222', '444'] : ['443'],
			},
			arcInterface: defaultArcInterface,
		});
		const id = await getActiveDiff();
		expect(id).toBe('222');
	});
});

describe('setActiveDiff', () => {
	it('saves the diff id', async () => {
		let savedDiff: string | null;
		const { setActiveDiff, getActiveDiff } = init({
			fileInterface: {
				...defaultFileInterface,
				readRevision: async (): FileReadPromise => 'D111',
				readDiff: async (): FileReadPromise => savedDiff,
				writeDiff: async (id): FileWritePromise => {
					savedDiff = id;
				},
				readAllDiffs: async (revision: string): FileReadArrayPromise =>
					revision === 'D111' ? ['111', '222', '444'] : ['443'],
			},
			arcInterface: defaultArcInterface,
		});
		await setActiveDiff('222');
		const id = await getActiveDiff();
		expect(id).toBe('222');
	});
});

describe('createNewRevision', () => {
	describe('with no files', () => {
		it('calls arc diff --create', async () => {
			let savedRevision: string | null;
			let savedDiff: string | null;
			const runArcCommand = jest.fn(
				async () => 'Revision URI: https://foo.bar/D111'
			);

			const { createNewRevision } = init({
				fileInterface: {
					...defaultFileInterface,
					readRevision: async (): FileReadPromise => savedRevision,
					writeRevision: async (id: string): FileWritePromise => {
						savedRevision = id;
					},
					readDiff: async (): FileReadPromise => savedDiff,
					writeDiff: async (id: string): FileWritePromise => {
						savedDiff = id;
					},
					readAllDiffs: async (revision): FileReadArrayPromise =>
						revision === savedRevision && savedDiff
							? [savedDiff]
							: [],
				},
				arcInterface: {
					...defaultArcInterface,
					runArcCommand,
					runArcConduitCommand,
				},
			});
			await createNewRevision();
			expect(runArcCommand).toHaveBeenCalledWith(
				expect.stringContaining('diff --create')
			);
		});

		it('saves the newly created revision id', async () => {
			let savedRevision: string | null = null;
			let savedDiff: string | null;
			const runArcCommand = jest.fn(async command => {
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
				fileInterface: {
					readRevision: async (): FileReadPromise => savedRevision,
					writeRevision: async (id: string): FileWritePromise => {
						savedRevision = id;
					},
					readDiff: async (): FileReadPromise => savedDiff,
					writeDiff: async (id: string): FileWritePromise => {
						savedDiff = id;
					},
					readAllDiffs: async (
						revision: string
					): FileReadArrayPromise =>
						revision === savedRevision && savedDiff
							? [savedDiff]
							: [],
				},
				arcInterface: {
					...defaultArcInterface,
					runArcCommand,
					runArcConduitCommand,
				},
			});
			await createNewRevision();
			expect(savedRevision).toBe('D111');
		});

		it('saves the newly created diff id', async () => {
			let savedRevision: string | null = null;
			let savedDiff: string | null = null;
			const runArcCommand = jest.fn(async command => {
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
				fileInterface: {
					readRevision: async (): FileReadPromise => savedRevision,
					writeRevision: async (id: string): FileWritePromise => {
						savedRevision = id;
					},
					readDiff: async (): FileReadPromise => savedDiff,
					writeDiff: async (id: string): FileWritePromise => {
						savedDiff = id;
					},
					readAllDiffs: async (
						revision: string
					): FileReadArrayPromise =>
						revision === savedRevision && savedDiff
							? [savedDiff]
							: [],
				},
				arcInterface: {
					...defaultArcInterface,
					runArcCommand,
					runArcConduitCommand,
				},
			});
			await createNewRevision();
			expect(savedDiff).toBe('424');
		});
	});
});
