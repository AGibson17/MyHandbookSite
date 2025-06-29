using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using Microsoft.Extensions.Primitives;

namespace MyHandbookSite.Controllers
{
    [Route("umbraco/api/policies")]
    public class PoliciesController : UmbracoApiController
    {
        private readonly IUmbracoContextFactory _contextFactory;
        private readonly ICompositeViewEngine _viewEngine;
        private readonly ITempDataProvider _tempDataProvider;
        private readonly IServiceProvider _serviceProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PoliciesController(
            IUmbracoContextFactory contextFactory,
            ICompositeViewEngine viewEngine,
            ITempDataProvider tempDataProvider,
            IServiceProvider serviceProvider,
            IHttpContextAccessor httpContextAccessor)
        {
            _contextFactory = contextFactory;
            _viewEngine = viewEngine;
            _tempDataProvider = tempDataProvider;
            _serviceProvider = serviceProvider;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpGet("getcategory")]
        public IActionResult GetCategory(int categoryId, string state = "")
        {
            try
            {
                using var cref = _contextFactory.EnsureUmbracoContext();
                var content = cref.UmbracoContext.Content?.GetById(categoryId);
                if (content == null)
                    return NotFound("Category not found.");

                // Get the current HttpContext
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null)
                    return StatusCode(StatusCodes.Status500InternalServerError, "HttpContext is unavailable.");

                // Store original query string
                var originalQueryString = httpContext.Request.QueryString;
                
                try
                {
                    // Create a simple query string with just the state parameter if needed
                    string newQueryString = "";
                    if (!string.IsNullOrEmpty(state))
                    {
                        newQueryString = $"?state={Uri.EscapeDataString(state)}";
                    }
                    
                    // Temporarily set the query string for the view rendering
                    httpContext.Request.QueryString = new QueryString(newQueryString);
                    
                    var html = RenderViewToString("~/Views/Partials/CategoryPage.cshtml", content);
                    
                    return Content(html, "text/html");
                }
                finally
                {
                    // Restore original query string
                    httpContext.Request.QueryString = originalQueryString;
                }
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                System.Diagnostics.Debug.WriteLine($"Error in GetCategory: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    $"An error occurred while loading the category: {ex.Message}");
            }
        }

        private string RenderViewToString(string viewPath, object model)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
                throw new InvalidOperationException("HttpContext is unavailable.");

            var routeData = httpContext.GetRouteData();
            var actionContext = new ActionContext(httpContext, routeData, new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor());

            using var sw = new StringWriter();

            var viewResult = _viewEngine.GetView(executingFilePath: null, viewPath, isMainPage: false);

            if (!viewResult.Success)
                throw new InvalidOperationException($"View '{viewPath}' could not be found.");

            var viewDictionary = new ViewDataDictionary(new EmptyModelMetadataProvider(), new ModelStateDictionary())
            {
                Model = model
            };

            var tempData = new TempDataDictionary(httpContext, _tempDataProvider);

            var viewContext = new ViewContext(
                actionContext,
                viewResult.View,
                viewDictionary,
                tempData,
                sw,
                new HtmlHelperOptions()
            );

            viewResult.View.RenderAsync(viewContext).GetAwaiter().GetResult();
            return sw.ToString();
        }
    }
}
