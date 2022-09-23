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
# retrieve ssh private key
aws ssm get-parameter \
  --name /ec2/keypair/$(aws ec2 describe-key-pairs --key-names FabricEC2Key | jq -r ".KeyPairs[0].KeyPairId") \
  --with-decryption \
  | jq -r ".Parameter.Value" > ec2.pem

chmod 600 ec2.pem

# retrieve ec2 address
EC2_PUBLIC_DNS=$(aws ec2 describe-instances \
    --filters Name=tag:Name,Values=ElectionsAwsStack/FabricClient/FabricEC2Client \
    | jq -r ".Reservations[0].Instances[0].PublicDnsName")

# ssh into ec2 using private key
ssh -i ec2.pem ec2-user@$EC2_PUBLIC_DNS
```
