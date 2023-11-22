/* eslint-disable new-cap */
import cloudform, {DeletionPolicy, Fn, S3} from 'cloudform';
import Output from 'cloudform-types/types/output';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type StackOutputs = {
  region: string;
  bucket: string;
  url: string;
};

export function getStackTemplate(stackName: string, region: string) {
  return JSON.parse(
    cloudform({
      Description: `Cloudformation`,

      Outputs: {
        region: {
          Value: region,
        },
        bucket: {
          Value: Fn.Ref('Bucket'),
        },
        url: {
          Value: Fn.GetAtt('Bucket', 'WebsiteURL'),
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } as {[Key in keyof StackOutputs]: Output},

      Resources: {
        Bucket: new S3.Bucket({
          BucketName: stackName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false,
          },
          WebsiteConfiguration: {
            IndexDocument: 'index.html',
          },
        }).deletionPolicy(DeletionPolicy.Delete),

        BucketPolicy: new S3.BucketPolicy({
          Bucket: Fn.Ref('Bucket'),
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [Fn.Join('', [Fn.GetAtt('Bucket', 'Arn'), '/*'])],
              },
            ],
          },
        }).dependsOn(['Bucket']),
      },
    }),
  );
}
