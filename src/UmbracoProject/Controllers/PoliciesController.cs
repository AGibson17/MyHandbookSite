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
        public IActionResult GetCategory(int categoryId, string state)
        {
            using var cref = _contextFactory.EnsureUmbracoContext();
            var content = cref.UmbracoContext.Content?.GetById(categoryId);
            if (content == null)
                return NotFound("Category not found.");

            // Pass state via querystring manually
            var qs = string.IsNullOrEmpty(state) ? "" : $"?state={state}";
            var request = _httpContextAccessor.HttpContext;
            request.Request.QueryString = new QueryString(qs);

            var html = RenderViewToString("~/Views/Partials/CategoryPage.cshtml", content);

            return Content(html, "text/html");
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
