function init(options = {}) {
	const getActiveRevision = options.readRevision;

	return {
		getActiveRevision,
	};
}

module.exports = init;
