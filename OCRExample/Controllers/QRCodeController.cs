using Microsoft.AspNetCore.Mvc;

namespace OCRExample.Controllers
{
    public class QRCodeController : Controller
    {
        public IActionResult zxingjs()
        {
            return View();
        }
        public IActionResult html5qrcode()
        {
            return View();
        }
        public IActionResult instascan()
        {
            return View();
        }
    }
}
