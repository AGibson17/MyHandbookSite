using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.IO;

public static class ControllerContextExtensions
{
    public static string RenderViewToString(this ControllerContext controllerContext, string viewPath, object model, bool partial = false)
    {
        var httpContext = controllerContext.HttpContext;
        var serviceProvider = httpContext.RequestServices;

        var razorViewEngine = serviceProvider.GetService(typeof(IRazorViewEngine)) as IRazorViewEngine;
        if (razorViewEngine == null)
            throw new InvalidOperationException("Unable to resolve IRazorViewEngine from service provider.");

        var tempDataProvider = serviceProvider.GetService(typeof(ITempDataProvider)) as ITempDataProvider;
        if (tempDataProvider == null)
            throw new InvalidOperationException("Unable to resolve ITempDataProvider from service provider.");

        var actionContext = new ActionContext(httpContext, controllerContext.RouteData, controllerContext.ActionDescriptor);

        using (var sw = new StringWriter())
        {
            var viewResult = razorViewEngine.GetView(executingFilePath: null, viewPath, isMainPage: !partial);

            if (!viewResult.Success || viewResult.View == null)
                throw new FileNotFoundException($"View {viewPath} not found.");

            var viewDictionary = new ViewDataDictionary(new Microsoft.AspNetCore.Mvc.ModelBinding.EmptyModelMetadataProvider(), new Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary())
            {
                Model = model
            };

            var viewContext = new ViewContext(
                actionContext,
                viewResult.View,
                viewDictionary,
                new TempDataDictionary(httpContext, tempDataProvider),
                sw,
                new HtmlHelperOptions()
            );

            viewResult.View.RenderAsync(viewContext).GetAwaiter().GetResult();
            return sw.ToString();
        }
    }
}
