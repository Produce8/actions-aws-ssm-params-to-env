const AWS = require("aws-sdk");

const getParameter = async (ssmPath, decryption, region) => {
  AWS.config.update({ region: region });
  const ssm = new AWS.SSM();
  const params = {
    Name: ssmPath,
    WithDecryption: decryption,
  };
  const result = await ssm.getParameter(params).promise();
  return result.Parameter.Value;
};

const createSsmValue = async (
  ssmPath,
  region,
  ssmValue,
  ssmType,
  core,
  nullable
) => {
  try {
    core.info(`Storing Variable in path [${ssmPath}]`);
    // Load the AWS Region to use in SSM
    core.debug(`Setting aws-region [${region}]`);
    AWS.config.update({ region: region });
    const ssm = new AWS.SSM();
    const params = {
      Name: ssmPath,
      Value: ssmValue,
      Type: ssmType,
      Overwrite: false,
    };
    const keyId = core.getInput("ssm-kms-key-id");
    if (params["Type"] === "SecureString" && keyId !== "") {
      core.debug(`Setting the KeyId to ${keyId}`);
      params["KeyId"] = keyId;
    }
    const result = await ssm.putParameter(params);
    core.debug(
      `Parameter details Version [${result.Version}] Tier [${result.Tier}]`
    );
    core.info(`Successfully Stored parameter in path [${ssmPath}]`);
  } catch (error) {
    if (!nullable) {
      core.setFailed(error.message);
    } else {
      core.debug(`could not find parameter: ${error.message}`);
    }
  }
};

module.exports = { getParameter, createSsmValue };
