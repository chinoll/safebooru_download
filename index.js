const axios = require("axios-extra")
axios.defaults.maxConcurrent = 100  //请求并发数
axios.defaults.queueOptions.retry = 3
const cheerio = require("cheerio")
const fs = require("fs")
const async = require("async")
const util = require("util")
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const delay_time = 5000
const SocksProxyAgent = require('socks-proxy-agent')
const httpsAgent = new SocksProxyAgent('socks://127.0.0.1:1080')

const proxy_url = "http://demo.spiderpy.cn/get/"
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  })
// if(proxy_url == "http://demo.spiderpy.cn/get/") {
//     console.log("警告:该获取代理IP池为proxy_pool项目(https://github.com/jhao104/proxy_pool)的测试地址，请更换为本地的代理IP池")
//     readline.question("按下任意键继续",(answer) => {})
// }
async function download_image(tags,page_count) {
    let base_url = util.format("https://safebooru.org/index.php?page=post&s=list&tags=%s&pid=%d",tags,page_count*40)
    // console.log(base_url)
    await axios({
        method:"get",
        url:base_url,
        // proxy:{
        //     host:"127.0.0.1",
        //     port:"1081"
        // }
        timeout:5000
    }).then((respone) => {
        $ = cheerio.load(respone.data)
        let html = $("#post-list > div.content").html()
        let reg = /https:\/\/safebooru.org\/thumbnails\/[0-9]*\/thumbnail_[a-z0-9A-Z]*\.jpg\?[a-z0-9A-Z]*/g
        let link_arr = html.match(reg)
        // console.log(link_arr)
        async.mapLimit(link_arr,link_arr.length,async (url) => {
            url = url.replace("thumbnails","samples").replace("thumbnail","sample")
            let image_name = url.split("/")
            image_name = image_name[image_name.length - 1].slice(0,-8)

            await axios({
                method:'get',
                url:url,
                responseType:'arraybuffer',
                timeout:5000
            }).then((response) => {
                // console.log("download",url)
                console.log("download",image_name)
                fs.writeFile(image_name,response.data,'binary',() => {})
            })
        },() => {
            console.log(page_count,"OK")
        })
    }).catch(async (error) => {
        // console.log("?")
        console.log(error)
    })
}

async function download(keyword,concurrent,i,page) {
    // console.log("fuck!")
    i--
    for(;i <= page;i += concurrent) {
        let page_count = []
        // console.log(i)
        for(let j = 0;j < concurrent;j++) {
            if (i + j > page)
                break
            page_count.push(download_image(keyword,i + j))
        }
        await Promise.all(page_count).then((value) => {}).catch((reason) => {console.log("abort")})
    }
}

//一次只下载一个页面
async function download2(keyword,page) {
    for(let i = page;i <= 1000;i++) {
        await download_image(keyword,page_count)
    }
}

async function get_proxy() {
    let data = (await axios.get("http://demo.spiderpy.cn/get/")).data['proxy'].split(":")
    return {host:data[0],port:data[1]}
}

async function download_tag_list(keyword_list,concurrent) {
    for(let i = 0;i < keyword_list.length;i++) {
        await download(keyword_list[i],concurrent,page[i])
    }
}

//下载代码示例
// let keyword_list = ["standing","simple_background","simple_background","1girl","full_body","transparent_background","solo"]
// let page=[60,1,1,1,1,1,1]
// download_tag_list(keyword_list,10)
download("standing",10,2710,6306)