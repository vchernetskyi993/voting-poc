# Welcome to your CDK Java project!

This is a blank project for CDK development with Java.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

It is a [Maven](https://maven.apache.org/) based project, so you can open this project with any Maven compatible Java IDE to build and run tests.

## Useful commands

 * `mvn package`     compile and run tests
 * `cdk ls`          list all stacks in the app
 * `cdk synth`       emits the synthesized CloudFormation template
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk docs`        open CDK documentation

Enjoy!

```shell
aws ssm get-parameter \
  --name /ec2/keypair/$(aws ec2 describe-key-pairs --key-names FabricEC2Key | jq -r ".KeyPairs[0].KeyPairId") \
  --with-decryption \
  | jq -r ".Parameter.Value" > e2c.pem

chmod 400 e2c.pem
```
