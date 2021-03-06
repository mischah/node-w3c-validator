#!/usr/bin/env node

// ----------------------------------------
// Imports
// ----------------------------------------

const path = require('path');
const program = require('commander');
const pkg = require('../package.json');
const nodeW3CValidator = require('../lib/validator');

// ----------------------------------------
// Private
// ----------------------------------------

// setup
program
	.version(pkg.version)
	.usage('[options] <pattern>')
	.option('-i, --input [path]', 'Validate input path')
	.option('-a, --asciiquotes', 'Specifies whether ASCII quotation marks are substituted for Unicode smart quotation marks in messages.')
	.option('-e, --errors-only', 'Specifies that only error-level messages and non-document-error messages are reported (so that warnings and info messages are not reported)')
	// .option('-q, --exit-zero-always', 'Makes the checker exit zero even if errors are reported for any documents')
	.option('--filterfile [filename]', 'Specifies a filename. Each line of the file contains either a regular expression or starts with "#" to indicate the line is a comment. Any error message or warning message that matches a regular expression in the file is filtered out (dropped/suppressed)')
	.option('--filterpattern [pattern]', 'Specifies a regular-expression pattern. Any error message or warning message that matches the pattern is filtered out (dropped/suppressed)')
	.option('-f, --format [gnu|xml|json|text|html]', 'Specifies the output format for reporting the results')
	.option('-s, --skip-non-html', 'Skip documents that don’t have *.html, *.htm, *.xhtml, or *.xht extensions.')
	.option('-H, --html', 'Forces any *.xhtml or *.xht documents to be parsed using the HTML parser')
	.option('--no-langdetect', 'Disables language detection, so that documents are not checked for missing or mislabeled html[lang] attributes.')
	.option('--no-stream', 'Forces all documents to be be parsed in buffered mode instead of streaming mode (causes some parse errors to be treated as non-fatal document errors instead of as fatal document errors)')
	.option('-v, --verbose', 'Specifies "verbose" output (currently this just means that the names of files being checked are written to stdout)')
	.option('-o, --output [path]', 'Write reporting result to the path')
	.parse(process.argv);

/**
 * Properties list for auto detecting
 * @const {Array.<string>}
 * @private
 * @sourceCode
 */
const cliProps = [
	'asciiquotes',
	'errorsOnly',
	'exitZeroAlways',
	'format',
	'skipNonHtml',
	'html',
	'stream',
	'verbose'
];

/**
 * Detect user's specified properties
 * @returns {Object}
 * @private
 * @sourceCode
 */
function detectUserOptions () {
	let outputPath = program.output;
	let userOptions = {
		output: false
	};

	cliProps.forEach(prop => {
		let value = program[prop];

		if ((prop === 'stream' || prop === 'langdetect') && value) {
			return;
		}
		if (value !== undefined) {
			userOptions[prop] = value;
		}
	});
	if (typeof outputPath === 'string' && outputPath.length) {
		userOptions.output = outputPath;
	}
	return userOptions;
}

/**
 * Detect  input path where testing files lies
 * @returns {*}
 */
function detectUserInput () {
	let validatePath = program.input;

	if (typeof validatePath !== 'string') {
		validatePath = process.cwd();
	} else {
		if (!(/^(http(s)?:)?\/\//i.test(validatePath))) {
			validatePath = path.resolve(validatePath).replace(/\\/g, '/');
		}
	}
	return validatePath;
}

const userOptions = detectUserOptions();
const validatePath = detectUserInput();

// ----------------------------------------
// Initialize
// ----------------------------------------

nodeW3CValidator(validatePath, userOptions, function (err, output) {
	if (err === null) {
		return;
	}
	if (userOptions.output) {
		console.log('Resulting report will be written in path:');
		console.log(userOptions.output);
		nodeW3CValidator.writeFile(userOptions.output, output);
	} else {
		console.log('Resulting report:');
		console.log(output);
	}
	console.log(' ');
});
