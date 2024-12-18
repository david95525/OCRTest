using Microsoft.AspNetCore.Mvc;
using OCRExample.Models;
using Tesseract;

namespace OCRExample.Controllers
{
    public class OCRController : Controller
    {
        private const string folderName = "images/";
        private const string trainedDataFolderName = "tessdata";
        [HttpPost]
        public IActionResult DoOCR(OcrModel request)
        {

            string name = request.file.FileName;
            var image = request.file;
            request.DestinationLanguage = DestinationLanguage.English;
            if (image.Length > 0)
            {
                using (var fileStream = new FileStream(folderName + image.FileName, FileMode.Create))
                {
                    image.CopyTo(fileStream);
                }
            }

            string tessPath = Path.Combine(trainedDataFolderName, "");
            string result = "";

            using (var engine = new TesseractEngine(tessPath, request.DestinationLanguage, EngineMode.Default))
            {
                using (var img = Pix.LoadFromFile(folderName + name))
                {
                    var page = engine.Process(img);
                    result = page.GetText();
                    Console.WriteLine(result);
                }
            }
            return Json(new
            {
                result = String.IsNullOrWhiteSpace(result) ? "Ocr is finished. Return empty" : result
            });
        }
    }
}
