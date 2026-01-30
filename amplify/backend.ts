import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { AuthorizationType, Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { getPhotoList } from "./functions/getPhotoList/resource.js";
import { listFolders } from "./functions/listFolders/resource.js";
import { movePhoto } from "./functions/movePhoto/resource.js";
import { publicPhotos } from "./functions/publicPhotos/resource.js";
import { uploadImageFunction } from "./functions/uploadImageFunction/resource.js";

const backend = defineBackend({
  getPhotoList,
  listFolders,
  movePhoto,
  publicPhotos,
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

backend.publicPhotos.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.publicPhotos.addEnvironment(
  "CLOUDFRONT_DOMAIN",
  distribution.domainName,
);

backend.movePhoto.addEnvironment("BUCKET_NAME", photoBucket.bucketName);

backend.createFolder.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.createInvite.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.createInvite.addEnvironment(
  "INVITES_TABLE_NAME",
  invitesTable.tableName,
);
backend.listFolders.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.acceptInvite.addEnvironment(
  "INVITES_TABLE_NAME",
  invitesTable.tableName,
);
backend.acceptInvite.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);

foldersTable.grantReadWriteData(backend.createFolder.resources.lambda);
foldersTable.grantReadData(backend.createInvite.resources.lambda);
foldersTable.grantReadData(backend.uploadImageFunction.resources.lambda);
foldersTable.grantReadData(backend.listFolders.resources.lambda);
invitesTable.grantReadWriteData(backend.createInvite.resources.lambda);
invitesTable.grantReadData(backend.acceptInvite.resources.lambda);

backend.acceptInvite.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminAddUserToGroup",
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
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

const foldersIntegration = new LambdaIntegration(backend.createFolder.resources.lambda);
const foldersResource = restApi.root.addResource("folders");
foldersResource.addMethod("POST", foldersIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});
const listFoldersIntegration = new LambdaIntegration(backend.listFolders.resources.lambda);
foldersResource.addMethod("GET", listFoldersIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const invitesIntegration = new LambdaIntegration(backend.createInvite.resources.lambda);
const invitesResource = restApi.root.addResource("invites");
invitesResource.addMethod("POST", invitesIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const acceptInviteIntegration = new LambdaIntegration(backend.acceptInvite.resources.lambda);
const acceptInviteResource = restApi.root.addResource("accept-invite");
acceptInviteResource.addMethod("POST", acceptInviteIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const movePhotoIntegration = new LambdaIntegration(backend.movePhoto.resources.lambda);
const movePhotoResource = restApi.root.addResource("move-photo");
movePhotoResource.addMethod("POST", movePhotoIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
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
