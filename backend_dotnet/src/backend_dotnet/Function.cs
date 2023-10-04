using Amazon.Lambda.Core;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace TestHandler;

public class Function
{

  public string FunctionHandler()
  {
    return "Hello World!";
  }
}
