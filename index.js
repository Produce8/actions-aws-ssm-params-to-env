const core = require("@actions/core");
const ssm = require("./ssm-helper");

const execSync = require("child_process").execSync;

async function run_action() {
  const ssmPath = core.getInput("ssm-path", { required: true });
  const ssmValue = core.getInput("ssm-value");
  const ssmType = core.getInput("ssm-value-type");
  const prefix = core.getInput("prefix");
  const decryption = core.getInput("decryption") === "true";
  const nullable = core.getInput("nullable") === "true";
  const jsonAsString = core.getInput("json-as-string") === "true";
  const region = process.env.AWS_DEFAULT_REGION;

  try {
    const paramValue = await ssm.getParameter(ssmPath, decryption, region);
    jsonOrString(paramValue, core, prefix, ssmPath, jsonAsString);
  } catch (error) {
    core.debug(`Error name: ${error.name}`);
    if (error.name === "ParameterNotFound") {
      core.debug(`could not find parameter, attemping to create parameter`);
      ssm.createSsmValue(ssmPath, region, ssmValue, ssmType, core, nullable);
      jsonOrString(ssmValue, core, prefix, ssmPath, jsonAsString);
      return;
    } else {
      core.debug(`could not find parameter: ${error.message}`);
    }
  }
}

function parseValue(val) {
  try {
    return JSON.parse(val);
  } catch (error) {
    core.debug(
      "JSON parse failed - assuming parameter is to be taken as a string literal"
    );
    return val;
  }
}

function setEnvironmentVar(key, value) {
  cmdString = `echo "${key}=${value}" >> $GITHUB_ENV`;
  core.debug(`Running cmd: ${cmdString}`);
  execSync(cmdString, { stdio: "inherit" });
}

function jsonOrString(paramValue, core, prefix, ssmPath, jsonAsString) {
  const parsedValue = parseValue(paramValue);
  if (jsonAsString) {
    const envVarName = getEnvName(ssmPath, prefix);
    core.debug(`Using prefix + end of ssmPath for env var name: ${envVarName}`);
    return setEnvironmentVar(envVarName, paramValue);
  }
  if (typeof parsedValue === "object") {
    core.debug(`parsedValue: ${JSON.stringify(parsedValue)}`);
    // Assume basic JSON structure
    for (const key in parsedValue) {
      setEnvironmentVar(prefix + key, parsedValue[key]);
    }
    return;
  } else {
    core.debug(`parsedValue: ${parsedValue}`);
    // Set environment variable with ssmPath name as the env variable
    const envVarName = getEnvName(ssmPath, prefix);
    core.debug(`Using prefix + end of ssmPath for env var name: ${envVarName}`);
    return setEnvironmentVar(envVarName, parsedValue);
  }
}

function getEnvName(path, prefix) {
  const split = path.split("/");
  return prefix + split[split.length - 1];
}

run_action();
