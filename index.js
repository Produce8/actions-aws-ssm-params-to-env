const core = require('@actions/core');
const ssm = require('./ssm-helper');

const execSync = require('child_process').execSync;

async function run_action() {
    const ssmPath = core.getInput('ssm-path', { required: true });
    const prefix = core.getInput('prefix');
    const region = process.env.AWS_DEFAULT_REGION;
    const decryption = core.getInput('decryption') === 'true';
    const nullable = core.getInput('nullable') === 'true';

    try {

        paramValue = await ssm.getParameter(ssmPath, decryption, region);
        parsedValue = parseValue(paramValue);
        if (typeof(parsedValue) === 'object') {
            core.debug(`parsedValue: ${JSON.stringify(parsedValue)}`);
            // Assume basic JSON structure
            for (var key in parsedValue) {
                setEnvironmentVar(prefix + key, parsedValue[key])
            }
        } else {
            core.debug(`parsedValue: ${parsedValue}`);
            // Set environment variable with ssmPath name as the env variable
            var split = ssmPath.split('/');
            var envVarName = prefix + split[split.length - 1];
            core.debug(`Using prefix + end of ssmPath for env var name: ${envVarName}`);
            setEnvironmentVar(envVarName, parsedValue);
        }
        
    } catch (error) {
        if(!nullable) {
            core.setFailed(error.message);
        } else {
            core.debug(`could not find parameter: ${error.message}`);
        }
    }
}


function parseValue(val) {
    try {
        return JSON.parse(val);
    } catch (error) {
        core.debug('JSON parse failed - assuming parameter is to be taken as a string literal');
        return val;
    }
}

function setEnvironmentVar(key, value) {
    cmdString = `echo "${key}=${value}" >> $GITHUB_ENV`;
    core.debug(`Running cmd: ${cmdString}`);
    execSync(cmdString, {stdio: 'inherit'});
}

run_action();