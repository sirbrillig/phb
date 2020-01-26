const { spawn } = require('child_process');

function exec(command, args, { echoCommand = true, echoOutput = true } = {}) {
	return new Promise(resolve => {
		if (echoCommand) {
			console.log(command, args.join(' '));
		}

		let output = '';

		const child = spawn(command, args, {});
		process.stdin.pipe(child.stdin);
		child.stdout.on('data', data => {
			output += data;
			if (echoOutput) {
				process.stdout.write(data);
			}
		});
		child.stderr.pipe(process.stderr);
		child.on('close', () => {
			resolve(output);
		});
	});
}

module.exports = { exec };
