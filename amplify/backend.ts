import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { AuthorizationType, Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { getPhotoList } from "./functions/getPhotoList/resource.js";
import { uploadImageFunction } from "./functions/uploadImageFunction/resource.js";

const backend = defineBackend({
  getPhotoList,
  uploadImageFunction,
});

const apiStack = backend.createStack("PhotoApiStack");
const infraStack = backend.createStack("PhotoInfraStack");

const photoBucket = Bucket.fromBucketName(
  infraStack,
  "PhotoAssetsBucket",
  "my-photo-site-assets",
);

const originAccessIdentity = new OriginAccessIdentity(
  infraStack,
  "PhotoAssetsOAI",
);

const distribution = new Distribution(infraStack, "PhotoAssetsDistribution", {
  defaultBehavior: {
    origin: new S3Origin(photoBucket, { originAccessIdentity }),
  },
});

photoBucket.grantRead(originAccessIdentity);
photoBucket.grantReadWrite(backend.uploadImageFunction.resources.lambda);
photoBucket.grantRead(backend.getPhotoList.resources.lambda);

backend.uploadImageFunction.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.getPhotoList.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.getPhotoList.addEnvironment(
  "CLOUDFRONT_DOMAIN",
  distribution.domainName,
);

const restApi = new RestApi(apiStack, "PhotoApi", {
  restApiName: "photo-site-api",
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
  },
});

const uploadImageIntegration = new LambdaIntegration(backend.uploadImageFunction.resources.lambda);
const uploadResource = restApi.root.addResource("upload-image");
uploadResource.addMethod("POST", uploadImageIntegration, {
  authorizationType: AuthorizationType.NONE,
});

const listPhotosIntegration = new LambdaIntegration(backend.getPhotoList.resources.lambda);
const photosResource = restApi.root.addResource("photos");
photosResource.addMethod("GET", listPhotosIntegration, {
  authorizationType: AuthorizationType.NONE,
});
photosResource.addMethod("POST", listPhotosIntegration, {
  authorizationType: AuthorizationType.NONE,
});

backend.addOutput({
  custom: {
    cloudfront: {
      domain: distribution.domainName,
    },
    photoApi: {
      url: restApi.url,
      name: restApi.restApiName,
      region: Stack.of(apiStack).region,
    },
  },
});
