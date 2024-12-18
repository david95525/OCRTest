using Microsoft.AspNetCore.Mvc;
using OCRExample.Models;
using System.Diagnostics;

namespace OCRExample.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }
    
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult TesseractNet(int[] nums)
        {
            
            int[] test= nums;
            int[] test02=new int[nums.Length];
            int x;
            x = test[0];
            return View();
        }
        public IActionResult TesseractJs()
        {
            return View();
        }
        public IActionResult OcradJs()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}