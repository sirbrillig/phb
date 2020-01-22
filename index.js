const exec = require('./utils').exec;

(async function() {
	const output = await exec('ls', ['-l'], { echoOutput: false });
	await exec('rm', ['-i', 'testfile.js']);

	console.log('output is', output);

	process.exit(); // Necessary to stop the pipe from exec
})();
