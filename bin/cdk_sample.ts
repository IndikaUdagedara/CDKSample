#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkSampleStack } from '../lib/cdk_sample-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const env = {
    account: "142336375856",
    region: "us-west-1",
  };
const app = new cdk.App();

new CdkSampleStack(app, 'CdkSampleStack', {
    env: env
});

new PipelineStack(app, 'PipelineStack', {
    env: env
});
