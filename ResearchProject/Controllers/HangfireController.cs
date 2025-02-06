using Hangfire;
using Microsoft.AspNetCore.Mvc;

namespace ResearchProject.Controllers
{
    [Route("api/[action]")]

    [ApiController]
    public class HangfireController : ControllerBase
    {
        [HttpGet]

        public void Test()
        {
            //單次立即執行
            BackgroundJob.Enqueue(() => Console.WriteLine("單次!"));
            //單次10秒後執行
            BackgroundJob.Schedule(() => Console.WriteLine("10秒後執行!"), TimeSpan.FromSeconds(10));
            //重複執行，預設為每天00:00啟動
            RecurringJob.AddOrUpdate("daily", "critical", () => Console.WriteLine("重複執行！"), Cron.Daily);
        }
    }
}
