import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { CfnBudget } from "aws-cdk-lib/aws-budgets";
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";
import { CfnWebACL, CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";
import { auth } from "./auth/resource.js";
import { acceptInvite } from "./functions/acceptInvite/resource.js";
import { addFolderUser } from "./functions/addFolderUser/resource.js";
import { backfillFolderUsers } from "./functions/backfillFolderUsers/resource.js";
import { backfillPhotoDimensions } from "./functions/backfillPhotoDimensions/resource.js";
import { createFolder } from "./functions/createFolder/resource.js";
import { createInvite } from "./functions/createInvite/resource.js";
import { deleteFolder } from "./functions/deleteFolder/resource.js";
import { deletePhoto } from "./functions/deletePhoto/resource.js";
import { duplicatePhoto } from "./functions/duplicatePhoto/resource.js";
import { getPhotoDownloadUrl } from "./functions/getPhotoDownloadUrl/resource.js";
import { getPhotoList } from "./functions/getPhotoList/resource.js";
import { listUserFolders } from "./functions/listUserFolders/resource.js";
import { listAllUsers } from "./functions/listAllUsers/resource.js";
import { listFolders } from "./functions/listFolders/resource.js";
import { listFolderUsers } from "./functions/listFolderUsers/resource.js";
import { listStuckBulkUploads } from "./functions/listStuckBulkUploads/resource.js";
import { listTags } from "./functions/listTags/resource.js";
import { movePhoto } from "./functions/movePhoto/resource.js";
import { presignBulkUpload } from "./functions/presignBulkUpload/resource.js";
import { processBulkUpload } from "./functions/processBulkUpload/resource.js";
import { publicPhotos } from "./functions/publicPhotos/resource.js";
import { removeFolderUser } from "./functions/removeFolderUser/resource.js";
import { retentionSweep } from "./functions/retentionSweep/resource.js";
import { toggleLike } from "./functions/toggleLike/resource.js";
import { unbanFolderUser } from "./functions/unbanFolderUser/resource.js";
import { updateFolder } from "./functions/updateFolder/resource.js";
import { updatePhotoTags } from "./functions/updatePhotoTags/resource.js";
import { updateTagCatalog } from "./functions/updateTagCatalog/resource.js";
import { updateUser } from "./functions/updateUser/resource.js";
import { uploadImageFunction } from "./functions/uploadImageFunction/resource.js";
import { BULK_STAGING_PREFIX } from "./functions/shared/photoPaths.js";

// Origins allowed to read API responses (see shared/response.ts). Update
// with the deployed frontend's real origin once it's live.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://www.cmirka.com",
  "https://cmirka.com",
];

const backend = defineBackend({
  auth,
  acceptInvite,
  addFolderUser,
  backfillFolderUsers,
  backfillPhotoDimensions,
  createFolder,
  createInvite,
  deleteFolder,
  deletePhoto,
  duplicatePhoto,
  getPhotoDownloadUrl,
  getPhotoList,
  listAllUsers,
  listUserFolders,
  listFolders,
  listFolderUsers,
  listStuckBulkUploads,
  listTags,
  movePhoto,
  presignBulkUpload,
  processBulkUpload,
  publicPhotos,
  removeFolderUser,
  retentionSweep,
  toggleLike,
  unbanFolderUser,
  updateFolder,
  updatePhotoTags,
  updateTagCatalog,
  updateUser,
  uploadImageFunction,
});

const apiStack = backend.createStack("PhotoApiStack");
const infraStack = backend.createStack("PhotoInfraStack");

const allFunctions = [
  backend.acceptInvite,
  backend.addFolderUser,
  backend.backfillFolderUsers,
  backend.backfillPhotoDimensions,
  backend.createFolder,
  backend.createInvite,
  backend.deleteFolder,
  backend.deletePhoto,
  backend.duplicatePhoto,
  backend.getPhotoDownloadUrl,
  backend.getPhotoList,
  backend.listAllUsers,
  backend.listUserFolders,
  backend.listFolders,
  backend.listFolderUsers,
  backend.listStuckBulkUploads,
  backend.listTags,
  backend.movePhoto,
  backend.presignBulkUpload,
  backend.publicPhotos,
  backend.removeFolderUser,
  backend.toggleLike,
  backend.unbanFolderUser,
  backend.updateFolder,
  backend.updatePhotoTags,
  backend.updateTagCatalog,
  backend.updateUser,
  backend.uploadImageFunction,
  // retentionSweep and processBulkUpload are deliberately excluded: both
  // are event-triggered (EventBridge / S3), never return an API Gateway
  // response, so neither has CORS to configure.
];
for (const fn of allFunctions) {
  fn.addEnvironment("ALLOWED_ORIGINS", ALLOWED_ORIGINS.join(","));
}

const foldersTable = new Table(infraStack, "FoldersTable", {
  partitionKey: { name: "folderId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const invitesTable = new Table(infraStack, "InvitesTable", {
  partitionKey: { name: "inviteCode", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "expiresAt",
});

const folderUsersTable = new Table(infraStack, "FolderUsersTable", {
  partitionKey: { name: "folderId", type: AttributeType.STRING },
  sortKey: { name: "username", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const bannedFolderUsersTable = new Table(infraStack, "BannedFolderUsersTable", {
  partitionKey: { name: "folderId", type: AttributeType.STRING },
  sortKey: { name: "username", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const photoMetadataTable = new Table(infraStack, "PhotoMetadataTable", {
  partitionKey: { name: "photoKey", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const tagCatalogTable = new Table(infraStack, "TagCatalogTable", {
  partitionKey: { name: "tagKey", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const tagAssignmentsTable = new Table(infraStack, "TagAssignmentsTable", {
  partitionKey: { name: "tagKey", type: AttributeType.STRING },
  sortKey: { name: "photoKey", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

folderUsersTable.addGlobalSecondaryIndex({
  indexName: "byUsername",
  partitionKey: { name: "username", type: AttributeType.STRING },
  sortKey: { name: "folderId", type: AttributeType.STRING },
  projectionType: ProjectionType.ALL,
});

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
photoBucket.grantRead(backend.getPhotoDownloadUrl.resources.lambda);
photoBucket.grantRead(backend.getPhotoList.resources.lambda);
photoBucket.grantReadWrite(backend.movePhoto.resources.lambda);
photoBucket.grantRead(backend.publicPhotos.resources.lambda);
photoBucket.grantReadWrite(backend.deleteFolder.resources.lambda);
photoBucket.grantReadWrite(backend.deletePhoto.resources.lambda);
photoBucket.grantReadWrite(backend.duplicatePhoto.resources.lambda);
photoBucket.grantRead(backend.updatePhotoTags.resources.lambda);

backend.uploadImageFunction.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.uploadImageFunction.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.uploadImageFunction.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.uploadImageFunction.addEnvironment(
  "TAG_CATALOG_TABLE_NAME",
  tagCatalogTable.tableName,
);
backend.uploadImageFunction.addEnvironment(
  "TAG_ASSIGNMENTS_TABLE_NAME",
  tagAssignmentsTable.tableName,
);
backend.getPhotoList.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.getPhotoList.addEnvironment(
  "CLOUDFRONT_DOMAIN",
  distribution.domainName,
);
backend.getPhotoList.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.getPhotoList.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.getPhotoList.addEnvironment(
  "TAG_ASSIGNMENTS_TABLE_NAME",
  tagAssignmentsTable.tableName,
);
backend.getPhotoDownloadUrl.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.getPhotoDownloadUrl.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);

backend.publicPhotos.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.publicPhotos.addEnvironment(
  "CLOUDFRONT_DOMAIN",
  distribution.domainName,
);
backend.publicPhotos.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.publicPhotos.addEnvironment(
  "TAG_ASSIGNMENTS_TABLE_NAME",
  tagAssignmentsTable.tableName,
);

backend.movePhoto.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
backend.deletePhoto.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
backend.duplicatePhoto.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
backend.movePhoto.addEnvironment("PHOTO_METADATA_TABLE_NAME", photoMetadataTable.tableName);
backend.movePhoto.addEnvironment("TAG_CATALOG_TABLE_NAME", tagCatalogTable.tableName);
backend.movePhoto.addEnvironment("TAG_ASSIGNMENTS_TABLE_NAME", tagAssignmentsTable.tableName);
backend.deletePhoto.addEnvironment("PHOTO_METADATA_TABLE_NAME", photoMetadataTable.tableName);
backend.deletePhoto.addEnvironment("TAG_ASSIGNMENTS_TABLE_NAME", tagAssignmentsTable.tableName);
backend.duplicatePhoto.addEnvironment("PHOTO_METADATA_TABLE_NAME", photoMetadataTable.tableName);
backend.duplicatePhoto.addEnvironment("TAG_CATALOG_TABLE_NAME", tagCatalogTable.tableName);
backend.duplicatePhoto.addEnvironment("TAG_ASSIGNMENTS_TABLE_NAME", tagAssignmentsTable.tableName);
backend.listTags.addEnvironment("TAG_CATALOG_TABLE_NAME", tagCatalogTable.tableName);
backend.updatePhotoTags.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
backend.updatePhotoTags.addEnvironment("PHOTO_METADATA_TABLE_NAME", photoMetadataTable.tableName);
backend.updatePhotoTags.addEnvironment("TAG_CATALOG_TABLE_NAME", tagCatalogTable.tableName);
backend.updatePhotoTags.addEnvironment("TAG_ASSIGNMENTS_TABLE_NAME", tagAssignmentsTable.tableName);
backend.updateTagCatalog.addEnvironment("TAG_CATALOG_TABLE_NAME", tagCatalogTable.tableName);

backend.createFolder.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.updateFolder.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.toggleLike.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.toggleLike.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.toggleLike.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.retentionSweep.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.retentionSweep.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.retentionSweep.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.retentionSweep.addEnvironment(
  "TAG_ASSIGNMENTS_TABLE_NAME",
  tagAssignmentsTable.tableName,
);
// Logs every deletion candidate without deleting anything. Flip to "false"
// only after reviewing at least one real scheduled run's CloudWatch output.
backend.retentionSweep.addEnvironment("DRY_RUN", "true");
backend.presignBulkUpload.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
backend.presignBulkUpload.addEnvironment("FOLDERS_TABLE_NAME", foldersTable.tableName);
backend.processBulkUpload.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
backend.processBulkUpload.addEnvironment("PHOTO_METADATA_TABLE_NAME", photoMetadataTable.tableName);
backend.processBulkUpload.addEnvironment("TAG_CATALOG_TABLE_NAME", tagCatalogTable.tableName);
backend.processBulkUpload.addEnvironment("TAG_ASSIGNMENTS_TABLE_NAME", tagAssignmentsTable.tableName);
backend.listStuckBulkUploads.addEnvironment("BUCKET_NAME", photoBucket.bucketName);
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
backend.deleteFolder.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.deleteFolder.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.deleteFolder.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.deleteFolder.addEnvironment(
  "BANNED_USERS_TABLE_NAME",
  bannedFolderUsersTable.tableName,
);
backend.deleteFolder.addEnvironment(
  "INVITES_TABLE_NAME",
  invitesTable.tableName,
);
backend.deleteFolder.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.deleteFolder.addEnvironment(
  "TAG_ASSIGNMENTS_TABLE_NAME",
  tagAssignmentsTable.tableName,
);
backend.acceptInvite.addEnvironment(
  "INVITES_TABLE_NAME",
  invitesTable.tableName,
);
backend.acceptInvite.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);
backend.acceptInvite.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.acceptInvite.addEnvironment(
  "BANNED_USERS_TABLE_NAME",
  bannedFolderUsersTable.tableName,
);
backend.backfillFolderUsers.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);
backend.backfillFolderUsers.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.backfillPhotoDimensions.addEnvironment(
  "BUCKET_NAME",
  photoBucket.bucketName,
);
backend.backfillPhotoDimensions.addEnvironment(
  "PHOTO_METADATA_TABLE_NAME",
  photoMetadataTable.tableName,
);
backend.listFolderUsers.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);
backend.listFolderUsers.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.listFolderUsers.addEnvironment(
  "BANNED_USERS_TABLE_NAME",
  bannedFolderUsersTable.tableName,
);
backend.listAllUsers.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);
backend.updateUser.addEnvironment(
  "USER_POOL_ID",
  backend.auth.resources.userPool.userPoolId,
);
backend.listUserFolders.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.listUserFolders.addEnvironment(
  "FOLDERS_TABLE_NAME",
  foldersTable.tableName,
);
backend.removeFolderUser.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.addFolderUser.addEnvironment(
  "FOLDER_USERS_TABLE_NAME",
  folderUsersTable.tableName,
);
backend.addFolderUser.addEnvironment(
  "BANNED_USERS_TABLE_NAME",
  bannedFolderUsersTable.tableName,
);
backend.removeFolderUser.addEnvironment(
  "BANNED_USERS_TABLE_NAME",
  bannedFolderUsersTable.tableName,
);
backend.unbanFolderUser.addEnvironment(
  "BANNED_USERS_TABLE_NAME",
  bannedFolderUsersTable.tableName,
);

foldersTable.grantReadWriteData(backend.createFolder.resources.lambda);
foldersTable.grantReadWriteData(backend.updateFolder.resources.lambda);
foldersTable.grantReadWriteData(backend.toggleLike.resources.lambda);
foldersTable.grantReadData(backend.retentionSweep.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.toggleLike.resources.lambda);
folderUsersTable.grantReadData(backend.toggleLike.resources.lambda);
photoBucket.grantReadWrite(backend.retentionSweep.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.retentionSweep.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.retentionSweep.resources.lambda);
// Presigned PUT URLs are validated against the SIGNING role's actual IAM
// permissions when the local app later uses them -- this role needs real
// s3:PutObject even though presignBulkUpload itself never calls PutObject.
photoBucket.grantWrite(backend.presignBulkUpload.resources.lambda);
// Also needs read: resolveAvailableFileName() calls HeadObjectCommand to
// check for filename collisions before presigning. Without this, that HEAD
// call gets denied and the SDK can't parse a body-less HEAD error response,
// so it surfaces as a generic "UnknownError" instead of an access-denied one.
photoBucket.grantRead(backend.presignBulkUpload.resources.lambda);
foldersTable.grantReadData(backend.presignBulkUpload.resources.lambda);
photoBucket.grantReadWrite(backend.processBulkUpload.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.processBulkUpload.resources.lambda);
tagCatalogTable.grantReadWriteData(backend.processBulkUpload.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.processBulkUpload.resources.lambda);
photoBucket.grantRead(backend.listStuckBulkUploads.resources.lambda);
foldersTable.grantReadWriteData(backend.createInvite.resources.lambda);
foldersTable.grantReadData(backend.uploadImageFunction.resources.lambda);
foldersTable.grantReadData(backend.listFolders.resources.lambda);
foldersTable.grantReadWriteData(backend.deleteFolder.resources.lambda);
folderUsersTable.grantReadWriteData(backend.deleteFolder.resources.lambda);
bannedFolderUsersTable.grantReadWriteData(backend.deleteFolder.resources.lambda);
invitesTable.grantReadWriteData(backend.deleteFolder.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.deleteFolder.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.deleteFolder.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.uploadImageFunction.resources.lambda);
photoMetadataTable.grantReadData(backend.getPhotoList.resources.lambda);
photoMetadataTable.grantReadData(backend.publicPhotos.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.movePhoto.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.deletePhoto.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.duplicatePhoto.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.updatePhotoTags.resources.lambda);
tagCatalogTable.grantReadWriteData(backend.uploadImageFunction.resources.lambda);
tagCatalogTable.grantReadWriteData(backend.movePhoto.resources.lambda);
tagCatalogTable.grantReadWriteData(backend.duplicatePhoto.resources.lambda);
tagCatalogTable.grantReadData(backend.listTags.resources.lambda);
tagCatalogTable.grantReadWriteData(backend.updatePhotoTags.resources.lambda);
tagCatalogTable.grantReadWriteData(backend.updateTagCatalog.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.uploadImageFunction.resources.lambda);
tagAssignmentsTable.grantReadData(backend.getPhotoList.resources.lambda);
tagAssignmentsTable.grantReadData(backend.publicPhotos.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.movePhoto.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.deletePhoto.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.duplicatePhoto.resources.lambda);
tagAssignmentsTable.grantReadWriteData(backend.updatePhotoTags.resources.lambda);
invitesTable.grantReadWriteData(backend.createInvite.resources.lambda);
invitesTable.grantReadData(backend.acceptInvite.resources.lambda);
folderUsersTable.grantReadWriteData(backend.acceptInvite.resources.lambda);
folderUsersTable.grantReadData(backend.listFolderUsers.resources.lambda);
folderUsersTable.grantReadWriteData(backend.backfillFolderUsers.resources.lambda);
photoBucket.grantRead(backend.backfillPhotoDimensions.resources.lambda);
photoMetadataTable.grantReadWriteData(backend.backfillPhotoDimensions.resources.lambda);
folderUsersTable.grantReadData(backend.listUserFolders.resources.lambda);
folderUsersTable.grantReadData(backend.getPhotoDownloadUrl.resources.lambda);
folderUsersTable.grantReadData(backend.getPhotoList.resources.lambda);
folderUsersTable.grantReadWriteData(backend.removeFolderUser.resources.lambda);
folderUsersTable.grantReadWriteData(backend.addFolderUser.resources.lambda);
foldersTable.grantReadData(backend.listUserFolders.resources.lambda);
bannedFolderUsersTable.grantReadData(backend.acceptInvite.resources.lambda);
bannedFolderUsersTable.grantReadData(backend.listFolderUsers.resources.lambda);
bannedFolderUsersTable.grantReadWriteData(backend.removeFolderUser.resources.lambda);
bannedFolderUsersTable.grantReadWriteData(backend.unbanFolderUser.resources.lambda);
bannedFolderUsersTable.grantReadWriteData(backend.addFolderUser.resources.lambda);

backend.acceptInvite.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminAddUserToGroup",
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

backend.listFolderUsers.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["cognito-idp:AdminGetUser"],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

backend.backfillFolderUsers.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["cognito-idp:ListUsers"],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

backend.listAllUsers.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["cognito-idp:ListUsers"],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

backend.updateUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["cognito-idp:AdminUpdateUserAttributes"],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

const restApi = new RestApi(apiStack, "PhotoApi", {
  restApiName: "photo-site-api",
  defaultCorsPreflightOptions: {
    allowOrigins: ALLOWED_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
  },
  // Stage-wide throttle: a hard ceiling on the whole API regardless of
  // source, independent of the WAF rate rule below (which throttles per
  // IP). Burst absorbs normal multi-tab/gallery-scroll request bunching;
  // steady-state rate is well above real traffic but far below abuse.
  deployOptions: {
    throttlingRateLimit: 50,
    throttlingBurstLimit: 100,
    loggingLevel: MethodLoggingLevel.ERROR,
  },
});

const authorizer = new CognitoUserPoolsAuthorizer(
  apiStack,
  "PhotoApiAuthorizer",
  {
    cognitoUserPools: [backend.auth.resources.userPool],
  },
);
authorizer._attachToApi(restApi);

const uploadImageIntegration = new LambdaIntegration(backend.uploadImageFunction.resources.lambda);
const uploadResource = restApi.root.addResource("upload-image");
uploadResource.addMethod("POST", uploadImageIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const listPhotosIntegration = new LambdaIntegration(backend.getPhotoList.resources.lambda);
const photosResource = restApi.root.addResource("photos");
photosResource.addMethod("GET", listPhotosIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});
photosResource.addMethod("POST", listPhotosIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const photoDownloadIntegration = new LambdaIntegration(
  backend.getPhotoDownloadUrl.resources.lambda,
);
const photoDownloadResource = restApi.root.addResource("photo-download");
photoDownloadResource.addMethod("POST", photoDownloadIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const publicPhotosIntegration = new LambdaIntegration(
  backend.publicPhotos.resources.lambda,
);
const publicPhotosResource = restApi.root.addResource("public-photos");
publicPhotosResource.addMethod("GET", publicPhotosIntegration, {
  authorizationType: AuthorizationType.NONE,
});
publicPhotosResource.addMethod("POST", publicPhotosIntegration, {
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
const deleteFolderIntegration = new LambdaIntegration(
  backend.deleteFolder.resources.lambda,
);
foldersResource.addMethod("DELETE", deleteFolderIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});
const updateFolderIntegration = new LambdaIntegration(backend.updateFolder.resources.lambda);
foldersResource.addMethod("PATCH", updateFolderIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const toggleLikeIntegration = new LambdaIntegration(backend.toggleLike.resources.lambda);
const toggleLikeResource = restApi.root.addResource("toggle-like");
toggleLikeResource.addMethod("POST", toggleLikeIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const presignBulkUploadIntegration = new LambdaIntegration(backend.presignBulkUpload.resources.lambda);
const presignBulkUploadResource = restApi.root.addResource("presign-bulk-upload");
presignBulkUploadResource.addMethod("POST", presignBulkUploadIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const listStuckBulkUploadsIntegration = new LambdaIntegration(backend.listStuckBulkUploads.resources.lambda);
const stuckBulkUploadsResource = restApi.root.addResource("stuck-bulk-uploads");
stuckBulkUploadsResource.addMethod("GET", listStuckBulkUploadsIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const invitesIntegration = new LambdaIntegration(backend.createInvite.resources.lambda);
const invitesResource = restApi.root.addResource("invites");
invitesResource.addMethod("POST", invitesIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const listFolderUsersIntegration = new LambdaIntegration(
  backend.listFolderUsers.resources.lambda,
);
const folderUsersResource = restApi.root.addResource("folder-users");
folderUsersResource.addMethod("GET", listFolderUsersIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const listAllUsersIntegration = new LambdaIntegration(
  backend.listAllUsers.resources.lambda,
);
const usersResource = restApi.root.addResource("users");
usersResource.addMethod("GET", listAllUsersIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});
const updateUserIntegration = new LambdaIntegration(backend.updateUser.resources.lambda);
const updateUserResource = usersResource.addResource("update");
updateUserResource.addMethod("POST", updateUserIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const listUserFoldersIntegration = new LambdaIntegration(
  backend.listUserFolders.resources.lambda,
);
const userFoldersResource = restApi.root.addResource("user-folders");
userFoldersResource.addMethod("GET", listUserFoldersIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const removeFolderUserIntegration = new LambdaIntegration(
  backend.removeFolderUser.resources.lambda,
);
const removeFolderUserResource = restApi.root.addResource("folder-users-remove");
removeFolderUserResource.addMethod("POST", removeFolderUserIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const addFolderUserIntegration = new LambdaIntegration(
  backend.addFolderUser.resources.lambda,
);
const addFolderUserResource = restApi.root.addResource("folder-users-add");
addFolderUserResource.addMethod("POST", addFolderUserIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const unbanFolderUserIntegration = new LambdaIntegration(
  backend.unbanFolderUser.resources.lambda,
);
const unbanFolderUserResource = restApi.root.addResource("folder-users-unban");
unbanFolderUserResource.addMethod("POST", unbanFolderUserIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const backfillFolderUsersIntegration = new LambdaIntegration(
  backend.backfillFolderUsers.resources.lambda,
);
const backfillFolderUsersResource = restApi.root.addResource("folder-users-backfill");
backfillFolderUsersResource.addMethod("POST", backfillFolderUsersIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const backfillPhotoDimensionsIntegration = new LambdaIntegration(
  backend.backfillPhotoDimensions.resources.lambda,
);
const backfillPhotoDimensionsResource = restApi.root.addResource("backfill-photo-dimensions");
backfillPhotoDimensionsResource.addMethod("POST", backfillPhotoDimensionsIntegration, {
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

const deletePhotoIntegration = new LambdaIntegration(backend.deletePhoto.resources.lambda);
const deletePhotoResource = restApi.root.addResource("delete-photo");
deletePhotoResource.addMethod("POST", deletePhotoIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const duplicatePhotoIntegration = new LambdaIntegration(backend.duplicatePhoto.resources.lambda);
const duplicatePhotoResource = restApi.root.addResource("duplicate-photo");
duplicatePhotoResource.addMethod("POST", duplicatePhotoIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const listTagsIntegration = new LambdaIntegration(backend.listTags.resources.lambda);
const tagsResource = restApi.root.addResource("tags");
tagsResource.addMethod("GET", listTagsIntegration, {
  authorizationType: AuthorizationType.NONE,
});
tagsResource.addMethod("POST", listTagsIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const updatePhotoTagsIntegration = new LambdaIntegration(backend.updatePhotoTags.resources.lambda);
const photoTagsResource = restApi.root.addResource("photo-tags");
photoTagsResource.addMethod("POST", updatePhotoTagsIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

const updateTagCatalogIntegration = new LambdaIntegration(backend.updateTagCatalog.resources.lambda);
const tagCatalogResource = restApi.root.addResource("tag-catalog");
tagCatalogResource.addMethod("POST", updateTagCatalogIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});

// Daily, off-peak UTC time -- the first scheduled resource in this repo.
// Placed in the Lambda's own stack (not infraStack) deliberately: a Rule in
// infraStack targeting a Lambda that lives in Amplify's shared function
// stack creates a new infraStack -> function-stack edge, which combined
// with the function stack's existing dependency on infraStack (table/bucket
// grants) is a circular nested-stack dependency CloudFormation rejects.
new Rule(Stack.of(backend.retentionSweep.resources.lambda), "RetentionSweepSchedule", {
  schedule: Schedule.cron({ minute: "0", hour: "9" }),
  targets: [new LambdaFunction(backend.retentionSweep.resources.lambda)],
});

// S3 -> processBulkUpload notification, scoped to the bulk-incoming/
// staging prefix. The bucket is IMPORTED (Bucket.fromBucketName above),
// not created by this app, so CDK's addEventNotification convenience
// method can't be trusted here -- it relies on a code path for imported
// buckets we can't fully verify. Wired explicitly instead:
//   1. a resource-based permission letting S3 invoke this one function
//   2. an AwsCustomResource calling S3::PutBucketNotificationConfiguration
//      directly, with the exact JSON we construct
// Placed in processBulkUpload's own stack (not infraStack), same reasoning
// as the retentionSweep schedule above: a Rule/resource in infraStack that
// targets a Lambda living in the shared function stack creates a new
// infraStack -> function-stack edge, which combined with that stack's
// existing dependency on infraStack (table/bucket grants) is exactly the
// circular nested-stack dependency CloudFormation rejected last time.
const processBulkUploadStack = Stack.of(backend.processBulkUpload.resources.lambda);

backend.processBulkUpload.resources.lambda.addPermission("AllowS3Invoke", {
  principal: new ServicePrincipal("s3.amazonaws.com"),
  sourceArn: photoBucket.bucketArn,
  sourceAccount: processBulkUploadStack.account,
});

const bulkUploadNotificationCall = {
  service: "S3",
  action: "putBucketNotificationConfiguration",
  parameters: {
    Bucket: photoBucket.bucketName,
    NotificationConfiguration: {
      LambdaFunctionConfigurations: [
        {
          LambdaFunctionArn: backend.processBulkUpload.resources.lambda.functionArn,
          Events: ["s3:ObjectCreated:*"],
          Filter: {
            Key: {
              FilterRules: [{ Name: "prefix", Value: BULK_STAGING_PREFIX }],
            },
          },
        },
      ],
    },
  },
  physicalResourceId: PhysicalResourceId.of("BulkUploadNotificationConfig"),
};

new AwsCustomResource(processBulkUploadStack, "BulkUploadNotification", {
  onCreate: bulkUploadNotificationCall,
  onUpdate: bulkUploadNotificationCall,
  policy: AwsCustomResourcePolicy.fromStatements([
    new PolicyStatement({
      actions: [
        // The IAM action names are "PutBucketNotification"/"GetBucketNotification"
        // -- legacy names that predate the "...Configuration" suffix the S3
        // API operation itself uses. The deploy fails with AccessDenied if
        // these are spelled with the "Configuration" suffix, since that's
        // not an IAM action that actually exists.
        "s3:PutBucketNotification",
        "s3:GetBucketNotification",
      ],
      resources: [photoBucket.bucketArn],
    }),
  ]),
});

// WAF: per-IP rate limit in front of the whole API, including the
// unauthenticated /public-photos and /tags routes that stage throttling
// alone can't protect from a single attacker (one IP can still burn
// through the account-wide throttle above). REGIONAL scope is required
// for API Gateway (CLOUDFRONT scope only attaches to CloudFront/Amplify
// Hosting distributions).
const apiRateLimitAcl = new CfnWebACL(apiStack, "PhotoApiRateLimitAcl", {
  scope: "REGIONAL",
  defaultAction: { allow: {} },
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "PhotoApiRateLimitAcl",
    sampledRequestsEnabled: true,
  },
  rules: [
    {
      name: "RateLimitPerIp",
      priority: 0,
      action: { block: {} },
      statement: {
        rateBasedStatement: {
          // Requests per 5-minute window per source IP.
          limit: 300,
          aggregateKeyType: "IP",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "RateLimitPerIp",
        sampledRequestsEnabled: true,
      },
    },
  ],
});

new CfnWebACLAssociation(apiStack, "PhotoApiRateLimitAclAssociation", {
  resourceArn: restApi.deploymentStage.stageArn,
  webAclArn: apiRateLimitAcl.attrArn,
});

// Budget alarm: the actual dollar-amount circuit breaker, independent of
// whether an attack is clever enough to dodge the WAF rule or stage
// throttle above. Fires on both a mid-month warning and an over-budget
// alert so there's lead time before the second one.
const budgetAlertTopic = new Topic(infraStack, "BudgetAlertTopic");
budgetAlertTopic.addSubscription(new EmailSubscription("cambony1@gmail.com"));

new CfnBudget(infraStack, "MonthlyCostBudget", {
  budget: {
    budgetType: "COST",
    timeUnit: "MONTHLY",
    budgetLimit: { amount: 25, unit: "USD" },
  },
  notificationsWithSubscribers: [
    {
      notification: {
        notificationType: "ACTUAL",
        comparisonOperator: "GREATER_THAN",
        threshold: 80,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [{ subscriptionType: "EMAIL", address: "cambony1@gmail.com" }],
    },
    {
      notification: {
        notificationType: "ACTUAL",
        comparisonOperator: "GREATER_THAN",
        threshold: 100,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [{ subscriptionType: "EMAIL", address: "cambony1@gmail.com" }],
    },
    {
      notification: {
        notificationType: "FORECASTED",
        comparisonOperator: "GREATER_THAN",
        threshold: 100,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [{ subscriptionType: "EMAIL", address: "cambony1@gmail.com" }],
    },
  ],
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
