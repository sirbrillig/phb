function init(options = {}) {
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

	return {
		getActiveRevision,
		setActiveRevision,
		getActiveDiff,
	};
}

module.exports = init;
