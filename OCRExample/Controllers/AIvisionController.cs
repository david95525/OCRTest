using Azure.AI.Vision.ImageAnalysis;
using Azure;
using Microsoft.AspNetCore.Mvc;
using OCRExample.Models;
using System;
using System.Runtime;

namespace OCRExample.Controllers
{
    public class AIvisionController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private string key;
        private string endpoint;
        private string prediction_key;
        public AIvisionController(IConfiguration configuration, IWebHostEnvironment env)
        {
            _env = env;
            _configuration = configuration;
            endpoint = _configuration.GetSection("VISION_ENDPOINT").Value ?? string.Empty;
            key = _configuration.GetSection("VISION_KEY").Value ?? string.Empty;
            prediction_key = _configuration.GetSection("Prediction_Key").Value ?? string.Empty;
        }
        public IActionResult Index(string redirect_uri)
        {
            if (string.IsNullOrEmpty(redirect_uri))
            {
                redirect_uri = "/";
            }
            Response.Cookies.Append("redirect_uri", redirect_uri);
            return View();
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Back([FromBody] BloodPressureModel data)
        {
            string? uri = string.Empty;
            Request.Cookies.TryGetValue("redirect_uri", out uri);
            return Ok(new { redirect_uri = uri + $"?sys={data.sys}&dia={data.dia}&pul={data.pul}" });
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ImageAnalyze([FromBody] ImageModel model)
        {

            Task.Run(() =>
            {
                string file = Path.Combine(_env.WebRootPath, "scan", "1.1", DateTime.Now.ToString("yyyyMMdd"));
                if (!Directory.Exists(file))
                {
                    Directory.CreateDirectory(file);
                }
                string filename = $"{DateTime.Now.ToString("yyyyMMddhhmm")}_{model.width}x{model.height}.jpg";
                string filePath = Path.Combine(file, filename);
                MemoryStream ms = new MemoryStream(Convert.FromBase64String(model.imagestring));
                FileStream stream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
                byte[] b = ms.ToArray();
                stream.Write(b, 0, b.Length);
                stream.Close();
            });
            byte[] image = Convert.FromBase64String(model.imagestring);
            BinaryData imageData = BinaryData.FromBytes(image);
            ImageAnalysisClient client = new ImageAnalysisClient(new Uri(endpoint), new AzureKeyCredential(key));
            ImageAnalysisResult result = client.Analyze(imageData, VisualFeatures.Read | VisualFeatures.Caption, new ImageAnalysisOptions { GenderNeutralCaption = true });
            List<PredictionModel> predictions = new List<PredictionModel>();
            if (result.Caption.Confidence > 0.5)
            {
                foreach (DetectedTextBlock block in result.Read.Blocks)
                {
                    IReadOnlyList<DetectedTextLine> lines = block.Lines;
                    for (int i = 0; i < lines.Count; i++)
                    {
                        string text = lines[i].Text.Replace(" ", "");
                        PredictionModel prediction = new PredictionModel
                        {
                            tagName = text,
                            probability = result.Caption.Confidence,
                            x1 = lines[i].BoundingPolygon[0].X,
                            x2 = lines[i].BoundingPolygon[1].X,
                            y1 = lines[i].BoundingPolygon[0].Y,
                            y3 = lines[i].BoundingPolygon[2].Y,
                        };
                        predictions.Add(prediction);
                    }
                }
            }
            return Ok(new { predictions = predictions });
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Saveimage([FromBody] ImageModel model)
        {
            string file = Path.Combine(_env.WebRootPath, "scan", model.version, DateTime.Now.ToString("yyyyMMdd"));
            if (!Directory.Exists(file))
            {
                Directory.CreateDirectory(file);
            }
            string filename = $"{DateTime.Now.ToString("yyyyMMddhhmm")}_{model.width}x{model.height}.jpg";
            string filePath = Path.Combine(file, filename);
            MemoryStream ms = new MemoryStream(Convert.FromBase64String(model.imagestring));
            FileStream stream = new FileStream(filePath, FileMode.Create, FileAccess.Write);
            byte[] b = ms.ToArray();
            stream.Write(b, 0, b.Length);
            stream.Close();
            return Ok();
        }
        [HttpGet]
        [ValidateAntiForgeryToken]
        public IActionResult getkey()
        {
            return Ok(new { prediction_key = prediction_key });
        }
        public class ImageModel
        {
            public string imagestring { get; set; } = string.Empty;
            public int width { get; set; }
            public int height { get; set; }
            public string version { get; set; } = string.Empty;
        }
        public class PredictionModel
        {
            public string tagName { get; set; } = string.Empty;
            //順時鐘
            public int x1 { get; set; }
            public int x2 { get; set; }
            public int y1 { get; set; }
            public int y3 { get; set; }
            public double probability { get; set; }
        }
    }
}
