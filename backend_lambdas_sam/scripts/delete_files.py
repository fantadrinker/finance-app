import boto3

stack_name = "backendLambdasSamTest"

def __main__():
  try:
    client = boto3.client("cloudformation")
    response = client.describe_stacks(StackName=stack_name)
    s3Outputs = [output["OutputValue"] for output in response["Stacks"][0]["Outputs"] if output["OutputKey"] == "S3Bucket"]
    bucketName = s3Outputs[0]

    s3Client = boto3.client("s3")
    response = s3Client.list_objects_v2(Bucket=bucketName)
    allObjects = response.get("Contents", [])
    if not allObjects:
      print(f"no objects in the bucket {bucketName}")
      return

    objectsToDelete = [obj for obj in allObjects if "Key" in obj]
    
    response = s3Client.delete_objects(
      Bucket=bucketName,
      Delete={
        "Objects": [{
          "Key": obj["Key"]
      } for obj in objectsToDelete]
      }
    )

    print(response)
  except:
    print("something went wrong when deleting the s3 objects")

if __name__ == "__main__":
  __main__()