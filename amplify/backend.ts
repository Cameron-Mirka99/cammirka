import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { AuthorizationType, Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { getPhotoList } from "./functions/getPhotoList/resource";
import { uploadImageFunction } from "./functions/uploadImageFunction/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({
  getPhotoList,
  storage,
  uploadImageFunction,
});

const apiStack = backend.createStack("PhotoApiStack");

backend.uploadImageFunction.resources.lambda.addEnvironment(
  "BUCKET_NAME",
  backend.storage.resources.bucket.bucketName,
);
backend.getPhotoList.resources.lambda.addEnvironment(
  "BUCKET_NAME",
  backend.storage.resources.bucket.bucketName,
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
    photoApi: {
      url: restApi.url,
      name: restApi.restApiName,
      region: Stack.of(apiStack).region,
    },
  },
});
