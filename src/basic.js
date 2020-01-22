function init(options = {}) {
	const getActiveRevision = async () => options.readRevision();

	const setActiveRevision = async id => options.writeRevision(id);

	return {
		getActiveRevision,
		setActiveRevision,
	};
}

module.exports = init;
