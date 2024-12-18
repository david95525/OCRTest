const path = require('path');
module.exports = {
    mode: 'production',
    entry: "./main.js",
    output: {
        path: path.resolve(__dirname, '../wwwroot/js'),
        filename: "tesseract.js"
    },
    module: {
        rules: [
            // 配置 babel-loader (第一步)
            {
                test: /\.js$/,
                // 排除 node_modules 與 bower_components 底下資料 (第二步)
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // 配置 Babel 解析器 (第三步)
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    /*watch: true*/
}