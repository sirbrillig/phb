const noop = async () => null;
const defaultOptions = {
	readRevision: noop,
	writeRevision: noop,
	readDiff: noop,
	writeDiff: noop,
	readAllDiffs: noop,
	runArcCommand: noop,
	runArcConduitCommand: noop,
};

function init(options) {
	options = { ...defaultOptions, ...options };
	const getActiveRevision = async () => options.readRevision();

	const setActiveRevision = async id => options.writeRevision(id);

	const getActiveDiff = async () => {
		const revisionId = await getActiveRevision();
		if (!revisionId) {
			return null;
		}
		const diffId = await options.readDiff();
		if (!diffId) {
			return null;
		}
		const idsInRevision = await options.readAllDiffs(revisionId);
		if (!idsInRevision.includes(diffId)) {
			return null;
		}
		return diffId;
	};

	const setActiveDiff = async id => options.writeDiff(id);

	const createNewRevision = async () => {
		const output = await options.runArcCommand('diff --create');
		if (!output) {
			throw new Error('Arc command did not return anything');
		}
		const results = output.match(/Revision URI.+\/+(D\d+)$/m);
		if (!results || results.length < 2) {
			throw new Error('Could not find revision id in arc command output');
		}
		const revisionId = results[1];
		options.writeRevision(revisionId);

		const jsonData = options.runArcConduitCommand('differential.query', {
			ids: [stripDFromRevisionId(revisionId)],
		});
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
		options.writeDiff(diffIds[diffIds.length - 1]);
	};

	return {
		getActiveRevision,
		setActiveRevision,
		getActiveDiff,
		setActiveDiff,
		createNewRevision,
	};
}

function stripDFromRevisionId(revisionId) {
	return revisionId.substr(1);
}

module.exports = init;
