[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace TestHandler;

public class Function
{
  [LambdaFunction("test_handler")]
  [HttpApi(LambdaMethodType.GET, "/test_handler")]
  public string FunctionHandler()
  {
    return "Hello World!";
  }
}

