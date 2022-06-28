const core = require("@actions/core");
const ssm = require("./ssm-helper");

const execSync = require("child_process").execSync;

async function run_action() {
  const ssmPath = core.getInput("ssm-path", { required: true });
  const ssmValue = core.getInput("ssm-value");
  const ssmType = core.getInput("ssm-value-type");
  const keyName = core.getInput("key-name");
  const decryption = core.getInput("decryption") === "true";
  const nullable = core.getInput("nullable") === "true";
  const region = process.env.AWS_DEFAULT_REGION;

  try {
    const paramValue = await ssm.getParameter(ssmPath, decryption, region);
    const parsedValue = parseValue(paramValue);
    if (typeof parsedValue === "object") {
      core.debug(`parsedValue: ${JSON.stringify(parsedValue)}`);
      // Assume basic JSON structure
      for (const key in parsedValue) {
        setEnvironmentVar(keyName + key, parsedValue[key]);
      }
    } else {
      core.debug(`parsedValue: ${parsedValue}`);
      // Set environment variable with ssmPath name as the env variable
      const split = ssmPath.split("/");
      const envVarName = keyName + split[split.length - 1];
      core.debug(
        `Using keyName + end of ssmPath for env var name: ${envVarName}`
      );
      setEnvironmentVar(envVarName, parsedValue);
    }
  } catch (error) {
    if (error instanceof ParameterNotFound) {
      core.debug(`could not find parameter, attemping to create parameter`);
      createSsmValue(ssmPath, region, ssmValue, ssmType);
      run_action(ssmPath, decryption, region);
    }
    if (!nullable) {
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

run_action();
