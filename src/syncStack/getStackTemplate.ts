/* eslint-disable new-cap */
import cloudform, {DeletionPolicy, Fn, S3} from 'cloudform';
import Output from 'cloudform-types/types/output';

export type StackOutputs = {
  Bucket: string;
  URL: string;
};

export function getStackTemplate(stackName: string) {
  return JSON.parse(
    cloudform({
      Description: `Cloudformation`,

      Outputs: {
        Bucket: {
          Value: Fn.Ref('Bucket'),
        },
        URL: {
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
