using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;

namespace TestHandler;

public class FunctionTest
{
  [Fact]
  public void TestToUpperFunction()
  {

    // Invoke the lambda function and confirm the string was upper cased.
    var function = new Function();
    var context = new TestLambdaContext();
    var result = function.FunctionHandler();

    Assert.Equal("Hello World!", result);
  }
}
