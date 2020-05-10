import * as cdk from "@aws-cdk/core";
import { Pipeline, Artifact, IStage } from "@aws-cdk/aws-codepipeline";
import * as actions from "@aws-cdk/aws-codepipeline-actions";
import * as codecommit from "@aws-cdk/aws-codecommit";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as iam from "@aws-cdk/aws-iam";



export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, "CDKSample", {
      pipelineName: "CDKSample",
    });

    const source = new Artifact("Source");
    const build = new Artifact("Build");

    this.createSourceStage(pipeline, source);
    this.createBuildStage(pipeline, source, build);
    this.createDeployStage("Staging", pipeline, build);
  }

  createSourceStage(pipeline: Pipeline, source: Artifact): void {
    const sourceStage = pipeline.addStage({ stageName: "Source" });
    sourceStage.addAction(
      new actions.CodeCommitSourceAction({
        actionName: "FetchSource",
        repository: codecommit.Repository.fromRepositoryName(
          this,
          "Repository",
          "CDKSample"
        ),
        output: source,
      })
    );
  }

  createBuildStage(
    pipeline: Pipeline,
    source: Artifact,
    build: Artifact
  ): void {
    const buildProject = new codebuild.PipelineProject(this, "Build", {
      projectName: "CDKSample-Build",

      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      // buildspec in source directory
    });

    const buildStage = pipeline.addStage({ stageName: "Build" });
    buildStage.addAction(
      new actions.CodeBuildAction({
        actionName: "Build",
        input: source,
        project: buildProject,
        outputs: [build],
      })
    );
  }

  createDeployStage(
    environment: string,
    pipeline: Pipeline,
    build: Artifact
  ): void {
    const buildProject = new codebuild.PipelineProject(
      this,
      `Deploy-${environment}`,
      {
        projectName: `CDKSample-Deploy-${environment}`,

        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
          privileged: true,
        },
        environmentVariables: {
          ENVIRONMENT: {
            value: environment,
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          },
        },
        buildSpec: codebuild.BuildSpec.fromSourceFilename("deployspec.yml"),
      }
    );

    const buildStage = pipeline.addStage({
      stageName: `Deploy-${environment}`,
    });
    buildStage.addAction(
      new actions.CodeBuildAction({
        actionName: "Deploy",
        input: build,
        project: buildProject,
      })
    );
  }
}
