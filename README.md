# actions-aws-ssm-params-to-env

This is a github action to convert SSM parameters to environment variables. It will handle
simple JSON structures, or literal values. If you utilize the AWS action for setting
your credentials or assume a role, you will not need to explicitly include the AWS environment
variables in this action's step.

## Usage:
To pull value from existing object

```yaml
- uses: Produce8/actions-aws-ssm-params-to-env@v1.2
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }} # required
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }} # required
    AWS_DEFAULT_REGION: ap-northeast-2 # required
  with:
    ssm-path: /path/to/parameter # required
    prefix: SSM_ # optional
    decryption: true # optional, default false
    nullable: false # optional, default false
```

To pull value if paramter store value exists, or create a parameter store entry with a given value if one doesn't exist:

```yaml
- uses: Produce8/actions-aws-ssm-params-to-env@v1.2
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }} # required
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }} # required
    AWS_DEFAULT_REGION: ap-northeast-2 # required
  with:
    ssm-path: /path/to/parameter # required
    ssm-value: # optional (but necessary for creating new paramater store value)
    ssm-value-type # optional (but necessary for creating new paramater store value)
    prefix: SSM_ # optional
    json-as-string # optional, default false
    decryption: true # optional, default false
    nullable: false # optional, default false
```

---

## Options:

### ssm-path(required)

AWS Systems Manager Parameter Store path to the parameter
(e.g. `/path/to/parameter`)

### ssm-value(optional)

String, StringList or SecureString value to write to a new Parmeter Store path if it does not exist

### ssm-value-type(optional)

String, StringList or SecureString

### prefix(optional)

Add prefix in front of environment variable name
(e.g. `prefix: SSM_VAR_` will export `SSM_VAR_ENV_VAR="value"`)

### decryption(optional)

Boolean which indicates whether the parameter should be decrypted or not

### **Note on decryption:**

You should take care in utilizing encrypted values, as GitHub actions will not automatically redact
the value of such parameters from your logs.

### nullable(optional)

Boolean which indicates whether the parameter needs to exist

### json-as-string(optional)

Boolean which - when true - overwrites default behavior of parsing JSON objects into separate environment variables

---

## Example output:

### JSON data as the parameter value

If you have an ssm parameter path of `/application/staging/parameter` with the following value:

```JSON
{
  "APPLICATION_URL": "https://api.com",
  "DB_NAME": "somedbname"
}
```

the action will set environment variables for you for each key/value pair of the JSON.
`$APPLICATION_URL` will be set to `https://api.com` and
`$DB_NAME` will be set to `somedbname`.

To avoid this default behavior and treat the json object as a string, use the json-as-string parameter.

### String data

If you have an ssm parameter path of `/application/staging/parameter` with the value:
`ParameterValue`, the action will set an environment variable for you such that `echo $parameter`
will output `ParameterValue`.

---

### License

MIT
