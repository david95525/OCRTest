namespace OCRExample.Models
{
    public class BloodPressureModel
    {
        /// <summary>
        /// 血壓編號
        /// </summary>
        public int bpmid { get; set; }
        /// <summary>
        /// 0:未授權
        /// 1:來自app
        /// 2:來自網頁
        /// 3:來自行動裝置
        /// </summary>
        public int source { get; set; }
        /// <summary>
        /// 收縮壓
        /// </summary>
        public double sys { get; set; }
        /// <summary>
        /// 舒張壓
        /// </summary>
        public double dia { get; set; }
        /// <summary>
        /// 心律
        /// </summary>
        public int pul { get; set; }
        /// <summary>
        /// AFIB偵測
        /// 0:沒有量測到
        /// 1:有量測到
        /// </summary>
        public sbyte afib { get; set; }
        /// <summary>
        /// 脈搏不規則偵測
        /// 0:沒有量測到
        /// 1:有量測到
        /// </summary>
        public sbyte pad { get; set; }
        /// <summary>
        /// 是否開啟mam模式
        /// 0:正常模式
        /// 1:正常模式+AFIB偵測
        /// 2:mam模式
        /// 3:mam模式+AFIB偵測
        /// </summary>
        public sbyte mode { get; set; }

        public DateTime updatedate { get; set; }
        /// <summary>
        /// 筆記內容
        /// </summary>
        public string note { get; set; } = string.Empty;

    }
}
