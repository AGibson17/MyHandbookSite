using Umbraco.Cms.Core.Models.PublishedContent;

namespace MyHandbookSite.Umbraco.Models
{
    public class PolicyCardViewModel
    {
        public IPublishedContent? Policy { get; set; }
        public IPublishedElement? Overlay { get; set; }
        public string? CardId { get; set; }
    }
}
