'use strict';

/**
 * validation module,
 * based on `vnu-jar`
 * @module
 */

// ----------------------------------------
// Imports
// ----------------------------------------

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const exec = require('child_process').exec;
const vnuJar = require('vnu-jar');
const _ = require('lodash');

const renderHtml = require('./render-html');

// ----------------------------------------
// Private
// ----------------------------------------

/**
 * vnu command
 * @const {string}
 * @private
 * @sourceCode
 */
const vnuCmd = `java -Xss1024k -jar ${vnuJar}`;

/**
 * List of command line arguments without value
 * @const {Array.<string>}
 * @private
 * @sourceCode
 */
const booleanArgs = [
	'errorsOnly',
	'exitZeroAlways',
	'skipNonHtml',
	'verbose',
	'version'
];

/**
 * List of available formats.
 * @const {Map}
 * @private
 * @sourceCode
 */
const formatList = new Map([
	['gnu', true],
	['xml', true],
	['json', true],
	['text', true]
]);

/**
 * Transform string from camelCase style to dash
 * @param {string} str
 * @returns {string}
 * @private
 * @sourceCode
 */
function camel2dash (str) {
	return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

/**
 * Get run options from user settled options
 * @param {Object} [userOptions={}]
 * @returns {Object}
 * @private
 * @sourceCode
 */
function getOptions (userOptions = {}) {
	let options = _.cloneDeep(userOptions);

	if (options.format === 'html') {
		options.outputAsHtml = true;
		options.verbose = true;
		options.format = 'json';
	}

	return options;
}

/**
 * Get arguments from given object
 * @param {Object} options
 * @returns {Array}
 * @private
 * @sourceCode
 */
function getArgvFromObject (options) {
	let argv = [];
	let format = options.format;

	if (formatList.get(format)) {
		argv.push(`--format ${format}`);
	}

	if (!!options.asciiquotes) {
		argv.push('--asciiquotes yes');
	}

	if (options.stream === false) {
		argv.push('--no-stream');
	}

	booleanArgs.forEach(key => {
		if (options[key]) {
			argv.push(`--${camel2dash(key)}`);
		}
	});

	return argv;
}

// ----------------------------------------
// Public
// ----------------------------------------

/**
 * Validate given path
 * @param {string} validationPath
 * @param {Object} userOptions
 * @param {Function} done
 */
function nodeW3CValidator (validationPath, userOptions, done) {
	let options = getOptions(userOptions);
	let execPath = [vnuCmd].concat(getArgvFromObject(options), validationPath);
	console.log(execPath.join(' '));

	exec(execPath.join(' '), function (err, stdout, stderr) {
		let output = stdout;

		if (err !== null) {
			output = stderr;

			if (options.outputAsHtml) {
				output = renderHtml(output);
			}
		}
		done(err, output);
	});
}

/**
 * Write file
 * @param {string} file
 * @param {string|Buffer} data
 * @param {function} [done] - if exist - it will asynchronous writes data to a file
 */
nodeW3CValidator.writeFile = function (file, data, done) {
	let dir = path.dirname(file);

	if (typeof done === 'function') {
		mkdirp(dir, (err) => {
			if (err) {
				throw new Error(err);
			}
			fs.writeFile(file, data, done);
		});
	} else {
		mkdirp.sync(dir);
		fs.writeFileSync(file, data);
	}
};

// ----------------------------------------
// Exports
// ----------------------------------------

module.exports = nodeW3CValidator;