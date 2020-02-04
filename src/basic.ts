interface FileInterface {
	readRevision: () => Promise<string|null>;
	writeRevision: (data: string) => Promise<void>;
	readDiff: () => Promise<string>;
	writeDiff: (data: string) => Promise<void>;
	readAllDiffs: (revisionId: string) => Promise<string>;
}

interface ArcInterface {
	runArcCommand: (command: string) => Promise<string>;
	runArcConduitCommand: (
		command: string,
		data: object
	) => Promise<ArcConduitCommandResult>;
}

interface ArcConduitCommandResult {
	errorMessage?: string;
	response?: Array<ArcConduitResponse>;
}

interface ArcConduitResponse {
	diffs?: Array<string>;
}

interface PHBInterface {
	getActiveRevision: () => Promise<string | null>;
	setActiveRevision: (revision: string) => Promise<void>;
	getActiveDiff: () => Promise<string | null>;
	setActiveDiff: (diff: string) => Promise<void>;
	createNewRevision: () => Promise<void>;
}

function stripDFromRevisionId(revisionId: string): string {
	return revisionId.substr(1);
}

function init({
	fileInterface,
	arcInterface,
}: {
	fileInterface: FileInterface;
	arcInterface: ArcInterface;
}): PHBInterface {
	const getActiveRevision = async (): Promise<string|null> => fileInterface.readRevision();

	const setActiveRevision = async (id: string): Promise<void> =>
		fileInterface.writeRevision(id);

	const getActiveDiff = async (): Promise<string|null>=> {
		const revisionId = await getActiveRevision();
		if (!revisionId) {
			return null;
		}
		const diffId = await fileInterface.readDiff();
		if (!diffId) {
			return null;
		}
		const idsInRevision = await fileInterface.readAllDiffs(revisionId);
		if (!idsInRevision.includes(diffId)) {
			return null;
		}
		return diffId;
	};

	const setActiveDiff = async (id: string): Promise<void> => fileInterface.writeDiff(id);

	const createNewRevision = async (): Promise<void> => {
		// TODO: verify we are in root directory
		// TODO: get only modified files that do not match ignore if none are provided
		// TODO: svn add modified files that are not tracked
		// TODO: Verify that all files are in the same svn repo
		// TODO: open editor to get commit message (and use unused previously written message if it exists)
		// TODO: handle errors and allow retrying
		const output = await arcInterface.runArcCommand('diff --create');
		if (!output) {
			throw new Error('Arc command did not return anything');
		}
		const results = output.match(/Revision URI.+\/+(D\d+)$/m);
		if (!results || results.length < 2) {
			throw new Error('Could not find revision id in arc command output');
		}
		const revisionId = results[1];
		fileInterface.writeRevision(revisionId);

		const jsonData = await arcInterface.runArcConduitCommand(
			'differential.query',
			{
				ids: [stripDFromRevisionId(revisionId)],
			}
		);
		if (jsonData && jsonData.errorMessage) {
			throw new Error(
				`Revision created but an error occurred trying to find differential ids in revision "${revisionId}": ${jsonData.errorMessage}`
			);
		}
		if (
			!jsonData ||
			!jsonData.response ||
			jsonData.response.length < 1 ||
			!jsonData.response[0].diffs
		) {
			throw new Error(
				`Revision created but could not find differential ids in revision "${revisionId}"`
			);
		}
		const diffIds = jsonData.response[0].diffs;
		if (!diffIds || diffIds.length < 1) {
			throw new Error(
				`Revision created but could not find differential ids in revision "${revisionId}"`
			);
		}
		fileInterface.writeDiff(diffIds[diffIds.length - 1]);
	};

	return {
		getActiveRevision,
		setActiveRevision,
		getActiveDiff,
		setActiveDiff,
		createNewRevision,
	};
}

module.exports = init;
